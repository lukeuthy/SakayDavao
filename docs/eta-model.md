# ETA Model — Training & Synthetic-Data Spec

The app's ETA engine (`src/utils/eta.js`) tries an ONNX model first, then falls back to
historical crowd reports, then to linear interpolation. The model file is **not shipped** —
drop a trained model at `public/model/eta_model.onnx` and it loads automatically (no code
change). This document specifies exactly what the model must look like and what synthetic
data to add to your real ride data before training.

## Contract the model must satisfy

`src/model/inference.js` feeds a single `float32` input tensor of shape **`[1, 8]`** and
reads one scalar output (ETA in minutes). The feature order is fixed — it MUST match:

| # | Feature         | Meaning                                              | Range / encoding |
|---|-----------------|------------------------------------------------------|------------------|
| 0 | `fromStopIdx`   | Boarding stop index on the route                     | 0 … N-1          |
| 1 | `toStopIdx`     | Target stop index (`> fromStopIdx`)                  | 1 … N-1          |
| 2 | `totalStops`    | Total stops on the route (`route.stops.length`)      | integer          |
| 3 | `hour`          | Local hour of day                                    | 0 … 23           |
| 4 | `minute`        | Local minute                                         | 0 … 59           |
| 5 | `dayOfWeek`     | `Date.getDay()`                                      | 0 (Sun) … 6 (Sat)|
| 6 | `routeEncoded`  | Route id code (see below)                            | 0 … 8            |
| 7 | `historicalAvg` | Avg minutes from local crowd reports for the segment | minutes (float)  |

**Target:** `etaMinutes` — travel time from `fromStopIdx` to `toStopIdx`.

### `routeEncoded` map (from `src/utils/eta.js`)

```
R102=0  R103=1  R402=2  R403=3  R503=4  R603=5  R763=6  R783=7  R793=8
```

Keep this in sync with `routeEncode()` in `eta.js` if routes change.

## What synthetic data to add

Your real ride data likely covers only some routes / times. Augment it so the model
generalizes across every `(route, segment, time)` combination the app can request:

1. **Cover all segments.** For each route, generate samples for many `(fromStopIdx,
   toStopIdx)` pairs with `fromStopIdx < toStopIdx`, including the full-route pair
   `(0, N-1)`.
2. **Base travel time.** Derive a per-route base speed from the documented `durationRange`
   in `src/utils/routeHelpers.js` (`DURATION_LOOKUP`): a full traversal takes
   `avg(durationRange)` minutes, so a segment of fraction `f = (to-from)/(totalStops-1)`
   has base `f * avgDuration`.
3. **Time-of-day multipliers.** Apply peak-hour congestion factors — e.g. ×1.25–1.4 during
   AM peak (06:00–08:00) and PM peak (17:00–19:00), ×1.0 off-peak.
4. **Day-of-week factors.** Slightly faster on weekends (e.g. ×0.9); heavier Mon/Fri.
5. **Noise.** Add Gaussian jitter (σ ≈ 10–15% of the base) so the model learns a
   distribution, not a lookup table.
6. **Edge / negative cases.** Include `from == to` (target 0) and very short segments so the
   model behaves at the boundaries.
7. **`historicalAvg` feature.** During training set it to a noisy version of the target (it
   mirrors what the app passes at inference); leave it at the interpolated value when no
   crowd data exists, matching `eta.js`'s `historicalAvg(...) ?? avgMin * segmentFraction`.

## Export to ONNX

Train any regressor (XGBoost / sklearn). Export with fixed input shape `[1, 8]`:

```python
# pip install skl2onnx onnxmltools
from skl2onnx import convert_sklearn
from skl2onnx.common.data_types import FloatTensorType

onnx_model = convert_sklearn(
    model,
    initial_types=[("input", FloatTensorType([1, 8]))],
)
with open("public/model/eta_model.onnx", "wb") as f:
    f.write(onnx_model.SerializeToString())
```

(For XGBoost use `onnxmltools.convert_xgboost` with the same `initial_types`.)

## Verify

1. Place the file at `public/model/eta_model.onnx`.
2. `npm run dev`, open a route, tap a stop. The ETA source chip should read **“AI model”**
   instead of “Route estimate”, and the console logs `[ONNX] Model loaded successfully`.
3. If loading or inference fails, the app silently falls back to interpolation — check the
   console for `[ONNX]` warnings.
