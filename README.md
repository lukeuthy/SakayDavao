# SakayDavao

**Know when your bus arrives — even offline.**

SakayDavao is an offline-first Progressive Web App (PWA) that estimates bus arrival times (ETAs) for Davao City's free **DC Bus** routes. After the first load it works entirely without an internet connection: route maps, stops, and ETA estimates are all available offline, and the app can be installed to your home screen like a native app.

There are no accounts and no backend — everything you do (favorites, ride contributions) stays on your device.

---

## Features

- **9 free DC Bus routes** — R102, R103, R402, R403, R503, R603, R763, R783, R793, each with separate AM and PM schedules.
- **Offline-first** — full functionality after the first visit, powered by a Workbox service worker.
- **Installable PWA** — add to home screen on Android, iOS, and desktop, with an in-app install banner and an iOS-specific install guide.
- **Trip planner (A→B)** — pick a start and destination stop and get matching itineraries, including single-transfer trips, with per-leg and total ETA. Fully client-side over the bundled route data.
- **Live route maps** — interactive Leaflet maps showing the full route path, stops, and direction of travel.
- **Live / simulated buses** — moving bus markers on the map. Uses an external real-time feed when one is configured (`VITE_REALTIME_URL`); otherwise shows schedule-based **simulated** buses, clearly labelled as such.
- **ETA estimation** — predicts minutes-to-arrival between any two stops, with a layered strategy:
  1. **ONNX model** inference (when a model is provided), then
  2. **Historical averages** from your own ride contributions (≥3 data points), then
  3. **Linear interpolation** from each route's known duration range (always available).
- **Nearest-stop detection** — uses geolocation to find the closest stop to you.
- **Favorites** — save routes for quick access, stored in `localStorage`.
- **Ride contributions** — log when you board to improve local ETA accuracy over time; full contribution history with the ability to clear data.
- **Operating-hours awareness** — routes reflect their AM/PM service windows.
- **Online/offline indicator** and graceful fallback to cached/seed data.
- **Production hardening** — app-level error boundary, a service-worker "new version available" prompt, lazy-loaded route chunks, and accessibility (focus rings, ARIA live regions).

---

## Tech Stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Framework      | React 18                                          |
| Build tool     | Vite 6                                            |
| Routing        | React Router v6 (`HashRouter` for static hosting) |
| PWA            | `vite-plugin-pwa` (Workbox)                       |
| Maps           | Leaflet + React-Leaflet                           |
| ML inference   | ONNX Runtime Web (WASM)                           |
| Storage        | Browser `localStorage` only — no backend          |
| Testing        | Vitest (unit) + Playwright (e2e)                  |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

This copies the ONNX WASM runtime into `public/onnx/` and starts the Vite dev server. A QR code is printed to the terminal (via `vite-plugin-qrcode`) for quick testing on a phone — or use `npm run dev:host` to expose the server on your local network.

### Build for production

```bash
npm run build
```

The build step copies the ONNX WASM files, generates PWA icons, and produces a static bundle in `dist/`.

### Preview the production build

```bash
npm run preview
```

---

## Scripts

| Script               | Description                                                  |
| -------------------- | ------------------------------------------------------------ |
| `npm run dev`        | Start the dev server (copies ONNX WASM first)                |
| `npm run dev:host`   | Same as `dev`, exposed on the local network                  |
| `npm run build`      | Copy WASM, generate icons, and build to `dist/`              |
| `npm run preview`    | Preview the production build locally                         |
| `npm run preview:host` | Preview, exposed on the local network                     |
| `npm run lint`       | Run ESLint                                                   |
| `npm run test`       | Run unit tests once (Vitest)                                 |
| `npm run test:watch` | Run unit tests in watch mode                                 |
| `npm run test:e2e`   | Run end-to-end tests (Playwright)                            |

---

## Docker

A multi-stage build compiles the PWA and serves the static output with nginx, so it
runs identically wherever Docker runs.

```bash
# Build + run (http://localhost:8080)
docker compose up --build

# …or with plain Docker
docker build -t sakaydavao .
docker run -p 8080:80 sakaydavao
```

Optional external feeds are baked at build time (Vite inlines `VITE_*`):

```bash
docker build \
  --build-arg VITE_ROUTES_URL="https://example.com/routes.json" \
  --build-arg VITE_REALTIME_URL="https://example.com/vehicles.json" \
  -t sakaydavao .
```

`nginx.conf` serves the HashRouter SPA, sends `no-cache` for `index.html`/`sw.js` (so PWA
updates reach users), long-caches hashed assets, and sets the correct `application/wasm`
MIME. It deliberately omits COOP/COEP headers (those would block OpenStreetMap tiles and
Google Fonts; ONNX runs single-threaded, which is fine).

> **Note:** Docker makes the *server* identical everywhere — it does **not** change how a
> given device's browser renders the app. iOS Safari (WebKit) differences are handled in the
> app's CSS/markup, not here.

---

## Project Structure

