import { describe, it, expect } from 'vitest'

// No VITE_CONTRIBUTIONS_API_URL in tests → the crowd-aggregate ETA tier
// short-circuits, so estimateETA deterministically uses linear interpolation.

import { buildPlaces, planTrip } from './tripPlanner.js'

// Fixture: RA = Alpha→Beta→Gamma→Delta, RB = Gamma→Epsilon→Zeta.
// Gamma is the shared transfer place (identical coords on both routes).
const mk = (name, lat, lng) => ({ name, latitude: lat, longitude: lng })

const periodData = (routeNumber, name, color, stops) => ({
  routeNumber, name, area: name, color, period: 'AM',
  startTime: '06:00', endTime: '10:00',
  stops, rawPoints: stops, durationRange: [30, 40],
})

const routeGroups = [
  {
    routeNumber: 'RA', name: 'Route A', color: '#111',
    am: periodData('RA', 'Route A', '#111', [
      mk('Alpha', 7.00, 125.00),
      mk('Beta', 7.01, 125.00),
      mk('Gamma', 7.02, 125.00),
      mk('Delta', 7.03, 125.00),
    ]),
    pm: null,
  },
  {
    routeNumber: 'RB', name: 'Route B', color: '#222',
    am: periodData('RB', 'Route B', '#222', [
      mk('Gamma', 7.02, 125.00),
      mk('Epsilon', 7.02, 125.01),
      mk('Zeta', 7.02, 125.02),
    ]),
    pm: null,
  },
]

const placeNamed = (name) => buildPlaces(routeGroups).places.find(p => p.name === name)

describe('buildPlaces', () => {
  it('merges identical stops across routes into one transfer place', () => {
    const { places } = buildPlaces(routeGroups)
    const gamma = places.find(p => p.name === 'Gamma')
    const routes = new Set(gamma.members.map(m => m.routeNumber))
    expect(routes).toEqual(new Set(['RA', 'RB']))
    // 7 raw stops, Gamma shared → 6 distinct places
    expect(places).toHaveLength(6)
  })

  it('includes stops from both directions (AM + PM) of a route', () => {
    const groups = [{
      routeNumber: 'RC', name: 'Route C', color: '#333',
      am: periodData('RC', 'Route C', '#333', [mk('North', 7.1, 125.1), mk('South', 7.2, 125.2)]),
      pm: { ...periodData('RC', 'Route C', '#333', [mk('South', 7.2, 125.2), mk('North', 7.1, 125.1)]), period: 'PM' },
    }]
    const { places } = buildPlaces(groups)
    // Two physical stops, each appears in both directions → 2 distinct places.
    expect(places).toHaveLength(2)
    const north = places.find(p => p.name === 'North')
    expect(new Set(north.members.map(m => m.period))).toEqual(new Set(['AM', 'PM']))
  })
})

describe('planTrip', () => {
  it('finds a direct ride on a single route', async () => {
    const res = await planTrip(routeGroups, placeNamed('Alpha'), placeNamed('Delta'), [])
    expect(res.length).toBeGreaterThanOrEqual(1)
    expect(res[0].transfers).toBe(0)
    expect(res[0].legs).toHaveLength(1)
    expect(res[0].legs[0]).toMatchObject({ routeNumber: 'RA', fromIdx: 0, toIdx: 3 })
  })

  it('finds a one-transfer trip across two routes', async () => {
    const res = await planTrip(routeGroups, placeNamed('Alpha'), placeNamed('Zeta'), [])
    expect(res.length).toBeGreaterThanOrEqual(1)
    const trip = res[0]
    expect(trip.transfers).toBe(1)
    expect(trip.legs).toHaveLength(2)
    expect(trip.legs[0].routeNumber).toBe('RA')
    expect(trip.legs[1].routeNumber).toBe('RB')
    expect(trip.legs[1].fromName).toBe('Gamma')
  })

  it('uses the return direction (PM) when the AM direction does not connect', async () => {
    // AM: Out goes P→Q→Hub; Back goes Hub→R (only as RB-AM). To get Q→R you ride
    // Out AM (Q→Hub) then RB (Hub→R). Now reverse: R→Q needs RB? Build a case where
    // only the PM direction of "Out" carries Hub→P, proving both directions are used.
    const groups = [
      {
        routeNumber: 'OUT', name: 'Out', color: '#a',
        am: periodData('OUT', 'Out', '#a', [mk('P', 7.0, 125.0), mk('Q', 7.0, 125.1), mk('Hub', 7.0, 125.2)]),
        pm: { ...periodData('OUT', 'Out', '#a', [mk('Hub', 7.0, 125.2), mk('Q', 7.0, 125.1), mk('P', 7.0, 125.0)]), period: 'PM' },
      },
      {
        routeNumber: 'CONN', name: 'Conn', color: '#b',
        am: periodData('CONN', 'Conn', '#b', [mk('R', 7.1, 125.2), mk('Hub', 7.0, 125.2)]),
        pm: { ...periodData('CONN', 'Conn', '#b', [mk('Hub', 7.0, 125.2), mk('R', 7.1, 125.2)]), period: 'PM' },
      },
    ]
    const place = (n) => buildPlaces(groups).places.find(p => p.name === n)
    // R → P: requires CONN (R→Hub) then OUT in the PM direction (Hub→P).
    const res = await planTrip(groups, place('R'), place('P'), [])
    expect(res.length).toBeGreaterThanOrEqual(1)
    expect(res[0].legs[res[0].legs.length - 1].routeNumber).toBe('OUT')
  })

  it('returns nothing when origin and destination are the same place', async () => {
    const res = await planTrip(routeGroups, placeNamed('Alpha'), placeNamed('Alpha'), [])
    expect(res).toEqual([])
  })
})
