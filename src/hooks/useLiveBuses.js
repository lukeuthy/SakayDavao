import { useState, useEffect, useMemo } from 'react'
import { simulatedBuses } from '../utils/busSim.js'
import { useRealtime } from './useRealtime.js'

/**
 * Buses to show on a route's map.
 *
 * Prefers a real external feed (when `VITE_REALTIME_URL` is configured and has
 * vehicles for this route); otherwise falls back to schedule-based simulation.
 * Re-ticks every second so simulated buses glide along the polyline.
 *
 * @returns {{ buses: Array, source: 'live' | 'simulated' | 'none' }}
 */
export function useLiveBuses(route, { headwayMin = 15, tickMs = 1000 } = {}) {
  const { vehicles } = useRealtime()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), tickMs)
    return () => clearInterval(id)
  }, [tickMs])

  return useMemo(() => {
    if (!route) return { buses: [], source: 'none' }

    const live = (vehicles ?? []).filter(v => v.routeNumber === route.routeNumber)
    if (live.length) {
      return {
        source: 'live',
        buses: live.map((v, i) => ({
          id: `live-${route.routeNumber}-${i}`,
          lat: v.latitude,
          lng: v.longitude,
          heading: v.heading,
          nextStopIdx: v.nextStopIdx,
          simulated: false,
        })),
      }
    }

    const buses = simulatedBuses(route, now, { headwayMin })
    return { buses, source: buses.length ? 'simulated' : 'none' }
  }, [route, vehicles, now, headwayMin])
}
