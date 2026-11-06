import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getClientIp, verifyCsrfOrigin } from "@/lib/security";
import {
  isImageKitConfigured,
  uploadBufferToImageKit,
  deleteFileFromImageKit,
  validateUpload,
  sanitizeFolder,
  getImageKitEndpoint,
  generateSafeFilename,
  sanitizeOriginalFilename,
  detectMimeFromBuffer,
  ALLOWED_IMAGE_MIMES,
  ALLOWED_VIDEO_MIMES,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
  ALLOWED_FOLDERS,
  AllowedFolder,
} from "@/lib/storage/imagekit";
import fs from "fs/promises";
import path from "path";

const MAX_BATCH_FILE_COUNT = 10;
const MAX_TOTAL_BATCH_SIZE = 100 * 1024 * 1024; // 100 MB total batch limit
const IMAGEKIT_FILE_ID_REGEX = /^[a-f0-9]{24}$/i;

export async function POST(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (admin.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions. Only OWNER role is authorized." },
        { status: 403 }
      );
    }

    // Safe Content-Length pre-check before req.formData() where header is present
    const contentLengthHeader = req.headers.get("content-length");
    if (contentLengthHeader !== null) {
      const trimmedLength = contentLengthHeader.trim();
      // Strict validation of a positive decimal integer
      if (!/^[1-9]\d*$/.test(trimmedLength)) {
        return NextResponse.json(
          { error: "Invalid Content-Length header: must be a positive decimal integer" },
          { status: 400 }
        );
      }

      const declaredContentLength = Number(trimmedLength);
      if (!Number.isSafeInteger(declaredContentLength)) {
        return NextResponse.json(
          { error: "Invalid Content-Length header: value exceeds safe integer limits" },
          { status: 400 }
        );
      }

      // Allow for multipart boundary and form field headers overhead (10 MB allowance over batch limit)
      const MAX_CONTENT_LENGTH_HEADER = MAX_TOTAL_BATCH_SIZE + 10 * 1024 * 1024;
      if (declaredContentLength > MAX_CONTENT_LENGTH_HEADER) {
        return NextResponse.json(
          { error: "Payload exceeds maximum allowed upload size limit" },
          { status: 413 }
        );
      }
    }

    const formData = await req.formData();

    // Collect all files from formData
    const files: File[] = [];
    formData.forEach((value, key) => {
      if ((key === "file" || key === "files" || key.startsWith("file[")) && value instanceof File) {
        files.push(value);
      }
    });

    if (files.length === 0) {
      return NextResponse.json({ error: "No media file provided for upload" }, { status: 400 });
    }

    if (files.length > MAX_BATCH_FILE_COUNT) {
      return NextResponse.json(
        { error: `Cannot upload more than ${MAX_BATCH_FILE_COUNT} files in a single batch` },
        { status: 400 }
      );
    }

    // Validate file metadata (count, individual size, total batch size) BEFORE reading arrayBuffer()
    let totalBatchSize = 0;
    for (const file of files) {
      if (!file.name || typeof file.name !== "string" || !file.name.trim()) {
        return NextResponse.json({ error: "A valid, non-empty filename is required for all files" }, { status: 400 });
      }

      if (typeof file.size !== "number" || !Number.isInteger(file.size) || file.size <= 0) {
        return NextResponse.json({ error: `Invalid file size for ${file.name}` }, { status: 400 });
      }

      const normalizedMime = file.type ? file.type.trim().toLowerCase() : "";
      const isVideo = (ALLOWED_VIDEO_MIMES as readonly string[]).includes(normalizedMime);
      const isImage = (ALLOWED_IMAGE_MIMES as readonly string[]).includes(normalizedMime);

      if (isVideo) {
        if (file.size > MAX_VIDEO_SIZE) {
          return NextResponse.json(
            { error: `Video ${file.name} exceeds maximum size limit of 50 MB.` },
            { status: 400 }
          );
        }
      } else if (isImage) {
        if (file.size > MAX_IMAGE_SIZE) {
          return NextResponse.json(
            { error: `Image ${file.name} exceeds maximum size limit of 5 MB.` },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Unsupported file format for ${file.name}. Allowed: JPG, PNG, WEBP, GIF, MP4, WebM, QuickTime.` },
          { status: 400 }
        );
      }

      totalBatchSize += file.size;
    }

    if (totalBatchSize > MAX_TOTAL_BATCH_SIZE) {
      return NextResponse.json(
        { error: "Total batch size exceeds maximum limit of 100 MB" },
        { status: 400 }
      );
    }

    // Determine target folder from allowlist
    const folderParam = formData.get("folder")?.toString() || "";
    const categoryParam = formData.get("category")?.toString() || "products";
    let targetFolder: AllowedFolder = "/products";

    if (folderParam) {
      targetFolder = sanitizeFolder(folderParam);
    } else if (categoryParam === "gallery" || categoryParam.includes("portfolio")) {
      targetFolder = "/gallery";
    } else if (categoryParam.includes("service") || categoryParam.includes("cyber")) {
      targetFolder = "/services";
    } else if (categoryParam.includes("slide") || categoryParam.includes("hero")) {
      targetFolder = "/homepage";
    } else if (categoryParam.includes("testimonial")) {
      targetFolder = "/testimonials";
    } else {
      targetFolder = sanitizeFolder(categoryParam);
    }

    const useImageKit = isImageKitConfigured();
    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && !useImageKit) {
      return NextResponse.json(
        { error: "ImageKit storage credentials are not configured on the production server." },
        { status: 500 }
      );
    }

    // Read buffers and validate ALL files before uploading or writing anything to storage
    const validatedFiles: {
      file: File;
      buffer: Buffer;
      safeName: string;
      originalName: string;
      detectedMime: string;
    }[] = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const validation = validateUpload({
        name: file.name,
        size: file.size,
        type: file.type,
        buffer,
      });

      if (!validation.valid) {
        return NextResponse.json({ error: validation.error || "File validation failed" }, { status: 400 });
      }

      // Detect MIME strictly from buffer content
      const detectedMime = detectMimeFromBuffer(buffer);
      if (!detectedMime) {
        return NextResponse.json(
          { error: `File content could not be verified or is an unsupported format for ${sanitizeOriginalFilename(file.name)}.` },
          { status: 400 }
        );
      }

      // If caller-supplied MIME type exists, normalize and enforce exact match with detected MIME
      const normalizedDeclaredMime = file.type ? file.type.trim().toLowerCase() : "";
      const canonicalDeclaredMime = normalizedDeclaredMime === "image/jpg" ? "image/jpeg" : normalizedDeclaredMime;
      if (canonicalDeclaredMime && canonicalDeclaredMime !== detectedMime) {
        return NextResponse.json(
          { error: `MIME type mismatch for ${sanitizeOriginalFilename(file.name)}: declared '${file.type}' does not match detected '${detectedMime}'.` },
          { status: 400 }
        );
      }

      // Generate a collision-resistant safe filename derived strictly from detected buffer MIME type
      const safeName = generateSafeFilename(detectedMime);
      // Keep original filename only as sanitized display metadata; never as a filesystem path
      const originalName = sanitizeOriginalFilename(file.name);

      validatedFiles.push({ file, buffer, safeName, originalName, detectedMime });
    }

    const uploadedResults: {
      url: string;
      filename: string;
      originalFilename?: string;
      size: number;
      mimeType: string;
      fileId?: string;
      key?: string;
      provider: string;
    }[] = [];

    const localUploadsDir = path.resolve(process.cwd(), "public", "uploads");

    if (useImageKit) {
      const uploadedImageKitIds: string[] = [];

      for (const item of validatedFiles) {
        try {
          const ikResult = await uploadBufferToImageKit({
            buffer: item.buffer,
            fileName: item.safeName,
            mimeType: item.detectedMime,
            folder: targetFolder,
          });

          uploadedImageKitIds.push(ikResult.fileId);

          uploadedResults.push({
            url: ikResult.url,
            filename: ikResult.name,
            originalFilename: item.originalName,
            size: item.file.size,
            mimeType: item.detectedMime,
            fileId: ikResult.fileId,
            key: ikResult.fileId,
            provider: "IMAGEKIT",
          });
        } catch (ikErr: any) {
          console.error("ImageKit upload error:", ikErr);

          // Rollback: delete already uploaded assets from ImageKit
          for (const rollbackId of uploadedImageKitIds) {
            try {
              await deleteFileFromImageKit(rollbackId);
            } catch (rbErr) {
              console.error(`Rollback deletion failed for ImageKit asset ${rollbackId}:`, rbErr);
            }
          }

          return NextResponse.json(
            { error: "Media storage upload failed. Please try again." },
            { status: 502 }
          );
        }
      }
    } else {
      // Local fallback strictly in development
      await fs.mkdir(localUploadsDir, { recursive: true });
      const writtenLocalPaths: string[] = [];

      for (const item of validatedFiles) {
        try {
          const cleanName = item.safeName;
          const filePath = path.join(localUploadsDir, cleanName);

          // Verify path resolution stays strictly inside localUploadsDir
          const normalizedPath = path.resolve(filePath);
          if (!normalizedPath.startsWith(localUploadsDir + path.sep)) {
            throw new Error("Invalid target path for local file storage.");
          }

          await fs.writeFile(filePath, item.buffer);
          writtenLocalPaths.push(filePath);

          uploadedResults.push({
            url: `/uploads/${cleanName}`,
            filename: cleanName,
            originalFilename: item.originalName,
            size: item.file.size,
            mimeType: item.detectedMime,
            fileId: cleanName,
            key: cleanName,
            provider: "LOCAL_FALLBACK_DEV",
          });
        } catch (fsErr: any) {
          console.error("Local file write error:", fsErr);

          // Rollback: delete already written files
          for (const rollbackPath of writtenLocalPaths) {
            try {
              await fs.unlink(rollbackPath);
            } catch (rbErr) {
              console.error(`Rollback deletion failed for local file ${rollbackPath}:`, rbErr);
            }
          }

          return NextResponse.json(
            { error: "Failed to store media file locally." },
            { status: 500 }
          );
        }
      }
    }

    // Record upload in AuditLog
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "UPLOAD_MEDIA_ASSETS",
          entity: "MediaAsset",
          entityId: uploadedResults[0]?.fileId || uploadedResults[0]?.url,
          ipAddress: ip,
          metadata: {
            count: uploadedResults.length,
            folder: targetFolder,
            provider: useImageKit ? "IMAGEKIT" : "LOCAL_FALLBACK_DEV",
            files: uploadedResults.map((r) => ({
              url: r.url,
              fileId: r.fileId,
              filename: r.filename,
              originalFilename: r.originalFilename,
              size: r.size,
            })),
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice on upload:", auditErr);
    }

    return NextResponse.json({
      success: true,
      provider: useImageKit ? "IMAGEKIT" : "LOCAL_FALLBACK_DEV",
      url: uploadedResults[0]?.url,
      fileId: uploadedResults[0]?.fileId,
      key: uploadedResults[0]?.key,
      urls: uploadedResults.map((r) => r.url),
      files: uploadedResults,
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to process media upload. An unexpected error occurred." },
      { status: 500 }
    );
  }
}

/**
 * Verifies that a local file deletion target is safe and strictly contained within
 * the resolved uploads directory, preventing directory traversal and symlink-based escapes.
 *
 * 1. Resolves the real physical path of baseUploadsDir.
 * 2. Rejects symbolic links as deletion targets via fs.lstat().
 * 3. Resolves the real physical path of the candidate file via fs.realpath().
 * 4. Ensures the real target path is strictly inside the real uploads directory.
 * 5. Verifies the target is an existing regular file.
 */
async function verifySafeLocalDeletionPath(
  baseUploadsDir: string,
  filename: string
): Promise<{ safePath: string } | { error: string; status: number }> {
  // 1. Resolve and verify the real path of the base uploads directory
  let realUploadsDir: string;
  try {
    realUploadsDir = await fs.realpath(baseUploadsDir);
  } catch (dirErr: any) {
    if (dirErr && dirErr.code === "ENOENT") {
      return { error: "Local media file not found on disk or already deleted", status: 404 };
    }
    console.error("Failed to resolve uploads directory realpath:", dirErr);
    return { error: "Unable to verify local uploads directory.", status: 500 };
  }

  const localCandidate = path.resolve(baseUploadsDir, filename);

  // Lexical containment check before filesystem traversal
  const uploadsDirPrefix = baseUploadsDir.endsWith(path.sep)
    ? baseUploadsDir
    : baseUploadsDir + path.sep;
  if (!localCandidate.startsWith(uploadsDirPrefix)) {
    return { error: "Access denied: local file deletion outside public/uploads is forbidden", status: 403 };
  }

  // 2. Reject symbolic links as deletion targets
  let lstatResult;
  try {
    lstatResult = await fs.lstat(localCandidate);
  } catch (statErr: any) {
    if (statErr && statErr.code === "ENOENT") {
      return { error: "Local media file not found on disk or already deleted", status: 404 };
    }
    console.error("Failed to inspect local file status:", statErr);
    return { error: "Failed to access local media file.", status: 500 };
  }

  if (lstatResult.isSymbolicLink()) {
    return { error: "Access denied: symbolic links are not permitted as deletion targets", status: 400 };
  }

  if (!lstatResult.isFile()) {
    return { error: "Target is not a valid file", status: 400 };
  }

  // 3. Resolve the real physical path of the target file
  let realTargetFile: string;
  try {
    realTargetFile = await fs.realpath(localCandidate);
  } catch (realErr: any) {
    if (realErr && realErr.code === "ENOENT") {
      return { error: "Local media file not found on disk or already deleted", status: 404 };
    }
    console.error("Failed to resolve local file realpath:", realErr);
    return { error: "Failed to resolve real path for local media file.", status: 500 };
  }

  // 4. Ensure resolved target remains strictly inside the resolved uploads directory
  const realUploadsPrefix = realUploadsDir.endsWith(path.sep)
    ? realUploadsDir
    : realUploadsDir + path.sep;
  const relativeToRealUploads = path.relative(realUploadsDir, realTargetFile);

  if (
    !realTargetFile.startsWith(realUploadsPrefix) ||
    relativeToRealUploads.startsWith("..") ||
    path.isAbsolute(relativeToRealUploads) ||
    relativeToRealUploads === ""
  ) {
    return { error: "Access denied: target file resolves outside public/uploads directory", status: 403 };
  }

  // 5. Verify resolved target is a regular file
  let realStat;
  try {
    realStat = await fs.stat(realTargetFile);
  } catch (statErr: any) {
    if (statErr && statErr.code === "ENOENT") {
      return { error: "Local media file not found on disk or already deleted", status: 404 };
    }
    console.error("Failed to verify resolved file stat:", statErr);
    return { error: "Failed to verify target file status.", status: 500 };
  }

  if (!realStat.isFile()) {
    return { error: "Target is not a valid file", status: 400 };
  }

  return { safePath: realTargetFile };
}

export async function DELETE(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (admin.role !== "OWNER") {
      return NextResponse.json(
        { error: "Forbidden: insufficient permissions. Only OWNER role is authorized." },
        { status: 403 }
      );
    }

    let fileId = "";
    let mediaUrl = "";

    const { searchParams } = new URL(req.url);
    const paramFileId = searchParams.get("fileId") || searchParams.get("id");
    const paramUrl = searchParams.get("url");

    if (paramFileId && typeof paramFileId === "string") {
      fileId = paramFileId.trim();
    }
    if (paramUrl && typeof paramUrl === "string") {
      mediaUrl = paramUrl.trim();
    }

    // Parse the JSON body whenever either fileId or mediaUrl is missing after reading query parameters
    if (!fileId || !mediaUrl) {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        try {
          const body = await req.json();
          if (body && typeof body === "object" && !Array.isArray(body)) {
            // Fill only missing values from the JSON body (preserve query-parameter precedence)
            if (!fileId) {
              if (typeof body.fileId === "string") fileId = body.fileId.trim();
              else if (typeof body.id === "string") fileId = body.id.trim();
            }
            if (!mediaUrl) {
              if (typeof body.url === "string") mediaUrl = body.url.trim();
            }
          }
        } catch {
          // malformed JSON leaves missing fields empty and will trigger validation below
        }
      }
    }

    // Require mediaUrl to identify the asset and verify database references
    if (!mediaUrl) {
      return NextResponse.json(
        { error: "A valid media URL ('url') is required to verify database references before deletion" },
        { status: 400 }
      );
    }

    // 1. Strict URL classification
    // Treat only a valid relative URL beginning exactly with /uploads/ as a local upload.
    const isRelativeLocal =
      mediaUrl.startsWith("/uploads/") &&
      !mediaUrl.includes("://") &&
      !mediaUrl.startsWith("//");

    let isImageKit = false;

    if (!isRelativeLocal) {
      // Reject external URLs that contain /uploads/ in their hostname or elsewhere
      if (mediaUrl.includes("/uploads/")) {
        return NextResponse.json(
          { error: "Invalid media URL: external URLs containing '/uploads/' are not permitted" },
          { status: 400 }
        );
      }

      // Validate ImageKit URL: require configured ImageKit endpoint origin and expected path
      try {
        const parsedMediaUrl = new URL(mediaUrl);
        if (parsedMediaUrl.protocol !== "https:" && parsedMediaUrl.protocol !== "http:") {
          return NextResponse.json(
            { error: "Invalid media URL: protocol must be HTTP or HTTPS" },
            { status: 400 }
          );
        }

        const endpointUrl = new URL(getImageKitEndpoint());
        const expectedOrigin = endpointUrl.origin.toLowerCase();
        const expectedBasePath = endpointUrl.pathname.replace(/\/+$/, "");

        if (parsedMediaUrl.origin.toLowerCase() !== expectedOrigin) {
          return NextResponse.json(
            { error: "Invalid media URL: URL origin does not match the configured media storage provider" },
            { status: 400 }
          );
        }

        if (expectedBasePath && !parsedMediaUrl.pathname.startsWith(expectedBasePath + "/")) {
          return NextResponse.json(
            { error: "Invalid media URL: URL path does not match the configured media storage endpoint" },
            { status: 400 }
          );
        }

        const subPath = expectedBasePath
          ? parsedMediaUrl.pathname.slice(expectedBasePath.length)
          : parsedMediaUrl.pathname;

        const isAllowedFolder = ALLOWED_FOLDERS.some((folder) => subPath.startsWith(folder + "/"));
        if (!isAllowedFolder) {
          return NextResponse.json(
            { error: "Invalid media URL: URL path is not within an allowed media storage folder" },
            { status: 400 }
          );
        }

        isImageKit = true;
      } catch {
        return NextResponse.json(
          { error: "Invalid media URL: must be a relative /uploads/ path or a valid ImageKit URL" },
          { status: 400 }
        );
      }
    }

    let canonicalUrl = "";
    let localResolvedPath = "";

    // 2. Identity Verification & Canonicalization
    if (isImageKit) {
      // Validate fileId input length and format before making ImageKit API request
      const trimmedFileId = fileId.trim();
      if (!trimmedFileId || !IMAGEKIT_FILE_ID_REGEX.test(trimmedFileId)) {
        return NextResponse.json(
          { error: "Invalid fileId: must be a 24-character hexadecimal string" },
          { status: 400 }
        );
      }
      fileId = trimmedFileId;

      // Reject query strings or fragments in mediaUrl
      if (mediaUrl.includes("?") || mediaUrl.includes("#")) {
        return NextResponse.json(
          { error: "Invalid media URL: query strings and fragments are not permitted" },
          { status: 400 }
        );
      }

      // Check ImageKit private key directly for server-side deletion
      const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
      if (!privateKey) {
        return NextResponse.json(
          { error: "ImageKit private key is not configured on the server." },
          { status: 500 }
        );
      }

      // Fetch file details from ImageKit REST API
      const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;
      let fileDetailsRes: Response;
      try {
        fileDetailsRes = await fetch(
          `https://api.imagekit.io/v1/files/${encodeURIComponent(fileId)}/details`,
          {
            method: "GET",
            headers: {
              Authorization: authHeader,
            },
          }
        );
      } catch (fetchErr) {
        console.error("Failed to connect to ImageKit file details API:", fetchErr);
        return NextResponse.json(
          { error: "Unable to verify asset with storage provider." },
          { status: 502 }
        );
      }

      if (fileDetailsRes.status === 404) {
        return NextResponse.json(
          { error: "Media asset not found in ImageKit storage" },
          { status: 404 }
        );
      }

      if (fileDetailsRes.status === 400) {
        return NextResponse.json(
          { error: "Invalid fileId provided for media asset" },
          { status: 400 }
        );
      }

      if (!fileDetailsRes.ok) {
        console.error(`ImageKit file details returned HTTP status ${fileDetailsRes.status}`);
        return NextResponse.json(
          { error: "Storage provider verification failed." },
          { status: 502 }
        );
      }

      let assetData: any;
      try {
        assetData = await fileDetailsRes.json();
      } catch (jsonErr) {
        console.error("Failed to parse ImageKit file details response:", jsonErr);
        return NextResponse.json(
          { error: "Storage provider returned an invalid response." },
          { status: 502 }
        );
      }

      if (!assetData || typeof assetData.url !== "string" || !assetData.url) {
        return NextResponse.json(
          { error: "Storage provider returned invalid asset metadata." },
          { status: 502 }
        );
      }

      if (assetData.fileId !== fileId) {
        return NextResponse.json(
          { error: "Asset identity verification failed: fileId mismatch" },
          { status: 400 }
        );
      }

      // Parse assetData.url as canonical URL
      let parsedCanonical: URL;
      try {
        parsedCanonical = new URL(assetData.url.trim());
      } catch {
        return NextResponse.json(
          { error: "Storage provider returned an invalid asset URL format." },
          { status: 502 }
        );
      }

      // After parsing assetData.url, reject it if parsedCanonical.search or parsedCanonical.hash is non-empty
      if (parsedCanonical.search !== "" || parsedCanonical.hash !== "") {
        return NextResponse.json(
          { error: "Storage provider returned non-canonical URL with query parameters or hash." },
          { status: 502 }
        );
      }

      // Independently verify canonical URL origin against the configured ImageKit endpoint
      const endpointUrl = new URL(getImageKitEndpoint());
      const expectedOrigin = endpointUrl.origin.toLowerCase();
      const expectedBasePath = endpointUrl.pathname.replace(/\/+$/, "");

      if (parsedCanonical.origin.toLowerCase() !== expectedOrigin) {
        return NextResponse.json(
          { error: "Storage provider returned an asset URL with an unexpected origin." },
          { status: 502 }
        );
      }

      if (expectedBasePath && !parsedCanonical.pathname.startsWith(expectedBasePath + "/")) {
        return NextResponse.json(
          { error: "Storage provider returned an asset URL with an unexpected endpoint base path." },
          { status: 502 }
        );
      }

      // Independently verify that its pathname belongs to one of the exact allowed folders in ALLOWED_FOLDERS
      const canonicalSubPath = expectedBasePath
        ? parsedCanonical.pathname.slice(expectedBasePath.length)
        : parsedCanonical.pathname;

      const isCanonicalInAllowedFolder = ALLOWED_FOLDERS.some((folder) =>
        canonicalSubPath.startsWith(folder + "/")
      );
      if (!isCanonicalInAllowedFolder) {
        return NextResponse.json(
          { error: "Storage provider returned an asset URL outside allowed storage folders." },
          { status: 502 }
        );
      }

      // Verified exact canonical URL returned by ImageKit file-details API
      canonicalUrl = `${parsedCanonical.origin}${parsedCanonical.pathname}`;

      // Compare submitted URL against the exact canonical URL with case-sensitive pathname comparison
      let parsedSubmitted: URL;
      try {
        parsedSubmitted = new URL(mediaUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL structure during verification" },
          { status: 400 }
        );
      }

      if (
        parsedSubmitted.origin.toLowerCase() !== parsedCanonical.origin.toLowerCase() ||
        parsedSubmitted.pathname !== parsedCanonical.pathname ||
        parsedSubmitted.search !== "" ||
        parsedSubmitted.hash !== ""
      ) {
        return NextResponse.json(
          { error: "Asset identity verification failed: submitted media URL does not match canonical asset URL" },
          { status: 400 }
        );
      }
    } else if (isRelativeLocal) {
      // Reject query strings or fragments in mediaUrl
      if (mediaUrl.includes("?") || mediaUrl.includes("#")) {
        return NextResponse.json(
          { error: "Invalid media URL: query strings and fragments are not permitted" },
          { status: 400 }
        );
      }

      let decodedUrl: string;
      try {
        decodedUrl = decodeURIComponent(mediaUrl);
      } catch {
        return NextResponse.json(
          { error: "Malformed media URL encoding" },
          { status: 400 }
        );
      }

      // Reject traversal, encoded traversal, and backslashes
      if (
        decodedUrl.includes("..") ||
        decodedUrl.includes("\\") ||
        mediaUrl.includes("..") ||
        mediaUrl.includes("\\") ||
        /%2e/i.test(mediaUrl) ||
        /%2f/i.test(mediaUrl) ||
        /%5c/i.test(mediaUrl)
      ) {
        return NextResponse.json(
          { error: "Invalid media URL: path traversal detected" },
          { status: 400 }
        );
      }

      const relativePart = decodedUrl.slice("/uploads/".length).trim();
      const filename = path.basename(relativePart);

      if (!filename || filename !== relativePart || filename === "." || filename === "..") {
        return NextResponse.json(
          { error: "Invalid local media filename specified" },
          { status: 400 }
        );
      }

      // Define clearly defined canonical path for local upload
      canonicalUrl = `/uploads/${filename}`;

      // Verify submitted URL matches canonical path format
      if (mediaUrl !== canonicalUrl && decodedUrl !== canonicalUrl) {
        return NextResponse.json(
          { error: "Invalid media URL: non-canonical path format" },
          { status: 400 }
        );
      }

      // Ensure fileId and URL refer to the same asset before evaluating deletion
      if (fileId) {
        const trimmedFileId = fileId.trim();
        if (trimmedFileId !== filename && trimmedFileId !== canonicalUrl) {
          return NextResponse.json(
            { error: "Asset identity verification failed: fileId does not match the local media URL" },
            { status: 400 }
          );
        }
      }

      const localUploadsDir = path.resolve(process.cwd(), "public", "uploads");
      const verification = await verifySafeLocalDeletionPath(localUploadsDir, filename);

      if ("error" in verification) {
        return NextResponse.json(
          { error: verification.error },
          { status: verification.status }
        );
      }

      localResolvedPath = verification.safePath;
    }

    // 3. Database reference protection using the verified canonical URL
    const checkUrls = [canonicalUrl];

    const [
      productWithImg,
      galleryRecord,
      slideWithImg,
      photoServiceWithImg,
      cyberCafeWithImg,
      testimonialWithImg,
    ] = await Promise.all([
      // 1. Product.images
      prisma.product.findFirst({
        where: { images: { hasSome: checkUrls } },
      }),
      // 2. Gallery.imageUrl, Gallery.videoUrl, Gallery.fileId
      prisma.gallery.findFirst({
        where: {
          OR: [
            { imageUrl: { in: checkUrls } },
            { videoUrl: { in: checkUrls } },
            ...(fileId ? [{ fileId: fileId }] : []),
          ],
        },
      }),
      // 3. HomepageSlide.imageUrl
      prisma.homepageSlide.findFirst({
        where: { imageUrl: { in: checkUrls } },
      }),
      // 4. PhotographyService: heroImage, gallery, videos
      prisma.photographyService.findFirst({
        where: {
          OR: [
            { heroImage: { in: checkUrls } },
            { gallery: { hasSome: checkUrls } },
            { videos: { hasSome: checkUrls } },
          ],
        },
      }),
      // 5. CyberCafeService.icon
      prisma.cyberCafeService.findFirst({
        where: { icon: { in: checkUrls } },
      }),
      // 6. Testimonial.imageUrl
      prisma.testimonial.findFirst({
        where: { imageUrl: { in: checkUrls } },
      }),
    ]);

    if (
      productWithImg ||
      galleryRecord ||
      slideWithImg ||
      photoServiceWithImg ||
      cyberCafeWithImg ||
      testimonialWithImg
    ) {
      return NextResponse.json(
        {
          error:
            "Media asset is currently active and referenced in database records. Remove it from products, gallery, or services before deleting.",
        },
        { status: 409 }
      );
    }

    // 4. Physical deletion
    if (isImageKit) {
      await deleteFileFromImageKit(fileId);
    } else if (isRelativeLocal) {
      await fs.unlink(localResolvedPath);

      // Verify actual file deletion
      let stillExists = false;
      try {
        await fs.access(localResolvedPath);
        stillExists = true;
      } catch {
        stillExists = false;
      }

      if (stillExists) {
        console.error("Local file deletion verification failed:", localResolvedPath);
        return NextResponse.json(
          { error: "Failed to verify file deletion from local storage" },
          { status: 500 }
        );
      }
    }

    // 5. Audit Logging
    try {
      const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "DELETE_MEDIA_ASSET",
          entity: "MediaAsset",
          entityId: fileId || mediaUrl,
          ipAddress: ip,
          metadata: {
            fileId: fileId || null,
            mediaUrl,
            canonicalUrl,
            storageType: isRelativeLocal ? "LOCAL" : "IMAGEKIT",
          },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice on delete:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: "Media asset deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete Media Error:", error);
    return NextResponse.json(
      { error: "Failed to delete media asset. An unexpected error occurred." },
      { status: 500 }
    );
  }
}
