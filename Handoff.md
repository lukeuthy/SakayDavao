# SakayDavao — Session Handoff

## Project Goal
Build a complete, production-ready PWA called **SakayDavao** using React + Vite. It is an **offline-first bus ETA estimator** for Davao City's free bus routes. No user accounts. All user data stored in localStorage only.

---

## Current State

### Tech Stack
- React 18 + Vite 6 + vite-plugin-pwa (Workbox, generateSW)
- React Router v6 with HashRouter
- Leaflet + react-leaflet for interactive map
- ONNX Runtime Web (`onnxruntime-web`) — ETA inference, falls back to linear interpolation
- localStorage for all persistent user data (favorites, contributions)
- Geist + Geist Mono + Instrument Serif fonts (Google Fonts)
- oklch design tokens (Elmov/prototype design system)

### Feature Status

| Feature | File(s) | Status |
|---|---|---|
| App shell + HashRouter | `src/App.jsx` | ✅ |
| Top nav (desktop ≥768px) — sticky, glass blur, brand + 4 links | `src/App.jsx`, `src/index.css` | ✅ |
| Bottom nav (mobile only, hidden on route detail pages) | `src/App.jsx`, `src/index.css` | ✅ |
| 9 DC Bus routes bundled as seed JSON (R102–R793) | `src/data/routes/*.json`, `src/hooks/useRoutes.js` | ✅ |
| Remote route sync from GitHub (NetworkFirst, silent fallback) | `src/hooks/useRoutes.js` | ✅ |
| Route list page with search + AM/PM period toggle | `src/pages/RoutesPage.jsx` | ✅ |
| Favorites (heart toggle, persisted to localStorage) | `src/pages/FavoritesPage.jsx`, `src/hooks/useFavorites.js` | ✅ |
| Route detail: List view with ETA hero + stop-card timeline | `src/pages/RouteDetail.jsx` | ✅ |
| Route detail: Map view (Leaflet + OSM, custom divIcon stops, bottom sheet) | `src/pages/RouteDetail.jsx`, `src/components/RouteMap.jsx` | ✅ |
| Bus arrival contribution logging → localStorage | `src/hooks/useContributions.js` | ✅ |
| Contribution history page (grouped by date, two-tap clear-all) | `src/pages/ContributionHistory.jsx` | ✅ |
| ETA engine: ONNX → historical → linear interpolation | `src/utils/eta.js`, `src/model/inference.js` | ✅ |
| Toast notification system | `src/hooks/useToast.js`, `src/components/Toast.jsx` | ✅ |
| PWA manifest + Workbox service worker | `vite.config.js` | ✅ |
| ONNX WASM files copied to `public/onnx/` via prebuild script | `scripts/copyOnnxWasm.js` | ✅ |
| PWA icons generated programmatically | `scripts/generateIcons.js` | ✅ |
| oklch design system + radial gradient bg + Elmov BusOptionCard | `src/index.css` | ✅ |
| RouteCard: BusOptionCard (icon + body + right + AM/PM actions) | `src/components/RouteCard.jsx` | ✅ |
| Stop cards: tappable card with stop number + ETA inline | `src/pages/RouteDetail.jsx` | ✅ |
| **A2HS Install Prompt** (beforeinstallprompt, dismissible, mobile-only) | `src/hooks/useInstallPrompt.js`, `src/components/InstallBanner.jsx`, `src/App.jsx` | ✅ |
| **Offline indicator bar** (shown when navigator.onLine = false) | `src/App.jsx`, `src/index.css` | ✅ |
| **Sync status tagline on Home** (`timeAgo(lastUpdated)`) | `src/pages/Home.jsx` | ✅ |
| **`.contribution-body` CSS** (flex column wrapper for history items) | `src/index.css` | ✅ |
| **Full-width desktop layout** (≥768px: top nav, card grid, page-header centering) | `src/index.css`, `src/App.jsx`, all pages | ✅ |

### Build Status
`npm run build` exits 0 (119 modules). Chunk size warning (865 KB JS + 26 MB ONNX wasm) — warning only, not blocking.

### UI De-Slop + Splash + Geolocation (Session 3 — 2026-06-02)
Goal: stop the UI looking like "AI slop," fix landing-page alignment, add a launch splash, and finish location permissions.

