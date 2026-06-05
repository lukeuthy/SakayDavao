import { describe, it, expect, vi } from 'vitest'

// Force the deterministic linear-interpolation path: no ONNX model in tests.
vi.mock('../model/inference.js', () => ({
  runOnnxInference: vi.fn().mockResolvedValue(null),
  isModelLoaded: () => false,
}))

import { formatETA, formatConfidence, estimateETA, estimateAllETAs } from './eta.js'

describe('formatETA', () => {
  it('says "Arriving" at 0 minutes', () => {
    expect(formatETA({ minutes: 0, confidence: 0 })).toBe('Arriving')
  })
  it('renders "~N min"', () => {
    expect(formatETA({ minutes: 5, confidence: 2 })).toBe('~5 min')
  })
})

describe('formatConfidence', () => {
  it('is empty for missing / sub-1 confidence', () => {
    expect(formatConfidence({ confidence: 0 })).toBe('')
    expect(formatConfidence({ confidence: undefined })).toBe('')
  })
  it('renders "±N min"', () => {
    expect(formatConfidence({ confidence: 3 })).toBe('±3 min')
  })
})

describe('estimateETA (linear fallback)', () => {
  const route = {
    routeNumber: 'R102',
    durationRange: [60, 70],
    stops: Array.from({ length: 11 }, (_, i) => ({ name: `S${i}` })),
  }

  it('returns 0 / estimate when target is not ahead', async () => {
    const r = await estimateETA(route, 3, 3, [])
    expect(r).toEqual({ minutes: 0, confidence: 0, source: 'estimate' })
  })

  it('interpolates from the duration range and labels source "estimate"', async () => {
    // totalStops = 10, avgMin = 65, fraction = 1/10 → round(6.5) = 7
    const r = await estimateETA(route, 0, 1, [])
    expect(r.source).toBe('estimate')
    expect(r.minutes).toBe(7)
    expect(r.confidence).toBeGreaterThanOrEqual(1)
  })

  it('grows monotonically with distance', async () => {
    const near = await estimateETA(route, 0, 1, [])
    const far = await estimateETA(route, 0, 10, [])
    expect(far.minutes).toBeGreaterThan(near.minutes)
  })
})

describe('estimateAllETAs', () => {
  const route = {
    routeNumber: 'R102',
    durationRange: [60, 70],
    stops: Array.from({ length: 11 }, (_, i) => ({ name: `S${i}` })),
  }

  it('produces one entry per downstream stop, indexed correctly', async () => {
    const all = await estimateAllETAs(route, 0, [])
    expect(all).toHaveLength(10)
    expect(all[0].stopIndex).toBe(1)
    expect(all[all.length - 1].stopIndex).toBe(10)
    expect(all.every(e => e.source === 'estimate')).toBe(true)
  })
})
