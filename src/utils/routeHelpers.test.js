import { describe, it, expect } from 'vitest'
import {
  haversineMeters,
  formatDistance,
  formatStopName,
  nearestStop,
  buildRouteGroups,
  getRouteData,
  getStops,
} from './routeHelpers.js'

describe('haversineMeters', () => {
  it('is ~0 for identical points', () => {
    expect(haversineMeters(7.07, 125.61, 7.07, 125.61)).toBeCloseTo(0, 1)
  })
  it('approximates ~111 km per degree of latitude', () => {
    const d = haversineMeters(7, 125, 8, 125)
    expect(d).toBeGreaterThan(110000)
    expect(d).toBeLessThan(112000)
  })
  it('is symmetric', () => {
    const ab = haversineMeters(7.0, 125.0, 7.1, 125.2)
    const ba = haversineMeters(7.1, 125.2, 7.0, 125.0)
    expect(ab).toBeCloseTo(ba, 5)
  })
})

describe('formatDistance', () => {
  it('shows meters under 1 km', () => {
    expect(formatDistance(120)).toBe('120 m')
  })
  it('rounds meters', () => {
    expect(formatDistance(120.7)).toBe('121 m')
  })
  it('shows km with 1 decimal at/above 1 km', () => {
    expect(formatDistance(1430)).toBe('1.4 km')
    expect(formatDistance(1000)).toBe('1.0 km')
  })
})

describe('formatStopName', () => {
  it('strips a trailing " Station" (case-insensitive)', () => {
    expect(formatStopName('Bankerohan Station')).toBe('Bankerohan')
    expect(formatStopName('Toril station')).toBe('Toril')
  })
  it('leaves names without the suffix untouched', () => {
    expect(formatStopName('Bankerohan')).toBe('Bankerohan')
  })
})

describe('nearestStop', () => {
  const stops = [
    { latitude: 7.0, longitude: 125.0 },
    { latitude: 7.1, longitude: 125.1 },
  ]
  it('returns the index of the closest stop', () => {
    expect(nearestStop(stops, 7.09, 125.09).index).toBe(1)
  })
  it('returns a distance in meters', () => {
    const r = nearestStop(stops, 7.0, 125.0)
    expect(r.index).toBe(0)
    expect(r.distance).toBeCloseTo(0, 1)
  })
  it('returns null when there are no stops', () => {
    expect(nearestStop([], 7, 125)).toBe(null)
    expect(nearestStop(undefined, 7, 125)).toBe(null)
  })
  it('skips stops lacking numeric coordinates', () => {
    const mixed = [{ latitude: 'x', longitude: 'y' }, { latitude: 7.0, longitude: 125.0 }]
    expect(nearestStop(mixed, 7.0, 125.0).index).toBe(1)
  })
})

describe('buildRouteGroups / getRouteData / getStops', () => {
  const files = [
    {
      route_number: 'R102', name: 'Test Line', color: '#16613a', area: 'Davao',
      time_period: 'am', start_time: '06:00', end_time: '10:00',
      points: [
        { name: 'A', kind: 'stop', latitude: 7.0, longitude: 125.0 },
        { name: 'B', kind: 'waypoint' },
        { name: 'C' }, // no kind → treated as a stop
      ],
    },
    {
      route_number: 'R102', name: 'Test Line', color: '#16613a', area: 'Davao',
      time_period: 'pm', start_time: '16:00', end_time: '21:00',
      points: [{ name: 'A', kind: 'stop' }, { name: 'C', kind: 'stop' }],
    },
  ]

  it('getStops keeps stops and kind-less points, drops waypoints', () => {
    expect(getStops(files[0]).map(s => s.name)).toEqual(['A', 'C'])
  })

  it('groups AM and PM under one route number', () => {
    const groups = buildRouteGroups(files)
    expect(groups).toHaveLength(1)
    expect(groups[0].routeNumber).toBe('R102')
    expect(groups[0].am).not.toBeNull()
    expect(groups[0].pm).not.toBeNull()
  })

  it('attaches the per-route duration range', () => {
    const groups = buildRouteGroups(files)
    expect(groups[0].am.durationRange).toEqual([60, 70]) // R102 lookup
  })

  it('getRouteData selects the correct period, null for unknown route', () => {
    const groups = buildRouteGroups(files)
    expect(getRouteData(groups, 'R102', 'AM').period).toBe('AM')
    expect(getRouteData(groups, 'R102', 'PM').period).toBe('PM')
    expect(getRouteData(groups, 'R999', 'AM')).toBe(null)
  })
})
