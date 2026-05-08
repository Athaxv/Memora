import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { config } from "../config";

export interface UploadedAsset {
  objectKey: string;
  publicUrl: string;
  mimeType: string;
  size: number;
  name: string;
  storageProvider: "cloudflare_r2";
}

function getPublicBaseUrl(): string {
  if (!config.R2_PUBLIC_BASE_URL) {
    throw new Error("R2_PUBLIC_BASE_URL is required for asset uploads");
  }
  return config.R2_PUBLIC_BASE_URL.replace(/\/+$/, "");
}

function createR2Client(): S3Client {
  if (
    !config.R2_ACCOUNT_ID ||
    !config.R2_ACCESS_KEY_ID ||
    !config.R2_SECRET_ACCESS_KEY ||
    !config.R2_BUCKET
  ) {
    throw new Error("Missing Cloudflare R2 configuration");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.R2_ACCESS_KEY_ID,
      secretAccessKey: config.R2_SECRET_ACCESS_KEY,
    },
  });
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 180);
}

export async function uploadAssetToR2(params: {
  userId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<UploadedAsset> {
  const client = createR2Client();
  const safeName = sanitizeFileName(params.fileName);
  const objectKey = `uploads/${params.userId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;

  await client.send(
    new PutObjectCommand({
      Bucket: config.R2_BUCKET,
      Key: objectKey,
      Body: params.buffer,
      ContentType: params.mimeType,
      ContentLength: params.buffer.length,
    })
  );

  const publicBaseUrl = getPublicBaseUrl();
  return {
    objectKey,
    publicUrl: `${publicBaseUrl}/${objectKey}`,
    mimeType: params.mimeType,
    size: params.buffer.length,
    name: params.fileName,
    storageProvider: "cloudflare_r2",
  };
}