| Change | File(s) |
|---|---|
| **Launch splash screen** — inline-styled `#splash` overlay in `index.html` paints instantly on cold start (before JS): frosted bus logomark, "SakayDavao" wordmark, tagline, pulsing dots, brand-green gradient. Uses hard-coded hex (not CSS vars) so it renders pre-stylesheet. `prefers-reduced-motion` aware. | `index.html` |
| **Splash dismissal** — `main.jsx` fades + removes the splash after React paints (double-`requestAnimationFrame`), with a 700ms minimum floor. Does NOT wait on `window.load` (would block on fonts/wasm). | `src/main.jsx` |
| **Central SVG icon set** — replaces ALL emoji-as-icons (🔍 ♡ 🚌 ⚠️ 🤖 📊 📐). | **NEW** `src/components/Icons.jsx` |
| **Unified EmptyState** — SVG-in-soft-circle, used by Routes/Favorites/History (was 3 different emoji empty states). | **NEW** `src/components/EmptyState.jsx` |
| **Warm landing hero** — replaced redundant "SakayDavao" greeting with Bisaya greeting + "Know when your bus arrives." headline + status subline + full-width "Search routes or stops…" entry linking to Routes. | `src/pages/Home.jsx`, `src/index.css` (`.home-hero`, `.home-search-entry`) |
| **Shared page-title system** — `.page-title`/`.page-subtitle` replace 3 ad-hoc inline `fontSize:20` headers. | `src/index.css`, RoutesPage/FavoritesPage/ContributionHistory |
| **Inline-style cleanup** — dashed "View all" box → `.view-all-link`; QuickCard/QuickRouteRow inline styles → classes; ETA-source emoji badges → `.eta-source-chip` (AI/Crowd/Estimate). | `src/pages/Home.jsx`, `src/components/RouteMap.jsx`, `src/index.css` |
| **Global `:focus-visible` ring** — keyboard-only focus outline (was missing; flagged critical by design pass). | `src/index.css` |
| **Denser Home route rows** — added duration + stop count stats and a right-aligned destination block so the landing page no longer looks empty/sparse. | `src/pages/Home.jsx`, `src/index.css` |

**Geolocation (from Session 2/3):** `src/hooks/useGeolocation.js` (permission lifecycle), `haversineMeters`/`nearestStop`/`formatDistance` in `routeHelpers.js`, "Find my nearest stop" button + `handleLocate` in `RouteDetail.jsx`, blue user-dot marker + locate button in `RouteMap.jsx`. **Caveat:** geolocation needs a secure context (HTTPS or `localhost`) — testing over plain `http://<LAN-IP>:5173` on a phone will fail.

**Map bottom-sheet fix (Session 3):** `.route-map-wrap .leaflet-container { z-index: 0 }` traps Leaflet's internal pane z-indexes (tiles 200, markers 600) inside the map's stacking context so the bottom sheet (z-index 100) renders on top instead of buried.

### iOS A2HS Guide + REMOTE_URL env + verification (Session 4 — 2026-06-03)
Goal: ship an iOS install affordance (iOS Safari never fires `beforeinstallprompt`), make the routes endpoint configurable, and verify the desktop split + offline behavior.

| Change | File(s) |
|---|---|
| **iOS platform detection** — `isIos()` (UA + iPadOS-13-as-desktop via `MacIntel`+`maxTouchPoints`) and `isInStandaloneMode()` (`navigator.standalone` + `display-mode: standalone`). | **NEW** `src/utils/platform.js` |
| **iOS A2HS guide state** — `useInstallPrompt` now also returns `showIosGuide` (`isIos() && !standalone && !dismissed`) + `dismissIos()`, using a separate localStorage key `sakay_ios_install_dismissed` so Android/iOS dismissals are independent. Android API unchanged. | `src/hooks/useInstallPrompt.js` |
| **iOS install guide sheet** — dismissible bottom sheet: "Install SakayDavao → Tap the Share ⬆ button, then Add to Home Screen." Inline Share-square SVG. Mirrors `InstallBanner.jsx` structure; reuses `.install-banner-*` sub-element classes. | **NEW** `src/components/IosInstallGuide.jsx`, `src/App.jsx` (renders it after `<InstallBanner />`) |
| **`.ios-install-guide` CSS** — clones `.install-banner` positioning/glass; `.ios-share-icon` inline; hidden at ≥640px (mobile-only, same as Android banner). | `src/index.css` |
| **Configurable routes endpoint** — `REMOTE_URL` now reads `import.meta.env.VITE_ROUTES_URL` with the old placeholder as fallback. Set `VITE_ROUTES_URL` in `.env` to point at a real endpoint with no code change. Inert until set. | `src/hooks/useRoutes.js` |

