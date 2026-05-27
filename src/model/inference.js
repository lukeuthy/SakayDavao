/**
 * ONNX Runtime Web inference wrapper.
 *
 * Attempts to load /model/eta_model.onnx and run XGBoost inference.
 * Gracefully falls back to null (caller then uses linear interpolation).
 *
 * To add a real model: place `eta_model.onnx` in the `public/model/` directory.
 * Input tensor shape: [1, 8] with features below.
 */

let session = null
let loadAttempted = false

async function getSession() {
  if (loadAttempted) return session
  loadAttempted = true
  try {
    const ort = await import('onnxruntime-web')
    ort.env.wasm.wasmPaths = '/onnx/'
    session = await ort.InferenceSession.create('/model/eta_model.onnx', {
      executionProviders: ['wasm'],
    })
    console.log('[ONNX] Model loaded successfully')
  } catch {
    // Model not available — linear interpolation will be used
    session = null
  }
  return session
}

/**
 * @param {{ fromStopIdx, toStopIdx, totalStops, hour, minute, dayOfWeek, routeEncoded, historicalAvg }} features
 * @returns {{ eta: number, confidence: number } | null}
 */
export async function runOnnxInference(features) {
  const sess = await getSession()
  if (!sess) return null

  try {
    const ort = await import('onnxruntime-web')
    const input = new Float32Array([
      features.fromStopIdx,
      features.toStopIdx,
      features.totalStops,
      features.hour,
      features.minute,
      features.dayOfWeek,
      features.routeEncoded,
      features.historicalAvg,
    ])
    const tensor = new ort.Tensor('float32', input, [1, 8])
    const feeds = { [sess.inputNames[0]]: tensor }
    const output = await sess.run(feeds)
    const etaMinutes = output[sess.outputNames[0]].data[0]
    return { eta: etaMinutes, confidence: etaMinutes * 0.15 }
  } catch (err) {
    console.warn('[ONNX] Inference error:', err)
    return null
  }
}

export function isModelLoaded() {
  return session !== null
}
