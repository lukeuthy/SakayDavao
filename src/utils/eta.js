import { runOnnxInference } from '../model/inference.js'

/**
 * Estimate ETA from stopIndex → targetStopIndex on a route.
 * Returns { minutes, confidence, source }.
 *
 * Sources:
 *   'onnx'        — model inference
 *   'historical'  — local contribution averages (>=3 data points)
 *   'estimate'    — linear interpolation from route duration range
 */
export async function estimateETA(route, fromIdx, toIdx, contributions) {
  if (toIdx <= fromIdx) return { minutes: 0, confidence: 0, source: 'estimate' }

  const totalStops = route.stops.length - 1
  const segmentFraction = (toIdx - fromIdx) / Math.max(1, totalStops)
  const [minMin, maxMin] = route.durationRange
  const avgMin = (minMin + maxMin) / 2
  const halfRange = (maxMin - minMin) / 2

  // 1. Try ONNX model
  try {
    const now = new Date()
    const result = await runOnnxInference({
      fromStopIdx: fromIdx,
      toStopIdx: toIdx,
      totalStops: route.stops.length,
      hour: now.getHours(),
      minute: now.getMinutes(),
      dayOfWeek: now.getDay(),
      routeEncoded: routeEncode(route.routeNumber),
      historicalAvg: historicalAvg(contributions, route.routeNumber, fromIdx, toIdx) ?? avgMin * segmentFraction,
    })
    if (result) return { minutes: Math.max(1, Math.round(result.eta)), confidence: Math.round(result.confidence ?? halfRange * segmentFraction), source: 'onnx' }
  } catch {}

  // 2. Use historical contributions (≥3 points)
  const hist = historicalStats(contributions, route.routeNumber, fromIdx, toIdx)
  if (hist && hist.count >= 3) {
    return {
      minutes: Math.max(1, Math.round(hist.avg)),
      confidence: Math.max(1, Math.round(hist.stddev)),
      source: 'historical',
    }
  }

  // 3. Linear interpolation fallback
  const minutes = Math.max(1, Math.round(avgMin * segmentFraction))
  const confidence = Math.max(1, Math.round(halfRange * segmentFraction))
  return { minutes, confidence, source: 'estimate' }
}

/** Bulk ETA: returns array of { stopIndex, minutes, confidence, source } for all stops after fromIdx */
export async function estimateAllETAs(route, fromIdx, contributions) {
  const results = []
  for (let i = fromIdx + 1; i < route.stops.length; i++) {
    const eta = await estimateETA(route, fromIdx, i, contributions)
    results.push({ stopIndex: i, ...eta })
  }
  return results
}

function routeEncode(routeNumber) {
  const codes = { R102: 0, R103: 1, R402: 2, R403: 3, R503: 4, R603: 5, R763: 6, R783: 7, R793: 8 }
  return codes[routeNumber] ?? 0
}

function historicalStats(contributions, routeNumber, fromIdx, toIdx) {
  const relevant = contributions.filter(c =>
    c.routeNumber === routeNumber && c.stopIndex >= fromIdx && c.stopIndex <= toIdx
  )
  if (relevant.length < 2) return null
  // Estimate travel time as time between consecutive contributions on same route
  const times = []
  for (let i = 1; i < relevant.length; i++) {
    const dt = (relevant[i - 1].timestamp - relevant[i].timestamp) / 60000
    if (dt > 0 && dt < 120) times.push(dt)
  }
  if (!times.length) return null
  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const variance = times.reduce((a, b) => a + (b - avg) ** 2, 0) / times.length
  return { avg, stddev: Math.sqrt(variance), count: times.length }
}

function historicalAvg(contributions, routeNumber, fromIdx, toIdx) {
  const stats = historicalStats(contributions, routeNumber, fromIdx, toIdx)
  return stats?.avg ?? null
}

export function formatETA({ minutes, confidence }) {
  if (minutes === 0) return 'Arriving'
  return `~${minutes} min`
}

export function formatConfidence({ confidence }) {
  if (!confidence || confidence < 1) return ''
  return `±${confidence} min`
}
