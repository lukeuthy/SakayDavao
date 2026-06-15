import { useEffect, useRef } from 'react'
import { nearestStop } from '../utils/routeHelpers.js'

// Automatic, foreground-only boarding signal. While a route is open AND the user has
// opted in, this quietly notes which stop they're physically near. Deliberately light
// and privacy-respecting:
//   - runs ONLY while the route page is open and the tab is visible (pauses on hide);
//   - low-accuracy, OS-throttled geolocation (watchPosition), not a high-rate GPS trace;
//   - only logs when within MATCH_RADIUS_M of a known stop (map-matched, not raw tracking);
//   - debounced so the same stop isn't logged repeatedly;
//   - emits only { stopIndex, time } via onBoarding — never raw coordinates.
// A PWA cannot read location in the background, so "while the app is open" is the whole
// scope by construction.

const MATCH_RADIUS_M = 120
const RELOG_COOLDOWN_MS = 5 * 60 * 1000

export function useAutoCollect(route, enabled, onBoarding) {
  const last = useRef({ stopIndex: null, at: 0 })

  useEffect(() => {
    if (!enabled || !route || typeof navigator === 'undefined' || !navigator.geolocation) return

    let watchId = null

    const handle = (pos) => {
      const near = nearestStop(route.stops, pos.coords.latitude, pos.coords.longitude)
      if (!near || near.distance > MATCH_RADIUS_M) return
      const now = Date.now()
      if (last.current.stopIndex === near.index && now - last.current.at < RELOG_COOLDOWN_MS) return
      last.current = { stopIndex: near.index, at: now }
      onBoarding(near.index, route.stops[near.index]?.name ?? '')
    }

    const start = () => {
      if (watchId != null || document.hidden) return
      watchId = navigator.geolocation.watchPosition(
        handle,
        () => {}, // permission denied / unavailable → silent no-op
        { enableHighAccuracy: false, maximumAge: 30_000, timeout: 20_000 },
      )
    }
    const stop = () => {
      if (watchId != null) { navigator.geolocation.clearWatch(watchId); watchId = null }
    }
    const onVisibility = () => { document.hidden ? stop() : start() }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stop()
    }
  }, [route, enabled, onBoarding])
}