**Verification (Session 4):**
- `npm run build` → exit 0, 121 modules (was 119), SW precaches 12 entries. Chunk-size warning only (unchanged).
- `npm run preview` smoke test → `/`, `/sw.js`, `/manifest.webmanifest` all HTTP 200; splash overlay present in served HTML.
- **Desktop split (handoff #6) confirmed ALREADY implemented** — `RouteDetail.jsx:174-336` (`.detail-columns`/`.detail-col-list`/`.detail-col-map`/`hidden-mobile`) + `src/index.css:1072-1114` (row layout ≥768px, list ~440px + flex map). The old "What's Lacking #6" was stale and is removed.
- **Not yet done in a real browser** (need DevTools, can't drive headlessly): iPhone-UA emulation to see the guide appear/dismiss-persist; Network→Offline reload to confirm cached serving. Logic is verified by inspection + build.

### Unit testing — Vitest (Session 5 — 2026-06-03)
Goal: first automated tests for the app (none existed before). Vitest chosen (shares Vite tooling, near-zero config). Scoped to the pure `utils/` — the deterministic, no-DOM/no-network logic that's the natural unit-test target.

| Item | File(s) |
|---|---|
| **Vitest + jsdom** added as devDeps; scripts `test` (`vitest run`) and `test:watch` (`vitest`). | `package.json` |
| **Isolated test config** — separate `vitest.config.js` (NOT vite.config.js) so the PWA/ONNX build pipeline doesn't load during tests. Default env `node` for speed; files needing a DOM opt in per-file via `// @vitest-environment jsdom`. | `vitest.config.js` |
| **routeHelpers tests** — `haversineMeters` (distance/symmetry), `formatDistance`, `formatStopName`, `nearestStop`, `buildRouteGroups`/`getRouteData`/`getStops`. | `src/utils/routeHelpers.test.js` |
| **operatingHours tests** — `parseTime`, `isRouteActive`, AM/PM helpers, `suggestedPeriod`, `formatOperatingHours`/`periodWindowLabel`. Uses `vi.setSystemTime()` to freeze the clock (these functions call `new Date()` internally). | `src/utils/operatingHours.test.js` |
| **platform tests** (jsdom) — `isIos()` across iPhone/iPad/iPadOS-desktop/Mac/Android/Windows UAs; `isInStandaloneMode()`. Stubs `navigator`/`matchMedia` via `vi.stubGlobal`. | `src/utils/platform.test.js` |
| **eta tests** — `formatETA`, `formatConfidence`, and the linear-interpolation path of `estimateETA`/`estimateAllETAs`. Mocks `../model/inference.js` (`runOnnxInference → null`) to force the deterministic fallback. | `src/utils/eta.test.js` |

**Result:** `npm test` → 4 files, **48 tests, all passing**, ~5.7s.
**Run it:** `npm test` (once) or `npm run test:watch` (re-run on change).
**Not covered (deliberately):** component/page rendering (would need `@testing-library/react` + Leaflet/ONNX mocking) and end-to-end flows (offline SW, iOS guide in a real browser) — that's the **Playwright** layer, not yet set up. See "Where to Go From Here".

### E2E smoke tests — Playwright (Session 6 — 2026-06-03)
Goal: cover the two flows that can't be unit-tested — offline service worker and the iOS install guide in a real browser engine — plus core navigation.

| Item | File(s) |
|---|---|
| **Playwright + browsers** added as devDep (`@playwright/test`); Chromium + WebKit binaries installed. Script `test:e2e` (`playwright test`) added. | `package.json` |
| **Config** — runs against the PRODUCTION build (`webServer: npm run build && npm run preview -- --port 4173`) because the SW only exists in the built output. Two projects: `desktop-chromium` (Desktop Chrome) and `mobile-safari` (`devices['iPhone 13']` → WebKit + iOS UA). | `playwright.config.js` |
| **Smoke specs (6 tests × 2 projects)** — home hero loads; navigate home → route detail (asserts `.stop-list`, layout-agnostic); routes page lists `.route-badge`; Leaflet map renders (desktop shows it directly, mobile clicks the Map tab); **offline-via-SW** (chromium only); **iOS guide shows only on iOS**. | `e2e/smoke.spec.js` |
| **gitignore** — added `/test-results/`, `/playwright-report/`, `/playwright/.cache/`. | `.gitignore` |

**Result:** `npx playwright test` → **11 passed, 1 skipped (~52s)**. The offline + iOS tests pass — these are the two items earlier sessions flagged as "not verified in a real browser."

**Gotchas hit & fixed (useful for future tests):**
- The List/Map `.view-tabs` toggle is `display:none` on desktop (`index.css:1108`) — both columns show at once. Tests must be layout-aware (gate the Map-tab click on `project.name === 'mobile-safari'`).
- A `test.skip()` inside the body still sets up the `page` fixture first; on WebKit that `newPage` hung. Fix: gate project-specific tests on the cheap `browser` fixture and create the page manually only on the running path (see the offline test).

### UI Overhaul (Session 2 — 2026-06-01)
Applied Elmov/SakayDavao prototype design language from the claude.ai/design handoff bundle:

| Change | File(s) |
|---|---|
| **Force light mode** — removed all `prefers-color-scheme: dark` CSS blocks | `src/index.css` |
| **Single offline bar** — was rendering twice on mobile (TopNav sibling + BottomNav sibling) | `src/App.jsx`, `src/index.css` |
| **RouteCard → BusOptionCard pattern** — leaf "Free" pill, clock+duration, stop count, destination shortname in right | `src/components/RouteCard.jsx`, `src/index.css` |
| **Home header redesign** — transparent background, "Magandang [period]·" subtitle + "SakayDavao" hero title | `src/pages/Home.jsx`, `src/index.css` |
| **RouteDetail desktop 2-column split** — ≥768px: stop list (440px left col, scrollable) + map (flex right col, pinned); mobile: unchanged toggle behavior | `src/pages/RouteDetail.jsx`, `src/index.css` |
| **Map "breaks after pressing" fix** — `useIsDesktop` hook gates RouteMap mount (`shouldMountMap = isDesktop || view === 'map'`). The 2-column change left RouteMap mounted inside a `display:none` column on mobile; Leaflet measured a 0×0 container at init → dead map. Now it only mounts when its container is visible. | `src/pages/RouteDetail.jsx` |
| **`react-leaflet` 5.0.0 → 4.2.1** — v5 peer-requires React 19; project runs React 18.3.1 (was force-installed via `--legacy-peer-deps`). v4 officially supports React 18 and is API-identical for the components used (`MapContainer`, `TileLayer`, `Marker`, `Polyline`, `useMap`). `npm install` now runs clean with **no `--legacy-peer-deps`**. | `package.json`, `package-lock.json` |

### Desktop Responsiveness
On screens ≥ 768px:
- `.app` is full-width (`max-width: none`) — genuine full-browser layout, not a phone card
- Sticky top nav appears (glass/blur, brand icon + 4 links); bottom nav hides via CSS
- `.page-content` centers content at `max-width: 1200px` with `padding: 0 32px`
- Route cards display in a 2-column CSS grid (3-column at ≥1200px)
- `.page-header` (RoutesPage / FavoritesPage / ContributionHistory) is sticky below the top nav (`top: var(--topnav-height)`) with `.page-header-inner` centering inner content
- Search bar follows the same `max-width: 1200px` centering
- All 18px mobile horizontal margins zeroed out at ≥768px; grid gap handles card spacing
- Mobile: full-screen bottom-nav layout unchanged

---

## What's Lacking

1. **ONNX model file** — `public/model/eta_model.onnx` does not exist. ETA always uses linear interpolation (`source: 'estimate'`). To enable AI inference, place a trained XGBoost → ONNX model at `public/model/eta_model.onnx`. Input shape `[1, 8]`: `[fromStopIdx, toStopIdx, totalStops, hour, minute, dayOfWeek, routeEncoded, historicalAvg]`.

2. **Remote route data endpoint** — `useRoutes.js` fetches from `https://raw.githubusercontent.com/ttg-eng/routes/main/routes.json` (placeholder, repo doesn't exist). Silent fallback to bundled seed data works. If real remote sync is needed, replace `REMOTE_URL` in `src/hooks/useRoutes.js`.

3. **Offline test not performed** — Service worker precaches all assets. After first visit, DevTools > Network > Offline + reload should serve from cache. Not yet manually verified.

4. **GPS accuracy of route stops** — Some route JSON coordinates are approximate. If the Leaflet map looks wrong for a route, the GPS points in the corresponding `src/data/routes/R***.json` need correction.

5. **iOS A2HS guidance** — ✅ RESOLVED (Session 4). `IosInstallGuide.jsx` shows a manual "Share → Add to Home Screen" sheet on iOS Safari (gated by `isIos() && !isInStandaloneMode()`). Real-device check on an actual iPhone still recommended.

6. ~~**RouteDetail desktop layout**~~ — ✅ NOT lacking; already implemented (two-column split, `RouteDetail.jsx:174-336` + `index.css:1072-1114`). This entry was stale.

---

## Problems Encountered and Fixes

| Problem | Fix |
|---|---|
| Workbox build failed — WASM files >2 MiB | `globIgnores: ['**/onnx/**', '**/ort-wasm*']` + `maximumFileSizeToCacheInBytes: 3MB` in `vite.config.js` |
| `react-leaflet` peer deps conflict | **Resolved (Session 2):** downgraded `react-leaflet` 5.0.0 → 4.2.1, which supports React 18. `--legacy-peer-deps` no longer needed — plain `npm install` works. |
| `useLocalStorage` stale closure | `setValue` uses `setStoredValue(prev => ...)` callback |
| Wrong route URL `/route/AM` | Must be `/route/:routeNumber/:period` e.g. `/#/route/R102/AM` |
| Old CSS tokens (`--color-primary`, etc.) in components | All replaced with oklch tokens (`--primary`, `--line`, `--ink`, `--surface`) |
| `.stop-info` class (undefined in new CSS) | Replaced with `.stop-card` Elmov pattern |
| `clip-path` clips `box-shadow` — desktop card frame approach | `clip-path: inset(0 round ...)` + `box-shadow` combo was broken. User also rejected the phone-card-on-desktop concept entirely. Replaced with full-width responsive layout using `@media (min-width: 768px)` |

---

## Where to Go From Here

### Next immediate steps
1. **Manual browser test** — `npm run dev -- --host`, open `http://localhost:5173`:
   - Desktop (≥768px): top nav visible, routes in 2-column grid, page headers sticky below top nav
   - Mobile: full-screen bottom nav layout unchanged
   - Home: greeting + route status pill + favorites scroll + routes grid + sync tagline
   - Routes page: AM/PM toggle + search filter, all 9 routes in grid
   - Route detail: "I'm here" → ETA hero; "Bus here" → toast + localStorage entry
   - Favorites: star a route → reload → still starred
   - History: grouped by date, two-tap clear-all
   - Install banner: appears on Android Chrome only

2. **Phone test** — `http://<LAN-IP>:5173` on Android Chrome, trigger A2HS prompt

3. **iOS A2HS guidance** — Add an instruction sheet when UA includes `iPhone/iPad` and `standalone` mode is inactive. Show "Tap Share → Add to Home Screen" with a visual guide.

4. **RouteDetail desktop split** — Consider two-column layout: stop list on left (scrollable), Leaflet map pinned on right. Requires a desktop breakpoint wrapper in `RouteDetail.jsx`.

5. **ONNX model** — Train on historical bus timing data, export with `skl2onnx`, place at `public/model/eta_model.onnx`. No code changes needed.

6. **Real remote endpoint** — Create a GitHub repo or Supabase bucket with `routes.json`. Replace `REMOTE_URL` in `src/hooks/useRoutes.js`.
