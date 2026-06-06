import { estimateETA } from './eta.js'
import { haversineMeters, formatStopName } from './routeHelpers.js'

/**
 * Client-side A→B trip planning over the bundled route data.
 *
 * Stops on different routes that sit at (roughly) the same physical location are
 * merged into a single "place" — these shared places are the transfer points.
 * No backend, no GTFS graph engine: the dataset is tiny (9 routes × ~tens of
 * stops) so a direct + one-transfer search is more than fast enough.
 */

// Two stops are the "same place" if within this radius OR they share a name.
const TRANSFER_RADIUS_M = 150

const periodData = (group, period) => (period === 'PM' ? group.pm : group.am)

function normalizeName(name) {
  return formatStopName(name || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Cluster every stop in the given period into deduplicated places.
 * @returns {{ places: Array, placeOf: Map }}
 *   places: [{ id, name, lat, lng, members: [{ routeNumber, stopIndex }] }]
 *   placeOf: Map<`${routeNumber}:${stopIndex}`, placeId>
 */
export function buildPlaces(routeGroups, period) {
  const places = []
  const placeOf = new Map()

  const findPlace = (name, lat, lng) => {
    const norm = normalizeName(name)
    for (const p of places) {
      if (norm && normalizeName(p.name) === norm) return p
      if (
        typeof lat === 'number' && typeof lng === 'number' &&
        typeof p.lat === 'number' && typeof p.lng === 'number' &&
        haversineMeters(lat, lng, p.lat, p.lng) <= TRANSFER_RADIUS_M
      ) return p
    }
    return null
  }

  routeGroups.forEach(group => {
    const d = periodData(group, period)
    if (!d) return
    d.stops.forEach((stop, stopIndex) => {
      let place = findPlace(stop.name, stop.latitude, stop.longitude)
      if (!place) {
        place = {
          id: places.length,
          name: formatStopName(stop.name) || `Stop ${stopIndex + 1}`,
          lat: stop.latitude,
          lng: stop.longitude,
          members: [],
        }
        places.push(place)
      }
      place.members.push({ routeNumber: group.routeNumber, stopIndex })
      placeOf.set(`${group.routeNumber}:${stopIndex}`, place.id)
    })
  })

  // Surface multi-route (transfer-capable) places first for nicer autocomplete.
  places.sort((a, b) => {
    const ar = new Set(a.members.map(m => m.routeNumber)).size
    const br = new Set(b.members.map(m => m.routeNumber)).size
    if (ar !== br) return br - ar
    return a.name.localeCompare(b.name)
  })

  return { places, placeOf }
}

/** First stop index of `place` on `routeNumber`, or null. */
function indexOnRoute(place, routeNumber) {
  const m = place.members.find(x => x.routeNumber === routeNumber)
  return m ? m.stopIndex : null
}

/** Distinct route numbers a place is served by. */
function routesAt(place) {
  return [...new Set(place.members.map(m => m.routeNumber))]
}

async function buildLeg(routeGroups, routeNumber, period, fromIdx, toIdx, contributions) {
  const group = routeGroups.find(g => g.routeNumber === routeNumber)
  const d = periodData(group, period)
  const eta = await estimateETA(d, fromIdx, toIdx, contributions)
  return {
    routeNumber,
    routeName: d.name,
    color: group.color,
    period,
    fromIdx,
    toIdx,
    fromName: formatStopName(d.stops[fromIdx]?.name ?? ''),
    toName: formatStopName(d.stops[toIdx]?.name ?? ''),
    stopCount: toIdx - fromIdx,
    etaMinutes: eta.minutes,
    source: eta.source,
  }
}

/**
 * Plan trips from one place to another for a given period.
 * @returns Promise<Array<{ legs, totalMinutes, transfers }>> ranked best-first (max 6).
 */
export async function planTrip(routeGroups, originPlace, destPlace, period, contributions = []) {
  if (!originPlace || !destPlace || originPlace.id === destPlace.id) return []

  const itineraries = []
  const seen = new Set()
  const TRANSFER_PENALTY_MIN = 4 // notional wait when changing buses

  // 1. Direct rides — a single route serving both places, origin before dest.
  for (const rn of routesAt(originPlace)) {
    const a = indexOnRoute(originPlace, rn)
    const b = indexOnRoute(destPlace, rn)
    if (a !== null && b !== null && a < b) {
      const leg = await buildLeg(routeGroups, rn, period, a, b, contributions)
      itineraries.push({ legs: [leg], totalMinutes: leg.etaMinutes, transfers: 0 })
      seen.add(rn)
    }
  }

  // 2. One transfer — route A (origin → shared place S) then route B (S → dest).
  const { places } = buildPlaces(routeGroups, period)
  for (const rnA of routesAt(originPlace)) {
    if (seen.has(rnA)) continue // a direct ride on this route already exists
    const a = indexOnRoute(originPlace, rnA)
    if (a === null) continue
    for (const S of places) {
      if (S.id === originPlace.id || S.id === destPlace.id) continue
      const sOnA = indexOnRoute(S, rnA)
      if (sOnA === null || sOnA <= a) continue // must be forward of origin on A
      for (const rnB of routesAt(S)) {
        if (rnB === rnA) continue
        const sOnB = indexOnRoute(S, rnB)
        const b = indexOnRoute(destPlace, rnB)
        if (sOnB === null || b === null || sOnB >= b) continue // forward on B
        const key = `${rnA}>${S.id}>${rnB}`
        if (seen.has(key)) continue
        seen.add(key)
        const leg1 = await buildLeg(routeGroups, rnA, period, a, sOnA, contributions)
        const leg2 = await buildLeg(routeGroups, rnB, period, sOnB, b, contributions)
        itineraries.push({
          legs: [leg1, leg2],
          totalMinutes: leg1.etaMinutes + leg2.etaMinutes + TRANSFER_PENALTY_MIN,
          transfers: 1,
        })
      }
    }
  }

  itineraries.sort((x, y) => {
    if (x.transfers !== y.transfers) return x.transfers - y.transfers
    return x.totalMinutes - y.totalMinutes
  })
  return itineraries.slice(0, 6)
}
