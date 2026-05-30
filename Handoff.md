# SakayDavao — Handoff

## Build status
`npm run build` → exits 0 ✅

## What's built

### Core app
- React + Vite PWA (vite-plugin-pwa, workbox SW)
- oklch design system, Geist font
- React Router v6 with 5 routes

### Pages
| Route | File | Notes |
|---|---|---|
| `/` | `Home.jsx` | Greeting, sync status tagline, favorites/recent/all routes |
| `/routes` | `RoutesPage.jsx` | Search + AM/PM filter, RouteCard list |
| `/favorites` | `FavoritesPage.jsx` | Saved routes, empty state |
| `/route/:num/:period` | `RouteDetail.jsx` | Stop timeline + Map view (Leaflet), ETA hero, Bus-here contributions |
| `/history` | `ContributionHistory.jsx` | Contributions grouped by date, clear-all |

### Data & hooks
| File | Purpose |
|---|---|
| `src/data/routes/*.json` | 18 seed files (9 routes × AM/PM) — Davao City jeepney corridors |
| `src/hooks/useRoutes.js` | Seed data + remote sync (`sakay_remote_routes` LS key), returns `lastUpdated`, `isOnline`, `syncLoading` |
| `src/hooks/useFavorites.js` | localStorage-backed favorites (`sakay_favorites`) |
| `src/hooks/useContributions.js` | Bus-arrival reports, capped at 500 (`sakay_contributions`) |
| `src/hooks/useInstallPrompt.js` | `beforeinstallprompt` hook, dismissal persisted to `sakay_a2hs_dismissed` |
| `src/utils/eta.js` | ETA estimation: ONNX → historical → linear interpolation |
| `src/model/inference.js` | ONNX Runtime Web wrapper (graceful fallback if model absent) |

### Components
- `RouteCard.jsx` — Elmov-style card with AM/PM action buttons + fav toggle
- `RouteMap.jsx` — Leaflet map, stop markers, bottom sheet with ETA + actions
- `InstallBanner.jsx` — A2HS prompt banner (above bottom nav)
- `SearchBar.jsx`, `Toast.jsx`

## Feature checklist

- [x] `npm run build` exits 0
- [x] All 9 routes bundled as seed data (18 JSON files)
- [x] Bottom nav (Home / Routes / Saved / History)
- [x] Route detail: List view + Map view (Leaflet)
- [x] ETA hero + stop-card timeline
- [x] Contributions ("Bus here" → localStorage)
- [x] Contribution history page (grouped by date, clear-all)
- [x] Favorites persist to localStorage
- [x] oklch design system + Elmov BusOptionCard style
- [x] **F1 — A2HS Install Prompt** (`useInstallPrompt` + `InstallBanner`, dismissal persisted)
- [x] **F2 — `.contribution-body` CSS** (flex column wrapper for history items)
- [x] **F3 — Sync status UX** (Home tagline shows "Updated X min ago" / "Syncing…" / "Offline")
- [x] **F4 — Offline UX indicator** (sticky `.offline-bar` in app shell)
- [ ] **ONNX model** — place `eta_model.onnx` in `public/model/`; fallback (linear interp) already works
- [ ] **GPS accuracy** — real-world stop coordinates need field verification
- [ ] **Remote endpoint** — `REMOTE_URL` in `useRoutes.js` is a placeholder; silent fallback works

## Skipped / out of scope
- ONNX training: needs Python + real trip timing data
- GPS coordinate accuracy: seed stops are approximate; need survey
- Remote data endpoint: placeholder GitHub raw URL; deploy own JSON endpoint when ready

## Running locally
```bash
npm install
npm run dev       # Vite dev server on :5173
npm run build     # Production build → dist/
```
