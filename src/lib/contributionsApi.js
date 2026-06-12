const API_URL = import.meta.env.VITE_CONTRIBUTIONS_API_URL

/**
 * Upload a contribution record to the contributions API
 * (API Gateway -> Lambda -> S3; see aws/template.yaml).
 * Fire-and-forget — never throws to the caller.
 */
export async function uploadContribution(entry) {
  if (!API_URL) return
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
  } catch (err) {
    console.warn('[Contributions] Upload failed:', err.message)
  }
}
