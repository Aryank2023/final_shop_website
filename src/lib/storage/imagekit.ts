import crypto from "crypto";

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export const ALLOWED_VIDEO_MIMES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
] as const;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50 MB

export const DEFAULT_IMAGEKIT_ENDPOINT = "https://ik.imagekit.io/3syjgmr6o";

export const ALLOWED_FOLDERS = [
  "/products",
  "/gallery",
  "/services",
  "/homepage",
  "/testimonials",
] as const;

export type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

/**
 * Normalizes requested folder paths safely.
 * Matches only exact entries from ALLOWED_FOLDERS.
 * Rejects traversal, nested paths, query strings, and prefix tricks (e.g. /products-extra).
 * Preserves the fallback behavior of /products for invalid folders.
 */
export function sanitizeFolder(requestedFolder?: string): AllowedFolder {
  if (!requestedFolder || typeof requestedFolder !== "string") {
    return "/products";
  }

  // Reject leading or trailing whitespace
  if (requestedFolder !== requestedFolder.trim()) {
    return "/products";
  }

  // Reject query strings or hashes
  if (requestedFolder.includes("?") || requestedFolder.includes("#")) {
    return "/products";
  }

  // Reject path traversal, backslashes, or multiple consecutive slashes
  if (
    requestedFolder.includes("..") ||
    requestedFolder.includes("\\") ||
    /\/{2,}/.test(requestedFolder)
  ) {
    return "/products";
  }

  // Normalize to lowercase with single leading slash and no trailing slash
  const withoutTrailing = requestedFolder.replace(/\/+$/, "");
  const normalized = withoutTrailing.startsWith("/")
    ? withoutTrailing.toLowerCase()
    : `/${withoutTrailing.toLowerCase()}`;

  // Match only exact entries in ALLOWED_FOLDERS
  const isAllowed = (ALLOWED_FOLDERS as readonly string[]).includes(normalized);
  if (isAllowed) {
    return normalized as AllowedFolder;
  }

  return "/products";
}

export function isImageKitConfigured(): boolean {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey =
    process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  return Boolean(privateKey && publicKey);
}

export function getImageKitEndpoint(): string {
  return (
    process.env.IMAGEKIT_URL_ENDPOINT ||
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ||
    DEFAULT_IMAGEKIT_ENDPOINT
  ).replace(/\/$/, "");
}

/**
 * Generates authentication parameters for client-side ImageKit upload.
 * Fails safely if the private key or public key is missing.
 * Never exposes the private key in returned authentication parameters.
 */
export function getImageKitAuthParams(): {
  token: string;
  expire: number;
  signature: string;
  publicKey: string;
  urlEndpoint: string;
} {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey =
    process.env.IMAGEKIT_PUBLIC_KEY ||
    process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;

  if (!privateKey || !publicKey) {
    throw new Error(
      "ImageKit credentials are not properly configured. Both private and public keys are required."
    );
  }

  const urlEndpoint = getImageKitEndpoint();

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
  const signature = crypto
    .createHmac("sha1", privateKey)
    .update(token + expire)
    .digest("hex");

  return {
    token,
    expire,
    signature,
    publicKey,
    urlEndpoint,
  };
}

/**
 * Checks file signature (magic bytes) to prevent forged file extensions.
 * Validates JPEG, PNG, GIF, WebP, WebM, MP4, and QuickTime.
 * Returns false for unsupported MIME types. Never defaults to true.
 */
export function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (!buffer || buffer.length < 12 || !mimeType || typeof mimeType !== "string") {
    return false;
  }

  const hex = buffer.toString("hex", 0, 12).toLowerCase();
  const normalizedMime = mimeType.trim().toLowerCase();

  switch (normalizedMime) {
    case "image/jpeg":
      return hex.startsWith("ffd8ff");
    case "image/png":
      return hex.startsWith("89504e47");
    case "image/gif":
      return hex.startsWith("47494638");
    case "image/webp":
      // RIFF....WEBP
      return hex.startsWith("52494646") && buffer.toString("ascii", 8, 12) === "WEBP";
    case "video/webm":
      // 1A 45 DF A3 (EBML Header)
      return hex.startsWith("1a45dfa3");
    case "video/quicktime": {
      // Must have 'ftyp' box identifier at offset 4..8
      if (buffer.toString("ascii", 4, 8) !== "ftyp") {
        return false;
      }
      const majorBrand = buffer.toString("ascii", 8, 12).toLowerCase();
      return majorBrand === "qt  ";
    }
    case "video/mp4": {
      // Must have 'ftyp' box identifier at offset 4..8
      if (buffer.toString("ascii", 4, 8) !== "ftyp") {
        return false;
      }
      const majorBrand = buffer.toString("ascii", 8, 12).toLowerCase();
      const validBrands = [
        "isom",
        "iso2",
        "iso3",
        "iso4",
        "iso5",
        "iso6",
        "mp41",
        "mp42",
        "m4v ",
        "m4a ",
        "m4b ",
        "m4p ",
        "avc1",
        "dash",
        "msnv",
      ];
      return validBrands.includes(majorBrand);
    }
    default:
      return false;
  }
}

