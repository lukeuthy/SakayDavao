# SakayDavao

**Know when your bus arrives — even offline.**

SakayDavao is an offline-first Progressive Web App (PWA) that estimates bus arrival
times (ETAs) for Davao City's free **DC Bus** routes. After the first load it works
entirely without internet: route maps, stops, and ETA estimates are all available
offline, and the app installs to the home screen like a native app.

There are no user accounts. User data (favorites, ride contributions) stays on the
device in `localStorage`; contributions optionally sync to a small AWS backend.

---

## Repository layout (client / server)

This repo is split so the two halves deploy **independently** on AWS:

```
SakayDavao/
├─ client/        # The Vite + React PWA — the entire frontend.
│  ├─ src/        #   app code (components, pages, hooks, utils, model)
│  │  └─ data/routes/   # bundled route JSON (git submodule)
│  ├─ public/     #   static assets (icons, ONNX wasm copied at build)
│  ├─ scripts/    #   build helpers (copy wasm, generate icons)
│  ├─ Dockerfile, nginx.conf   # self-host image (alternative to Amplify)
│  ├─ vite.config.js, package.json, pnpm-lock.yaml, .env.example …
│  └─ e2e/        #   Playwright tests
├─ server/        # The AWS backend (SAM): API Gateway → Lambda → S3.
│  ├─ template.yaml          # infra as code (heavily commented)
│  ├─ contributions/index.mjs# Lambda handler
│  └─ README.md              # deploy guide + "which env key lives where" matrix
├─ docs/          # ETA model spec, generated documentation
├─ docker-compose.yml        # runs the client image (build context: ./client)
└─ .github/workflows/        # CI (builds/tests the client)
```

- **Hosting:** the client goes on **Amplify Hosting** (app root = `client/`); the
  server is deployed with **`sam deploy`** from `server/`. Neither depends on the
  other being co-located. Full steps: [`server/README.md`](server/README.md).

---

## Quick start (client)

Prerequisites: **Node.js 20+** and **pnpm** (`npm i -g pnpm`, or `corepack enable`).

```bash
git clone --recurse-submodules https://github.com/lukeuthy/SakayDavao.git
cd SakayDavao/client
pnpm install
pnpm dev          # local dev server (prints a QR for phone testing)
pnpm dev:host     # same, exposed on your LAN
```

> Already cloned without `--recurse-submodules`? Run `git submodule update --init`.
> Route data lives in the `client/src/data/routes` submodule.

Build / preview:

```bash
pnpm build        # → client/dist/  (copies wasm, generates icons, vite build)
pnpm preview
```

### Client scripts

| Script | Description |
| --- | --- |
| `pnpm dev` / `pnpm dev:host` | Dev server (copies ONNX wasm first); `:host` exposes it on the LAN |
| `pnpm build` | Copy wasm, generate icons, build to `dist/` |
| `pnpm preview` / `pnpm preview:host` | Preview the production build |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm test` / `pnpm test:watch` | Vitest unit tests |
| `pnpm test:e2e` | Playwright end-to-end tests |

---

## The server (AWS contributions backend)

Ride contributions optionally sync to AWS through `server/`:

```
Browser ──POST──▶ API Gateway (HTTP API) ──▶ Lambda (validate) ──▶ S3
```

It is **public by design** (no accounts) and hardened with request throttling,
reserved Lambda concurrency, a CORS origin lock, and a private, encrypted, TLS-only,
self-expiring S3 bucket. Deploy and security details — and the table of exactly which
environment key lives on the client vs. the server — are in
[`server/README.md`](server/README.md).

---

## Environment variables

All client config is **optional** and **build-time** (Vite inlines `VITE_*` into the
public bundle — so never put secrets there). Copy `client/.env.example` to
`client/.env`. With nothing set, the app runs fully offline on bundled data.

| Variable | Purpose | When unset |
| --- | --- | --- |
| `VITE_CONTRIBUTIONS_API_URL` | The `ApiUrl` from the SAM stack | Contributions stay in `localStorage` only |
| `VITE_ROUTES_URL` | Remote route feed you control (opt-in) | Bundled seed routes; **no** route fetch |
| `VITE_REALTIME_URL` | Live vehicle feed | Schedule-based simulated buses |
| `VITE_DEV_ALLOWED_HOSTS` | Dev-server tunnel host(s), comma-separated | No extra dev hosts allowed |

See `client/.env.example` for the full annotated list.

---

## Docker (self-hosting the client)

A multi-stage build compiles the PWA and serves it with nginx (security headers + CSP
included). The build context is the `client/` folder.

```bash
# from the repo root:
docker compose up --build           # → http://localhost:8080

# …or directly:
docker build -t sakaydavao ./client
docker run -p 8080:80 sakaydavao
```

Optional feeds are baked at build time (Vite inlines `VITE_*`):

```bash
docker build \
  --build-arg VITE_CONTRIBUTIONS_API_URL="https://xxxx.execute-api.ap-southeast-1.amazonaws.com/contributions" \
  --build-arg VITE_ROUTES_URL="https://example.com/routes.json" \
  -t sakaydavao ./client
```

---

## How ETA estimation works

ETAs are computed client-side in `client/src/utils/eta.js`, trying each source in order:

1. **Crowd aggregate** — everyone's anonymous boarding reports, rolled up server-side
   (the `server/` Lambda) into a small `eta-latest.json` the app reads back. This is the
   data flywheel: more riders → better ETAs for everyone. Needs `VITE_CONTRIBUTIONS_API_URL`.
2. **Your own history** — your locally stored ride reports (≥3 points), used offline or
   before the crowd has data for a segment.
3. **Linear interpolation** — scales each route's known duration range. Always available.

The app deliberately ships **no ML model** — the crowd average beats blind interpolation
without the weight of an in-browser inference runtime.

---

## Design constraints

- **No accounts.** All user data lives in `localStorage`; the optional AWS backend only
  stores anonymous ride contributions.
- **`HashRouter`** — for static hosting compatibility.
- **Offline-first** — fully usable after the first load.
- **Graceful degradation** — missing ONNX model, no feeds, no geolocation, or no network
  all fall back cleanly.

## License

See route data licensing in `client/src/data/routes/LICENSE`. Project license: TBD.
