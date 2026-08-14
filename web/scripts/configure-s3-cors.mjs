import 'dotenv/config'
import { PutBucketCorsCommand, S3Client } from '@aws-sdk/client-s3'

const region = process.env.AWS_REGION || 'eu-north-1'
const bucket = process.env.S3_BUCKET_NAME
const origin = process.env.APP_ORIGIN || '*'

if (!bucket) {
  console.error('Missing S3_BUCKET_NAME. Put it in web/.env first.')
  process.exit(1)
}

const s3 = new S3Client({ region })

await s3.send(new PutBucketCorsCommand({
  Bucket: bucket,
  CORSConfiguration: {
    CORSRules: [
      {
        AllowedOrigins: [origin],
        AllowedMethods: ['GET', 'PUT', 'HEAD'],
        AllowedHeaders: ['*'],
        ExposeHeaders: ['ETag'],
        MaxAgeSeconds: 3600,
      },
    ],
  },
}))

console.log(`CORS configured for ${bucket}`)
console.log(`Allowed origin: ${origin}`)
