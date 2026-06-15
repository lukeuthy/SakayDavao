import { describe, it, expect, vi, afterEach } from 'vitest'
import { cumulativeDistances, interpolateAlong, simulatedBuses } from './busSim.js'

// A straight 3-point path heading due north (~1.11 km per 0.01° lat).
const path = [
  { latitude: 7.00, longitude: 125.00, kind: 'stop' },
  { latitude: 7.01, longitude: 125.00, kind: 'stop' },
  { latitude: 7.02, longitude: 125.00, kind: 'stop' },
]

describe('cumulativeDistances', () => {
  it('is monotonic and starts at zero', () => {
    const cum = cumulativeDistances(path)
    expect(cum[0]).toBe(0)
    expect(cum[1]).toBeGreaterThan(0)
    expect(cum[2]).toBeGreaterThan(cum[1])
  })
})

describe('interpolateAlong', () => {
  it('returns the midpoint at fraction 0.5', () => {
    const p = interpolateAlong(path, 0.5)
    expect(p.lat).toBeCloseTo(7.01, 4)
    expect(p.lng).toBeCloseTo(125.00, 4)
  })
  it('clamps out-of-range fractions to the endpoints', () => {
    expect(interpolateAlong(path, -1).lat).toBeCloseTo(7.00, 4)
    expect(interpolateAlong(path, 2).lat).toBeCloseTo(7.02, 4)
  })
  it('points roughly north along this path', () => {
    const p = interpolateAlong(path, 0.25)
    expect(p.heading).toBeGreaterThanOrEqual(0)
    expect(p.heading).toBeLessThan(10) // ~0° = north
  })
  it('returns null for degenerate input', () => {
    expect(interpolateAlong([], 0.5)).toBeNull()
  })
})

describe('simulatedBuses', () => {
  const route = {
    routeNumber: 'R102',
    rawPoints: path,
    durationRange: [30, 30], // avg 30 min
    startTime: '06:00',
    endTime: '10:00',
  }

  afterEach(() => vi.useRealTimers())

  it('returns no buses outside service hours', () => {
    const noon = new Date(); noon.setHours(12, 0, 0, 0)
    expect(simulatedBuses(route, noon)).toEqual([])
  })

  it('spawns buses during service hours with valid positions', () => {
    const morning = new Date(); morning.setHours(7, 0, 0, 0)
    const buses = simulatedBuses(route, morning, { headwayMin: 15 })
    expect(buses.length).toBeGreaterThan(0)
    for (const b of buses) {
      expect(b.progress).toBeGreaterThanOrEqual(0)
      expect(b.progress).toBeLessThanOrEqual(1)
      expect(Number.isFinite(b.lat)).toBe(true)
      expect(Number.isFinite(b.lng)).toBe(true)
      expect(b.simulated).toBe(true)
    }
  })

  it('assigns stable ids per departure', () => {
    const morning = new Date(); morning.setHours(7, 0, 0, 0)
    const ids = simulatedBuses(route, morning).map(b => b.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every(id => id.startsWith('R102-'))).toBe(true)
  })
})