/**
 * Maps supported MIME types to their canonical, validated file extensions.
 */
export const MIME_TO_EXTENSION: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

/**
 * Returns the canonical file extension for a supported MIME type.
 * Returns null if the MIME type is not supported.
 */
export function getExtensionFromMime(mimeType?: string): string | null {
  if (!mimeType || typeof mimeType !== "string") {
    return null;
  }
  const normalized = mimeType.trim().toLowerCase();
  if (normalized === "image/jpg") {
    return ".jpg";
  }
  return MIME_TO_EXTENSION[normalized] || null;
}

/**
 * Detects the MIME type of a file buffer using magic byte verification.
 */
export function detectMimeFromBuffer(buffer: Buffer): string | null {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }
  for (const mime of [...ALLOWED_IMAGE_MIMES, ...ALLOWED_VIDEO_MIMES]) {
    if (verifyMagicBytes(buffer, mime)) {
      return mime;
    }
  }
  return null;
}

/**
 * Generates a collision-resistant, safe filename using a random hex identifier
 * and a validated extension derived strictly from the validated MIME type.
 * Never uses or incorporates untrusted user-supplied filenames.
 */
export function generateSafeFilename(mimeType: string, prefix = "mv"): string {
  const ext = getExtensionFromMime(mimeType);
  if (!ext) {
    throw new Error(`Unsupported MIME type for safe filename generation: "${mimeType}"`);
  }
  const timestamp = Date.now();
  const randomBytes = crypto.randomBytes(16).toString("hex");
  return `${prefix}_${timestamp}_${randomBytes}${ext}`;
}

/**
 * Sanitizes user-supplied filenames for safe display metadata only.
 * Strips directory traversal, path separators (/ and \), control characters, and whitespace.
 * NEVER use the returned value as a filesystem path or storage key.
 */
export function sanitizeOriginalFilename(rawName?: string): string {
  if (!rawName || typeof rawName !== "string") {
    return "media";
  }
  // Strip path traversal and directory separators (both POSIX / and Windows \)
  const base = rawName.replace(/^.*[\\/]/, "");
  // Remove traversal sequences and control characters
  const cleaned = base.replace(/\.\.+/g, "").replace(/[\x00-\x1f\x7f]/g, "").trim();
  return cleaned.slice(0, 255) || "media";
}

/**
 * Validates upload file format, size, and magic bytes.
 * Requires a valid non-empty filename, a supported MIME type, and a positive integer size.
 * Validates buffer length matches declared size if provided.
 */
export function validateUpload(file: {
  name: string;
  size: number;
  type: string;
  buffer?: Buffer;
}): { valid: boolean; error?: string } {
  if (!file || typeof file !== "object") {
    return { valid: false, error: "Invalid upload payload." };
  }

  // Validate filename
  if (!file.name || typeof file.name !== "string" || !file.name.trim()) {
    return { valid: false, error: "A valid, non-empty filename is required." };
  }

  // Validate file size (positive integer)
  if (
    typeof file.size !== "number" ||
    !Number.isInteger(file.size) ||
    file.size <= 0
  ) {
    return { valid: false, error: "File size must be a positive integer." };
  }

  // Validate MIME type
  if (!file.type || typeof file.type !== "string" || !file.type.trim()) {
    return { valid: false, error: "A valid MIME type is required." };
  }

  const normalizedMime = file.type.trim().toLowerCase();
  const isVideo = (ALLOWED_VIDEO_MIMES as readonly string[]).includes(normalizedMime);
  const isImage = (ALLOWED_IMAGE_MIMES as readonly string[]).includes(normalizedMime);

  if (isVideo) {
    if (file.size > MAX_VIDEO_SIZE) {
      return {
        valid: false,
        error: "Video exceeds maximum size limit of 50 MB.",
      };
    }
  } else if (isImage) {
    if (file.size > MAX_IMAGE_SIZE) {
      return {
        valid: false,
        error: "Image exceeds maximum size limit of 5 MB.",
      };
    }
  } else {
    if (normalizedMime.startsWith("video/")) {
      return {
        valid: false,
        error: `Invalid video format (${file.type}). Allowed: MP4, WebM, MOV.`,
      };
    }
    return {
      valid: false,
      error: `Invalid image format (${file.type}). Allowed: JPG, PNG, WEBP, GIF.`,
    };
  }

  // Validate buffer if provided
  if (file.buffer !== undefined) {
    if (!Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
      return {
        valid: false,
        error: "Uploaded file buffer must be non-empty.",
      };
    }

    if (file.buffer.length !== file.size) {
      return {
        valid: false,
        error: "File buffer size does not match declared size.",
      };
    }

    if (!verifyMagicBytes(file.buffer, normalizedMime)) {
      return {
        valid: false,
        error: `File header mismatch. File content does not match reported MIME type ${file.type}.`,
      };
    }
  }

  return { valid: true };
}

