import { useState, useEffect } from 'react'

/**
 * Optional external real-time vehicle feed.
 *
 * Inert unless `VITE_REALTIME_URL` is set. When online it polls that endpoint
 * for live vehicle positions and caches the last good response in localStorage
 * so an offline reload still has something to show. When the feed is unset or
 * unreachable, this returns null and the caller falls back to simulation.
 *
 * Default adapter expects JSON:
 *   [{ routeNumber, latitude, longitude, bearing?, nextStopIndex? }, ...]
 * or { vehicles: [ ...same... ] }.
 * To consume GTFS-Realtime instead, add a protobuf adapter (e.g.
 * `gtfs-realtime-bindings`) and map its FeedEntity.vehicle entries to this shape.
 */

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || ''
const LS_KEY = 'sakay_realtime_cache'
const POLL_MS = 25_000

function parseVehicles(data) {
  const list = Array.isArray(data) ? data : data?.vehicles ?? []
  if (!Array.isArray(list)) return []
  return list
    .map(v => ({
      routeNumber: v.routeNumber ?? v.route_number ?? v.route,
      latitude: Number(v.latitude ?? v.lat),
      longitude: Number(v.longitude ?? v.lng ?? v.lon),
      heading: typeof v.bearing === 'number' ? v.bearing
        : typeof v.heading === 'number' ? v.heading : undefined,
      nextStopIdx: v.nextStopIndex ?? v.next_stop_index ?? null,
    }))
    .filter(v => v.routeNumber && Number.isFinite(v.latitude) && Number.isFinite(v.longitude))
}

/** @returns { vehicles: Array | null, enabled: boolean } */
export function useRealtime() {
  const enabled = Boolean(REALTIME_URL)
  const [vehicles, setVehicles] = useState(() => {
    if (!enabled) return null
    try {
      const cached = localStorage.getItem(LS_KEY)
      if (cached) return JSON.parse(cached)
    } catch {}
    return null
  })

  useEffect(() => {
    if (!enabled) return
    let stopped = false

    const poll = async () => {
      if (!navigator.onLine) return
      try {
        const res = await fetch(REALTIME_URL, { signal: AbortSignal.timeout(8000) })
        if (!res.ok) throw new Error(res.status)
        const parsed = parseVehicles(await res.json())
        if (stopped) return
        setVehicles(parsed)
        try { localStorage.setItem(LS_KEY, JSON.stringify(parsed)) } catch {}
      } catch {
        // keep last cached value; simulation covers the gap
      }
    }

    poll()
    const id = setInterval(poll, POLL_MS)
    return () => { stopped = true; clearInterval(id) }
  }, [enabled])

  return { vehicles, enabled }
}
