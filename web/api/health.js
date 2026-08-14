import { bucket, json, region } from './_s3.js'

export function GET() {
  return json({ ok: true, region, bucketConfigured: Boolean(bucket) })
}
