# Bucketroom Web UI

A Vercel-native web client for the existing S3/Bash storage project. The original `cloud_storage_cli.sh` remains intact, so the project now has two interfaces: CLI and web.

## Architecture

```text
React + TypeScript (Vite, Vercel CDN)
            |
            | /api/*
            v
Vercel Functions (Node.js)
            |
            | AWS SDK + presigned URLs
            v
         Amazon S3
```

Uploads and downloads go directly between the browser and S3 using short-lived presigned URLs. This avoids routing file bodies through Vercel Functions and keeps AWS credentials server-side.

## Features

- Drag and drop multi-file uploads
- Direct-to-S3 uploads with presigned URLs
- File listing and local search
- Download via short-lived signed links
- Delete with confirmation
- File count, combined size and last-modified metadata
- Keyboard shortcuts: `U` upload and `R` refresh
- Responsive desktop/mobile UI
- Original Bash CLI remains available at the repository root

## Local setup

```bash
cd web
npm install
cp .env.example .env
```

Fill in `.env` with your S3 bucket and AWS credentials.

Because uploads go directly from the browser to S3, the bucket needs CORS once:

```bash
npm run s3:cors
```

Run the full app locally with Vercel's development server:

```bash
npx vercel dev
```

Plain `npm run dev` starts only the Vite frontend, so S3 API routes will not be available there.

## Deploy everything on Vercel

1. Push this repository to GitHub.
2. Import it into Vercel.
3. Set **Root Directory** to `web`.
4. Vercel detects Vite automatically.
5. Add these environment variables in Project Settings:

```text
AWS_REGION=eu-north-1
S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

6. Deploy.
7. After you know the final production URL, set `APP_ORIGIN` in your local `.env` to that URL and run `npm run s3:cors` once again so S3 accepts uploads from your Vercel site.

No Render service is needed. Both the frontend and backend API deploy in one Vercel project; S3 remains the storage layer.

## Security notes

- AWS credentials are read only by Vercel Functions and are never shipped to the browser.
- Use an IAM user/role limited to the one S3 bucket rather than account-wide S3 permissions.
- Prefer a private S3 bucket. Signed URLs provide temporary upload/download access.
- Do not commit `.env`.
