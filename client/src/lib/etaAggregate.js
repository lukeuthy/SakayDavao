// Reads back the server-side ETA aggregate (everyone's contributions, rolled up by
// the scheduled Lambda) and turns two stops into a crowd-based ETA. No extra config:
// the endpoint is derived from VITE_CONTRIBUTIONS_API_URL (same API, /eta path).
//
// Fails soft everywhere: if the API isn't configured, the network is down, or there
// is no crowd data for a segment, callers fall back to local logs / interpolation.

const API_URL = import.meta.env.VITE_CONTRIBUTIONS_API_URL
const ETA_URL = API_URL ? API_URL.replace(/\/contributions\/?$/, '') + '/eta' : ''
const LS_KEY = 'sakay_eta_aggregate'
const MIN_SAMPLES = 3

let cachedPromise = null

/**
 * Load the aggregate once (memoised for the session). Returns the parsed object
 * `{ routes: { [routeNumber]: { [stopIndex]: { c, m } } } }`, or null when
 * unavailable. Seeds from localStorage so the very first paint offline still works.
 */
export function loadAggregate() {
  if (!ETA_URL) return Promise.resolve(null)
  if (cachedPromise) return cachedPromise

  cachedPromise = (async () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return readCache()
    }
    try {
      const res = await fetch(ETA_URL, { signal: AbortSignal.timeout(8000) })
      if (!res.ok) throw new Error(res.status)
      const data = await res.json()
      try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
      return data
    } catch {
      return readCache() // offline / error → last good copy if any
    }
  })()
  return cachedPromise
}

function readCache() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/**
 * Crowd ETA in minutes for travelling fromIdx → toIdx on a route, or null when
 * there isn't enough data. Uses the difference of average "minute of day" the bus
 * is reported at each stop.
 */
export function crowdMinutes(aggregate, routeNumber, fromIdx, toIdx) {
  const stops = aggregate?.routes?.[routeNumber]
  if (!stops) return null
  const a = stops[fromIdx]
  const b = stops[toIdx]
  if (!a || !b || a.c < MIN_SAMPLES || b.c < MIN_SAMPLES) return null
  const minutes = b.m - a.m
  if (!(minutes > 0)) return null // mixed periods / noise → let caller fall back
  // Confidence loosely scales with how thin the samples are (more samples → tighter).
  const confidence = Math.max(1, Math.round(8 / Math.sqrt(Math.min(a.c, b.c))))
  return { minutes, confidence }
}
