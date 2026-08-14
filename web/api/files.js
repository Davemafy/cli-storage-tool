import { DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { bucket, json, region, requireBucket, s3 } from './_s3.js'

export async function GET() {
  const missing = requireBucket()
  if (missing) return missing

  try {
    const result = await s3.send(new ListObjectsV2Command({ Bucket: bucket }))
    const files = (result.Contents || [])
      .filter((item) => item.Key)
      .map((item) => ({
        key: item.Key,
        size: item.Size || 0,
        lastModified: item.LastModified?.toISOString() || null,
      }))
      .sort((a, b) => (b.lastModified || '').localeCompare(a.lastModified || ''))

    return json({ bucket, region, files })
  } catch (error) {
    console.error('List failed:', error)
    return json({ error: 'Could not read objects from S3.' }, 500)
  }
}

export async function DELETE(request) {
  const missing = requireBucket()
  if (missing) return missing

  const url = new URL(request.url)
  const key = url.searchParams.get('key') || ''
  if (!key) return json({ error: 'A file key is required.' }, 400)

  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('Delete failed:', error)
    return json({ error: 'Could not delete that object.' }, 500)
  }
}
