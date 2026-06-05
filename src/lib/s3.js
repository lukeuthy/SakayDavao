import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: import.meta.env.VITE_AWS_REGION,
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET = import.meta.env.VITE_S3_BUCKET

/**
 * Upload a contribution record to S3.
 * Path: contributions/{routeNumber}/{id}.json
 * Fire-and-forget — never throws to the caller.
 */
export async function uploadContribution(entry) {
  if (!BUCKET) return
  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `contributions/${entry.routeNumber}/${entry.id}.json`,
      Body: JSON.stringify(entry),
      ContentType: 'application/json',
    }))
  } catch (err) {
    console.warn('[S3] Contribution upload failed:', err.message)
  }
}
