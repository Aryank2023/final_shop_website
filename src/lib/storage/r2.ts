import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  CompletedPart,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import path from "path";

// Supported MIME types and size limits
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-matroska",
];

export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_PORTFOLIO_IMAGE_SIZE = 15 * 1024 * 1024; // 15 MB
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

/**
 * Check if Cloudflare R2 is configured in environment
 */
export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
  );
}

/**
 * Get configured S3 Client instance for Cloudflare R2
 */
export function getR2Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Missing Cloudflare R2 credentials. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY in .env"
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

/**
 * Get R2 Bucket Name
 */
export function getR2BucketName(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error("Missing R2_BUCKET_NAME in environment variables");
  }
  return bucket;
}

/**
 * Generates permanent public URL for an R2 object key
 */
export function getPublicMediaUrl(key: string): string {
  const base = (process.env.R2_PUBLIC_URL || "").trim().replace(/\/$/, "");
  const cleanKey = key.replace(/^\/+/, "");

  if (base) {
    return `${base}/${cleanKey}`;
  }

  // Fallback to R2 bucket pub endpoint if configured, or relative path
  if (process.env.R2_BUCKET_NAME && process.env.R2_ACCOUNT_ID) {
    return `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${cleanKey}`;
  }

  return `/${cleanKey}`;
}

/**
 * Sanitize filename and create unique, collision-proof R2 storage key
 * Organizes by folder/year/month/<random-id>-<slug-filename>.<ext>
 */
export function generateObjectKey(
  folder: "products" | "portfolio/photos" | "portfolio/videos" | "services" | "general",
  originalFilename: string
): string {
  const ext = path.extname(originalFilename).toLowerCase() || ".jpg";
  const baseName = path
    .basename(originalFilename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now().toString(36);

  // Example: products/2026/10/mv-k8j12z-royal-mug.webp
  return `${folder}/${year}/${month}/mv_${timestamp}_${randomSuffix}-${baseName}${ext}`;
}

/**
 * Validate incoming upload
 */
export function validateMediaUpload(params: {
  filename: string;
  size: number;
  mimeType: string;
  category: "product-image" | "portfolio-photo" | "portfolio-video";
}): { isValid: boolean; error?: string } {
  const { filename, size, mimeType, category } = params;

  if (category === "portfolio-video") {
    if (!ALLOWED_VIDEO_TYPES.includes(mimeType.toLowerCase())) {
      return {
        isValid: false,
        error: `File "${filename}" has invalid video type (${mimeType}). Supported video formats: MP4, WebM, MOV.`,
      };
    }
    if (size > MAX_VIDEO_SIZE) {
      return {
        isValid: false,
        error: `Video "${filename}" (${(size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum limit of 500 MB.`,
      };
    }
    return { isValid: true };
  }

  // Photo / Image Validation
  const allowed = ALLOWED_IMAGE_TYPES;
  if (!allowed.includes(mimeType.toLowerCase())) {
    return {
      isValid: false,
      error: `File "${filename}" has unsupported format (${mimeType}). Supported image formats: JPG, JPEG, PNG, WEBP, GIF.`,
    };
  }

  const maxSize = category === "product-image" ? MAX_PRODUCT_IMAGE_SIZE : MAX_PORTFOLIO_IMAGE_SIZE;
  if (size > maxSize) {
    const limitMb = maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `File "${filename}" (${(size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed size of ${limitMb} MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Generate a single presigned PUT URL for direct client-to-R2 upload
 */
export async function createPresignedPutUrl(params: {
  key: string;
  contentType: string;
  contentLength?: number;
  expiresInSeconds?: number;
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
    ...(params.contentLength ? { ContentLength: params.contentLength } : {}),
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds || 3600, // 1 hour expiration
  });

  const publicUrl = getPublicMediaUrl(params.key);
  return { uploadUrl, publicUrl, key: params.key };
}

/**
 * Upload buffer directly from server to R2 (e.g. for standard API uploads)
 */
export async function uploadBufferToR2(params: {
  key: string;
  buffer: Buffer;
  contentType: string;
  metadata?: Record<string, string>;
}): Promise<{ publicUrl: string; key: string }> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: params.key,
    Body: params.buffer,
    ContentType: params.contentType,
    Metadata: params.metadata,
  });

  await client.send(command);
  const publicUrl = getPublicMediaUrl(params.key);
  return { publicUrl, key: params.key };
}

/**
 * Delete a media asset from R2 by key
 */
export async function deleteMediaFromR2(key: string): Promise<boolean> {
  try {
    if (!isR2Configured()) {
      return false;
    }
    const client = getR2Client();
    const bucket = getR2BucketName();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error) {
    console.error(`Failed to delete R2 object "${key}":`, error);
    return false;
  }
}

/**
 * Get metadata for an object in R2
 */
export async function getMediaMetadataFromR2(key: string) {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new HeadObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return await client.send(command);
}

// -------------------------------------------------------------
// Multipart Upload Helpers for Large Files (e.g., Videos)
// -------------------------------------------------------------

/**
 * Initiate a multipart upload session for large files
 */
export async function initiateMultipartUpload(params: {
  key: string;
  contentType: string;
}): Promise<{ uploadId: string; key: string; publicUrl: string }> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new CreateMultipartUploadCommand({
    Bucket: bucket,
    Key: params.key,
    ContentType: params.contentType,
  });

  const response = await client.send(command);
  if (!response.UploadId) {
    throw new Error("Failed to obtain UploadId from R2 for multipart upload");
  }

  return {
    uploadId: response.UploadId,
    key: params.key,
    publicUrl: getPublicMediaUrl(params.key),
  };
}

/**
 * Get presigned URL for a specific part in a multipart upload
 */
export async function getMultipartPartUploadUrl(params: {
  key: string;
  uploadId: string;
  partNumber: number;
  expiresInSeconds?: number;
}): Promise<string> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new UploadPartCommand({
    Bucket: bucket,
    Key: params.key,
    UploadId: params.uploadId,
    PartNumber: params.partNumber,
  });

  return await getSignedUrl(client, command, {
    expiresIn: params.expiresInSeconds || 3600,
  });
}

/**
 * Complete a multipart upload session after all parts are uploaded
 */
export async function completeMultipartUpload(params: {
  key: string;
  uploadId: string;
  parts: CompletedPart[];
}): Promise<{ publicUrl: string; key: string }> {
  const client = getR2Client();
  const bucket = getR2BucketName();

  const command = new CompleteMultipartUploadCommand({
    Bucket: bucket,
    Key: params.key,
    UploadId: params.uploadId,
    MultipartUpload: {
      Parts: params.parts.sort((a, b) => (a.PartNumber || 0) - (b.PartNumber || 0)),
    },
  });

  await client.send(command);
  return {
    publicUrl: getPublicMediaUrl(params.key),
    key: params.key,
  };
}

/**
 * Abort a multipart upload session (cleans up any partial buffers in R2)
 */
export async function abortMultipartUpload(params: {
  key: string;
  uploadId: string;
}): Promise<boolean> {
  try {
    const client = getR2Client();
    const bucket = getR2BucketName();

    const command = new AbortMultipartUploadCommand({
      Bucket: bucket,
      Key: params.key,
      UploadId: params.uploadId,
    });

    await client.send(command);
    return true;
  } catch (err) {
    console.error("Failed to abort multipart upload:", err);
    return false;
  }
}
