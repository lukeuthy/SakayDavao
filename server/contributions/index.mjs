import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({})
const BUCKET = process.env.CONTRIBUTIONS_BUCKET

const MAX_BODY_BYTES = 4096
const ID_RE = /^[\w.-]{1,64}$/
const ROUTE_RE = /^[\w.-]{1,32}$/

const respond = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
})

export async function handler(event) {
  if (!event.body) return respond(400, { error: 'Missing body' })
  if (event.body.length > MAX_BODY_BYTES) return respond(413, { error: 'Payload too large' })

  let entry
  try {
    entry = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body)
  } catch {
    return respond(400, { error: 'Invalid JSON' })
  }

  const { id, routeNumber, routeName, stopIndex, stopName, timestamp, dayOfWeek, hour, minute } = entry ?? {}
  if (!ID_RE.test(String(id)) || !ROUTE_RE.test(String(routeNumber))) {
    return respond(400, { error: 'Invalid id or routeNumber' })
  }
  if (!Number.isInteger(stopIndex) || !Number.isFinite(timestamp)) {
    return respond(400, { error: 'Invalid stopIndex or timestamp' })
  }

  // Re-serialize only known fields so arbitrary client data never reaches the bucket.
  const receivedAt = Date.now()
  const clean = {
    id: String(id),
    routeNumber: String(routeNumber),
    routeName: String(routeName ?? '').slice(0, 200),
    stopIndex,
    stopName: String(stopName ?? '').slice(0, 200),
    timestamp,
    dayOfWeek,
    hour,
    minute,
    receivedAt,
  }

  // Key includes a server timestamp so a client can never overwrite another
  // record by reusing an id (PutObject is last-writer-wins). Partition by day
  // for cheap time-range listing. The id/route regexes above already block
  // path traversal, so these interpolations are safe.
  const day = new Date(receivedAt).toISOString().slice(0, 10) // YYYY-MM-DD
  const key = `contributions/${clean.routeNumber}/${day}/${receivedAt}-${clean.id}.json`

  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(clean),
      ContentType: 'application/json',
    }))
  } catch (err) {
    // Don't leak internals to the caller; the detail goes to CloudWatch only.
    console.error('[contributions] S3 put failed:', err)
    return respond(500, { error: 'Could not store contribution' })
  }

  return respond(201, { ok: true })
}
