import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { bucket, json, requireBucket, s3 } from './_s3.js'

export async function GET(request) {
  const missing = requireBucket()
  if (missing) return missing

  const url = new URL(request.url)
  const key = url.searchParams.get('key') || ''
  if (!key) return json({ error: 'A file key is required.' }, 400)

  try {
    const signedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${key.split('/').pop()?.replace(/["\r\n]/g, '_') || 'download'}"`,
      }),
      { expiresIn: 60 },
    )

    return Response.redirect(signedUrl, 302)
  } catch (error) {
    console.error('Download failed:', error)
    return json({ error: 'Could not create a download link.' }, 500)
  }
}
