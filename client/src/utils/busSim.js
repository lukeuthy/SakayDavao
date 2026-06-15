import { haversineMeters, bearing } from './routeHelpers.js'
import { parseTime } from './operatingHours.js'

/**
 * Client-side bus position simulation.
 *
 * With no live GPS feed available, we interpolate plausible bus positions along
 * a route's polyline from its schedule: a bus departs the origin every
 * `headwayMin` minutes and takes the route's average duration to reach the end.
 * This is clearly labelled "Simulated" in the UI — it is NOT real tracking.
 */

const toLatLng = p => [p.latitude, p.longitude]

/** Cumulative great-circle distance (metres) at each point along the path. */
export function cumulativeDistances(points) {
  const cum = [0]
  for (let i = 1; i < points.length; i++) {
    const [aLat, aLng] = toLatLng(points[i - 1])
    const [bLat, bLng] = toLatLng(points[i])
    cum.push(cum[i - 1] + haversineMeters(aLat, aLng, bLat, bLng))
  }
  return cum
}

/**
 * Position at `fraction` (0..1) of the total path length.
 * @returns {{ lat, lng, heading }} or null when the path is too short.
 */
export function interpolateAlong(points, fraction) {
  if (!points || points.length < 2) return null
  const cum = cumulativeDistances(points)
  const total = cum[cum.length - 1]
  if (total === 0) return null
  const f = Math.min(1, Math.max(0, fraction))
  const target = f * total

  let i = 0
  while (i < cum.length - 2 && cum[i + 1] < target) i++
  const segLen = cum[i + 1] - cum[i]
  const t = segLen > 0 ? (target - cum[i]) / segLen : 0
  const [aLat, aLng] = toLatLng(points[i])
  const [bLat, bLng] = toLatLng(points[i + 1])
  return {
    lat: aLat + (bLat - aLat) * t,
    lng: aLng + (bLng - aLng) * t,
    heading: bearing(aLat, aLng, bLat, bLng),
  }
}

const minutesOfDay = (date) => date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60

/** Raw-point indices that correspond to actual stops (for next-stop lookup). */
function stopFractions(rawPoints) {
  const cum = cumulativeDistances(rawPoints)
  const total = cum[cum.length - 1] || 1
  const fractions = []
  rawPoints.forEach((p, i) => {
    if (p.kind === 'stop' || !p.kind) fractions.push(cum[i] / total)
  })
  return fractions
}

/**
 * Active simulated buses for a route at time `now`.
 * @param route route-period object ({ rawPoints|stops, durationRange, startTime, endTime, routeNumber })
 * @param now Date
 * @param opts.headwayMin minutes between departures (default 15)
 * @returns Array<{ id, lat, lng, progress, nextStopIdx, heading, simulated:true }>
 */
export function simulatedBuses(route, now = new Date(), { headwayMin = 15 } = {}) {
  const points = route.rawPoints?.length ? route.rawPoints : route.stops
  if (!points || points.length < 2 || !route.startTime || !route.endTime) return []

  const startMin = parseTime(route.startTime)
  const endMin = parseTime(route.endTime)
  const nowMin = minutesOfDay(now)
  if (nowMin < startMin || nowMin > endMin) return [] // outside service hours

  const [minD, maxD] = route.durationRange ?? [30, 60]
  const avgDuration = (minD + maxD) / 2
  const fracs = stopFractions(points)

  const buses = []
  // Last departure that can still be mid-route is `avgDuration` ago.
  for (let dep = startMin; dep <= endMin; dep += headwayMin) {
    const elapsed = nowMin - dep
    if (elapsed < 0 || elapsed > avgDuration) continue
    const progress = elapsed / avgDuration
    const pos = interpolateAlong(points, progress)
    if (!pos) continue
    let nextStopIdx = fracs.findIndex(f => f >= progress)
    if (nextStopIdx === -1) nextStopIdx = fracs.length - 1
    buses.push({
      id: `${route.routeNumber}-${dep}`,
      lat: pos.lat,
      lng: pos.lng,
      heading: pos.heading,
      progress,
      nextStopIdx,
      simulated: true,
    })
  }
  return buses
}
