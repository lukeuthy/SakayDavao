import { estimateETA } from './eta.js'
import { haversineMeters, formatStopName } from './routeHelpers.js'

/**
 * Client-side A→B trip planning over the bundled route data.
 *
 * Every route ships as two directed "lines" — its AM file and its PM file, which
 * are the two travel directions of the same corridor. We treat ALL lines from ALL
 * routes as available segments (so a trip can go "out" on one and "back" on
 * another), cluster their stops into shared "places" (the transfer points), and
 * search direct → one-transfer → (fallback) two-transfer itineraries. The dataset
 * is tiny (9 routes × 2 directions × tens of stops) so this is plenty fast.
 */

// Two stops are the "same place" if within this radius OR they share a name.
const TRANSFER_RADIUS_M = 150
const TRANSFER_PENALTY_MIN = 4 // notional wait when changing buses
const MAX_RESULTS = 6

function normalizeName(name) {
  return formatStopName(name || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/** Flatten route groups into directed lines (one per route per direction/period). */
function buildLines(routeGroups) {
  const lines = []
  routeGroups.forEach(group => {
    for (const period of ['AM', 'PM']) {
      const d = period === 'AM' ? group.am : group.pm
      if (d) lines.push({ routeNumber: group.routeNumber, period, data: d })
    }
  })
  return lines
}

/**
 * Cluster every stop across every line into deduplicated places.
 * @returns {{ places: Array, lines: Array }}
 *   places: [{ id, name, lat, lng, members: [{ routeNumber, period, stopIndex }] }]
 */
export function buildPlaces(routeGroups) {
  const lines = buildLines(routeGroups)
  const places = []

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

  lines.forEach(line => {
    line.data.stops.forEach((stop, stopIndex) => {
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
      place.members.push({ routeNumber: line.routeNumber, period: line.period, stopIndex })
    })
  })

  // Surface multi-route (transfer-capable) places first for nicer autocomplete.
  places.sort((a, b) => {
    const ar = new Set(a.members.map(m => m.routeNumber)).size
    const br = new Set(b.members.map(m => m.routeNumber)).size
    if (ar !== br) return br - ar
    return a.name.localeCompare(b.name)
  })

  return { places, lines }
}

/** Stop index of `place` on a specific line (routeNumber+period), or null. */
function indexOn(place, routeNumber, period) {
  const m = place.members.find(x => x.routeNumber === routeNumber && x.period === period)
  return m ? m.stopIndex : null
}

/** Distinct lines ({routeNumber, period}) a place is served by. */
function linesAt(place) {
  return place.members.map(m => ({ routeNumber: m.routeNumber, period: m.period }))
}

/**
 * Plan trips from one place to another across all routes/directions.
 * @returns Promise<Array<{ legs, totalMinutes, transfers }>> ranked best-first (max 6).
 */
export async function planTrip(routeGroups, originPlace, destPlace, contributions = []) {
  if (!originPlace || !destPlace || originPlace.id === destPlace.id) return []

  const { places, lines } = buildPlaces(routeGroups)
  const lineData = (rn, period) => lines.find(l => l.routeNumber === rn && l.period === period)?.data
  const hubs = places.filter(p => new Set(p.members.map(m => m.routeNumber)).size > 1)

  // ── Phase 1: enumerate itinerary SHAPES (legs as {rn, period, from, to}) ──
  // Cheap to generate; ETA is computed later only for the ranked survivors.
  const shapes = []
  const seen = new Set()
  const directRoutes = new Set()

  const push = (legs) => {
    const sig = legs.map(l => `${l.rn}-${l.period}:${l.from}`).join('>')
    if (seen.has(sig)) return
    seen.add(sig)
    const stops = legs.reduce((n, l) => n + (l.to - l.from), 0)
    shapes.push({ legs, transfers: legs.length - 1, stops })
  }

  // Direct — one line carrying origin → dest (origin before dest).
  for (const { routeNumber: rn, period } of linesAt(originPlace)) {
    const a = indexOn(originPlace, rn, period)
    const b = indexOn(destPlace, rn, period)
    if (a !== null && b !== null && a < b) {
      push([{ rn, period, from: a, to: b }])
      directRoutes.add(rn)
    }
  }

  // One transfer — line A: origin → S, line B: S → dest (different routes).
  for (const { routeNumber: rnA, period: pA } of linesAt(originPlace)) {
    if (directRoutes.has(rnA)) continue
    const a = indexOn(originPlace, rnA, pA)
    if (a === null) continue
    for (const S of places) {
      if (S.id === originPlace.id || S.id === destPlace.id) continue
      const sA = indexOn(S, rnA, pA)
      if (sA === null || sA <= a) continue
      for (const { routeNumber: rnB, period: pB } of linesAt(S)) {
        if (rnB === rnA) continue
        const sB = indexOn(S, rnB, pB)
        const b = indexOn(destPlace, rnB, pB)
        if (sB === null || b === null || sB >= b) continue
        push([{ rn: rnA, period: pA, from: a, to: sA }, { rn: rnB, period: pB, from: sB, to: b }])
      }
    }
  }

  // Two transfers — only as a fallback when nothing shorter connects the pair.
  // Bounded to multi-route hubs so it stays fast and the options stay sensible.
  if (shapes.length === 0) {
    for (const { routeNumber: rnA, period: pA } of linesAt(originPlace)) {
      const a = indexOn(originPlace, rnA, pA)
      if (a === null) continue
      for (const S1 of hubs) {
        if (S1.id === originPlace.id || S1.id === destPlace.id) continue
        const s1A = indexOn(S1, rnA, pA)
        if (s1A === null || s1A <= a) continue
        for (const { routeNumber: rnB, period: pB } of linesAt(S1)) {
          if (rnB === rnA) continue
          const s1B = indexOn(S1, rnB, pB)
          if (s1B === null) continue
          for (const S2 of hubs) {
            if (S2.id === S1.id || S2.id === originPlace.id || S2.id === destPlace.id) continue
            const s2B = indexOn(S2, rnB, pB)
            if (s2B === null || s2B <= s1B) continue
            for (const { routeNumber: rnC, period: pC } of linesAt(S2)) {
              if (rnC === rnB || rnC === rnA) continue
              const s2C = indexOn(S2, rnC, pC)
              const b = indexOn(destPlace, rnC, pC)
              if (s2C === null || b === null || s2C >= b) continue
              push([
                { rn: rnA, period: pA, from: a, to: s1A },
                { rn: rnB, period: pB, from: s1B, to: s2B },
                { rn: rnC, period: pC, from: s2C, to: b },
              ])
            }
          }
        }
      }
    }
  }

  // ── Phase 2: rank shapes (fewer transfers, then fewer stops), keep the best ──
  shapes.sort((x, y) => x.transfers - y.transfers || x.stops - y.stops)
  const top = shapes.slice(0, MAX_RESULTS)

  // ── Phase 3: compute real ETAs only for the survivors ──
  const buildLeg = async ({ rn, period, from, to }) => {
    const d = lineData(rn, period)
    const eta = await estimateETA(d, from, to, contributions)
    return {
      routeNumber: rn,
      period,
      routeName: d.name,
      color: d.color,
      fromIdx: from,
      toIdx: to,
      fromName: formatStopName(d.stops[from]?.name ?? ''),
      toName: formatStopName(d.stops[to]?.name ?? ''),
      stopCount: to - from,
      etaMinutes: eta.minutes,
      source: eta.source,
    }
  }

  const itineraries = await Promise.all(top.map(async shape => {
    const legs = await Promise.all(shape.legs.map(buildLeg))
    const ride = legs.reduce((n, l) => n + l.etaMinutes, 0)
    return { legs, transfers: shape.transfers, totalMinutes: ride + shape.transfers * TRANSFER_PENALTY_MIN }
  }))

  itineraries.sort((x, y) => x.transfers - y.transfers || x.totalMinutes - y.totalMinutes)
  return itineraries
}
