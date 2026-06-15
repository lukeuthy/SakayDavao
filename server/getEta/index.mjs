import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

// Serves the precomputed aggregate (aggregates/eta-latest.json) to the client over
// GET /eta. The bucket stays private — only this function can read it. CORS headers
// are added by API Gateway (see template CorsConfiguration), not here.

const s3 = new S3Client({})
const BUCKET = process.env.CONTRIBUTIONS_BUCKET
const KEY = 'aggregates/eta-latest.json'

const streamToString = async (stream) => {
  const chunks = []
  for await (const c of stream) chunks.push(c)
  return Buffer.concat(chunks).toString('utf8')
}

export async function handler() {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }))
    const body = await streamToString(res.Body)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body,
    }
  } catch (err) {
    // No aggregate yet (first deploy, before the first rollup) → return an empty
    // shape so the client treats it as "no crowd data" and falls back gracefully.
    if (err?.name === 'NoSuchKey') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
        body: JSON.stringify({ generatedAt: null, routes: {} }),
      }
    }
    console.error('[getEta] failed:', err)
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unavailable' }) }
  }
}