```
SakayDavao/
├─ public/
│  ├─ icons/              # PWA icons (generated) and SVG source
│  └─ onnx/               # ONNX Runtime WASM binaries (copied at build)
├─ scripts/
│  ├─ copyOnnxWasm.js     # Copies onnxruntime-web WASM into public/onnx
│  ├─ generateIcons.js    # Generates PWA PNG icons from the SVG source
│  └─ genSeedRoutes.js    # Helper to (re)generate seed route data
├─ src/
│  ├─ components/         # Reusable UI (RouteCard, RouteMap, ErrorBoundary, UpdatePrompt…)
│  ├─ pages/              # Home, Routes, TripPlanner, RouteDetail, Favorites, History
│  ├─ hooks/              # useRoutes, useLiveBuses, useRealtime, useFavorites, …
│  ├─ utils/              # eta, tripPlanner, busSim, routeHelpers, operatingHours (+ tests)
│  ├─ model/             # inference.js — ONNX wrapper with graceful fallback
│  ├─ data/routes/        # Bundled seed route JSON (R1xx–R7xx, AM/PM)
│  ├─ App.jsx             # Layout, navigation, lazy routes, error boundary
│  └─ main.jsx            # App entry / SW registration
├─ docs/eta-model.md      # ETA model contract + synthetic-data spec for training
├─ .env.example           # Optional VITE_ROUTES_URL / VITE_REALTIME_URL feeds
├─ index.html             # App shell + instant launch splash screen
└─ vite.config.js         # Vite + PWA (Workbox) + QR configuration
```

---

## Environment Variables

All optional — copy `.env.example` to `.env`. With none set, the app runs fully offline on
bundled data.

| Variable            | Purpose                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `VITE_ROUTES_URL`   | Remote route-data feed; falls back to bundled seed routes when absent.   |
| `VITE_REALTIME_URL` | Real-time vehicle feed for live buses; falls back to simulation absent.  |

---

## How ETA Estimation Works

ETAs are computed client-side in `src/utils/eta.js`. For a trip from one stop to another, the app tries each source in order and uses the first that succeeds:

1. **ONNX model** — if `public/model/eta_model.onnx` is present, an 8-feature input
   (`fromStopIdx`, `toStopIdx`, `totalStops`, `hour`, `minute`, `dayOfWeek`, `routeEncoded`, `historicalAvg`)
   is fed to the model. No model is shipped by default; the loader fails silently when absent.
2. **Historical averages** — derived from your locally stored ride contributions for that route, once at least 3 usable data points exist.
3. **Linear interpolation** — scales each route's known duration range by the fraction of the route traveled. This always produces an estimate.

### Adding a real ETA model

Place a trained model at `public/model/eta_model.onnx`. It must accept a `float32` input tensor of shape `[1, 8]` matching the feature order above and output a single ETA value in minutes. The app loads it automatically on first inference and falls back gracefully if loading or inference fails.

See **[docs/eta-model.md](docs/eta-model.md)** for the full model contract, the
`routeEncoded` map, the synthetic-data augmentation recipe, and the `skl2onnx` export steps.

---

## Trip Planner

`/plan` lets a rider pick an origin and destination stop and returns ranked itineraries
(`src/utils/tripPlanner.js`). Stops at (roughly) the same location across routes are merged
into shared **places**, which become transfer points. The planner searches **direct** rides
and **single-transfer** trips, scoring each leg with the same ETA engine, and ranks by
fewest transfers then total time.

## Live & Simulated Buses

The route map shows moving bus markers (`src/hooks/useLiveBuses.js`):

- **Live** — when `VITE_REALTIME_URL` is set and returns vehicles for the route
  (`src/hooks/useRealtime.js`). The JSON adapter is documented in that file; a
  GTFS-Realtime protobuf adapter can be slotted in later.
- **Simulated** — otherwise, buses are interpolated along the route polyline from the
  schedule (`src/utils/busSim.js`): one departs every ~15 min and takes the route's average
  duration. The map legend always shows which source is active, so simulated buses are never
  passed off as real tracking.

---

## Route Data

Route definitions live in `src/data/routes/` as JSON files (one per route per AM/PM period). Each file contains ordered `points` flagged as `stop` or `waypoint`, with coordinates and headings used to draw the map path and direction markers.

These bundled files act as **seed data**. At runtime, `useRoutes` optionally fetches a remote routes feed and caches it in `localStorage`; set `VITE_ROUTES_URL` in a `.env` file to point at a real endpoint. When the remote feed is unset or unreachable, the app silently falls back to the bundled seed data — so it always works offline.

---

## Design Constraints

- **No accounts, no custom backend** — all user data lives in `localStorage`. The app may *read* optional external feeds (routes, real-time vehicles) but never runs a backend of its own.
- **`HashRouter`** — for compatibility with static hosting (e.g. GitHub Pages).
- **Offline-first** — the app must remain fully usable after the first load.
- **Graceful degradation** — missing ONNX model, no real-time feed, no geolocation permission, or no network all fall back cleanly.

---

## License

See route data licensing in `src/data/routes/LICENSE`. Project license: TBD.
