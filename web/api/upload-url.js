import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { bucket, json, requireBucket, s3, safeKey } from './_s3.js'

const MAX_FILE_SIZE = 100 * 1024 * 1024

export async function POST(request) {
  const missing = requireBucket()
  if (missing) return missing

  let body
  try {
    body = await request.json()
  } catch {
    return json({ error: 'Invalid upload request.' }, 400)
  }

  const name = safeKey(body?.name)
  const type = typeof body?.type === 'string' && body.type ? body.type : 'application/octet-stream'
  const size = Number(body?.size || 0)

  if (!name) return json({ error: 'A file name is required.' }, 400)
  if (!Number.isFinite(size) || size <= 0) return json({ error: 'A valid file size is required.' }, 400)
  if (size > MAX_FILE_SIZE) return json({ error: 'This demo limits uploads to 100 MB per file.' }, 413)

  try {
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: name,
      ContentType: type,
    })
    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 })
    return json({ url, key: name, expiresIn: 300 })
  } catch (error) {
    console.error('Presign failed:', error)
    return json({ error: 'Could not prepare the S3 upload.' }, 500)
  }
}
