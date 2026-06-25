import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 (S3-compatible) config, read from env.
// Falls back to local disk when not configured (dev).
export const R2_BUCKET = process.env.R2_BUCKET || "";
export const R2_PUBLIC_BASE = (process.env.R2_PUBLIC_BASE || "").replace(/\/$/, "");
// Key prefix so nulis images don't collide with other apps sharing the bucket.
export const R2_PREFIX = (process.env.R2_PREFIX || "nulis").replace(/^\/|\/$/g, "");

let client: S3Client | null = null;

export function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey || !R2_BUCKET || !R2_PUBLIC_BASE) {
    return null;
  }

  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export function isR2Configured(): boolean {
  return getR2Client() !== null;
}
