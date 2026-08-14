import { S3Client } from '@aws-sdk/client-s3'

export const region = process.env.AWS_REGION || 'eu-north-1'
export const bucket = process.env.S3_BUCKET_NAME

export const s3 = new S3Client({ region })

export function requireBucket() {
  if (!bucket) {
    return new Response(JSON.stringify({ error: 'S3_BUCKET_NAME is not configured in Vercel.' }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
  return null
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export function safeKey(name) {
  return String(name || 'file')
    .replace(/[\\/]/g, '_')
    .replace(/[\r\n\0]/g, '')
    .slice(0, 500)
}
