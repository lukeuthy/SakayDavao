import { describe, it, expect, vi } from 'vitest'

// Force the deterministic linear-interpolation ETA path (no ONNX in tests).
vi.mock('../model/inference.js', () => ({
  runOnnxInference: vi.fn().mockResolvedValue(null),
  isModelLoaded: () => false,
}))

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

const placeNamed = (name) => buildPlaces(routeGroups, 'AM').places.find(p => p.name === name)

describe('buildPlaces', () => {
  it('merges identical stops across routes into one transfer place', () => {
    const { places } = buildPlaces(routeGroups, 'AM')
    const gamma = places.find(p => p.name === 'Gamma')
    const routes = new Set(gamma.members.map(m => m.routeNumber))
    expect(routes).toEqual(new Set(['RA', 'RB']))
    // 7 raw stops, Gamma shared → 6 distinct places
    expect(places).toHaveLength(6)
  })
})

describe('planTrip', () => {
  it('finds a direct ride on a single route', async () => {
    const res = await planTrip(routeGroups, placeNamed('Alpha'), placeNamed('Delta'), 'AM', [])
    expect(res.length).toBeGreaterThanOrEqual(1)
    expect(res[0].transfers).toBe(0)
    expect(res[0].legs).toHaveLength(1)
    expect(res[0].legs[0]).toMatchObject({ routeNumber: 'RA', fromIdx: 0, toIdx: 3 })
  })

  it('finds a one-transfer trip across two routes', async () => {
    const res = await planTrip(routeGroups, placeNamed('Alpha'), placeNamed('Zeta'), 'AM', [])
    expect(res.length).toBeGreaterThanOrEqual(1)
    const trip = res[0]
    expect(trip.transfers).toBe(1)
    expect(trip.legs).toHaveLength(2)
    expect(trip.legs[0].routeNumber).toBe('RA')
    expect(trip.legs[1].routeNumber).toBe('RB')
    expect(trip.legs[1].fromName).toBe('Gamma')
  })

  it('returns no itineraries when the destination is behind the origin', async () => {
    const res = await planTrip(routeGroups, placeNamed('Delta'), placeNamed('Alpha'), 'AM', [])
    expect(res).toEqual([])
  })

  it('returns nothing when origin and destination are the same place', async () => {
    const res = await planTrip(routeGroups, placeNamed('Alpha'), placeNamed('Alpha'), 'AM', [])
    expect(res).toEqual([])
  })
})
