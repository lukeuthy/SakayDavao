import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'

// Scheduled rollup: reads every raw contribution under contributions/ and writes
// ONE small aggregate (aggregates/eta-latest.json) that the client reads back to
// improve ETAs with everyone's data. This is the "close the loop" job — S3 is the
// only datastore; there is no database.
//
// Estimator (intentionally simple v1): for each route+stop we keep the average
// "minute of day" a bus is reported there, plus a sample count. The client turns
// any two stops into an ETA by subtracting those averages. Good enough to beat
// blind interpolation; easy to improve later without changing the contract.

const s3 = new S3Client({})
const BUCKET = process.env.CONTRIBUTIONS_BUCKET
const PREFIX = 'contributions/'
const OUT_KEY = 'aggregates/eta-latest.json'

const streamToString = async (stream) => {
  const chunks = []
  for await (const c of stream) chunks.push(c)
  return Buffer.concat(chunks).toString('utf8')
}

export async function handler() {
  // routes[routeNumber][stopIndex] = { c: count, sum: sumOfMinuteOfDay }
  const routes = {}
  let scanned = 0
  let ContinuationToken

  do {
    const page = await s3.send(new ListObjectsV2Command({
      Bucket: BUCKET, Prefix: PREFIX, ContinuationToken,
    }))
    const objs = (page.Contents ?? []).filter(o => o.Key.endsWith('.json'))

    // Read this page's objects with bounded concurrency (Promise.all per page).
    const bodies = await Promise.all(objs.map(async (o) => {
      try {
        const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: o.Key }))
        return JSON.parse(await streamToString(res.Body))
      } catch {
        return null // skip unreadable/corrupt objects
      }
    }))

    for (const c of bodies) {
      if (!c || typeof c.routeNumber !== 'string' || !Number.isInteger(c.stopIndex)) continue
      const minuteOfDay = Number.isFinite(c.hour) && Number.isFinite(c.minute)
        ? c.hour * 60 + c.minute
        : new Date(c.timestamp).getHours() * 60 + new Date(c.timestamp).getMinutes()
      if (!Number.isFinite(minuteOfDay)) continue
      const r = (routes[c.routeNumber] ??= {})
      const s = (r[c.stopIndex] ??= { c: 0, sum: 0 })
      s.c += 1
      s.sum += minuteOfDay
      scanned += 1
    }
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined
  } while (ContinuationToken)

  // Collapse to { routeNumber: { stopIndex: { c, m } } } where m = avg minute-of-day.
  const out = { generatedAt: new Date().toISOString(), sampleCount: scanned, routes: {} }
  for (const [route, stops] of Object.entries(routes)) {
    const dst = (out.routes[route] = {})
    for (const [idx, s] of Object.entries(stops)) {
      dst[idx] = { c: s.c, m: Math.round((s.sum / s.c) * 10) / 10 }
    }
  }

  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: OUT_KEY,
    Body: JSON.stringify(out),
    ContentType: 'application/json',
  }))

  console.log(`[aggregate] scanned ${scanned} contributions across ${Object.keys(out.routes).length} routes`)
  return { ok: true, scanned }
}