export const IMAGEKIT_FILE_ID_REGEX = /^[a-f0-9]{24}$/i;

/**
 * Server-side upload to ImageKit via REST API.
 * Never passes raw user-supplied filenames directly to ImageKit.
 */
export async function uploadBufferToImageKit(params: {
  buffer: Buffer;
  fileName?: string;
  mimeType?: string;
  folder?: string;
}): Promise<{ url: string; fileId: string; name: string }> {
  // 1. Always detect MIME strictly from the actual buffer
  const detectedMime = detectMimeFromBuffer(params.buffer);
  if (!detectedMime) {
    throw new Error("Cannot upload to ImageKit: file buffer content is unsupported or failed MIME detection.");
  }

  // 2. If a caller-supplied MIME type exists, normalize and require exact match with detected MIME
  if (params.mimeType) {
    const rawMime = params.mimeType.trim().toLowerCase();
    const normalizedDeclaredMime = rawMime === "image/jpg" ? "image/jpeg" : rawMime;
    if (normalizedDeclaredMime !== detectedMime) {
      throw new Error(`MIME type mismatch: declared '${params.mimeType}' does not match detected '${detectedMime}'.`);
    }
  }

  // 3. Always generate a fresh safe filename; never accept or reuse params.fileName as a storage filename
  const safeFileName = generateSafeFilename(detectedMime);

  // 4. Verify ImageKit credentials
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error(
      "IMAGEKIT_PRIVATE_KEY is not configured in environment variables."
    );
  }

  const targetFolder = sanitizeFolder(params.folder);

  const formData = new FormData();
  const blob = new Blob([new Uint8Array(params.buffer)]);
  formData.append("file", blob, safeFileName);
  formData.append("fileName", safeFileName);
  formData.append("folder", targetFolder);
  formData.append("useUniqueFileName", "true");

  const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;

  const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: {
      Authorization: authHeader,
    },
    body: formData,
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error(`[ImageKit Upload Error] HTTP ${response.status}:`, errorBody);
    throw new Error(`ImageKit upload failed with HTTP status ${response.status}`);
  }

  const data = await response.json();
  if (!data || typeof data !== "object") {
    throw new Error("Invalid response format received from ImageKit upload service.");
  }
  if (!data.url || typeof data.url !== "string" || !data.url.startsWith("https://")) {
    throw new Error("ImageKit upload response missing a valid secure URL.");
  }
  if (!data.fileId || typeof data.fileId !== "string" || !IMAGEKIT_FILE_ID_REGEX.test(data.fileId)) {
    throw new Error("ImageKit upload response missing a valid file ID.");
  }
  if (!data.name || typeof data.name !== "string") {
    throw new Error("ImageKit upload response missing a valid filename.");
  }

  return {
    url: data.url,
    fileId: data.fileId,
    name: data.name,
  };
}

/**
 * Server-side deletion of an asset from ImageKit via REST API
 */
export async function deleteFileFromImageKit(fileId: string): Promise<boolean> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is not configured.");
  }

  if (!fileId || typeof fileId !== "string" || !IMAGEKIT_FILE_ID_REGEX.test(fileId.trim())) {
    throw new Error("Invalid ImageKit fileId provided for deletion.");
  }

  const cleanFileId = fileId.trim();
  const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;

  const response = await fetch(`https://api.imagekit.io/v1/files/${encodeURIComponent(cleanFileId)}`, {
    method: "DELETE",
    headers: {
      Authorization: authHeader,
    },
    signal: AbortSignal.timeout(15000),
  });

  // 204 No Content or 200 OK indicates successful deletion
  if (response.status === 204 || response.status === 200) {
    return true;
  }

  // 404 indicates the file is already gone, which we treat gracefully
  if (response.status === 404) {
    return true;
  }

  const errorBody = await response.text().catch(() => "");
  console.error(`[ImageKit Deletion Error] HTTP ${response.status}:`, errorBody);
  throw new Error(`ImageKit deletion failed with HTTP status ${response.status}`);
}
