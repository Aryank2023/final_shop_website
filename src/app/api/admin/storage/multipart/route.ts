import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import {
  isR2Configured,
  validateMediaUpload,
  generateObjectKey,
  initiateMultipartUpload,
  getMultipartPartUploadUrl,
  completeMultipartUpload,
  abortMultipartUpload,
} from "@/lib/storage/r2";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    if (!isR2Configured()) {
      return NextResponse.json(
        {
          error:
            "Cloudflare R2 is not configured. Please set R2 credentials in environment variables.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // 1. INITIATE MULTIPART UPLOAD
    if (action === "initiate") {
      const { filename, mimeType, size, category = "portfolio-video" } = body;

      const validation = validateMediaUpload({
        filename,
        size: Number(size || 0),
        mimeType,
        category: category as any,
      });

      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }

      const key = generateObjectKey("portfolio/videos", filename);
      const initResult = await initiateMultipartUpload({
        key,
        contentType: mimeType,
      });

      // Save initial media asset record
      const mediaAsset = await prisma.mediaAsset.create({
        data: {
          provider: "CLOUDFLARE_R2",
          publicUrl: initResult.publicUrl,
          objectKey: key,
          originalName: filename,
          mimeType,
          fileSize: size ? Number(size) : null,
          mediaType: "VIDEO",
        },
      });

      return NextResponse.json({
        success: true,
        uploadId: initResult.uploadId,
        key: initResult.key,
        publicUrl: initResult.publicUrl,
        mediaId: mediaAsset.id,
      });
    }

    // 2. GET PART PRESIGNED URL
    if (action === "get-part-url") {
      const { key, uploadId, partNumber } = body;
      if (!key || !uploadId || !partNumber) {
        return NextResponse.json(
          { error: "key, uploadId, and partNumber are required" },
          { status: 400 }
        );
      }

      const partUploadUrl = await getMultipartPartUploadUrl({
        key,
        uploadId,
        partNumber: Number(partNumber),
        expiresInSeconds: 3600,
      });

      return NextResponse.json({
        success: true,
        partUploadUrl,
        partNumber: Number(partNumber),
      });
    }

    // 3. COMPLETE MULTIPART UPLOAD
    if (action === "complete") {
      const { key, uploadId, parts } = body;
      if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
        return NextResponse.json(
          { error: "key, uploadId, and parts array are required" },
          { status: 400 }
        );
      }

      const completeResult = await completeMultipartUpload({
        key,
        uploadId,
        parts: parts.map((p) => ({
          ETag: p.eTag || p.ETag,
          PartNumber: Number(p.partNumber || p.PartNumber),
        })),
      });

      return NextResponse.json({
        success: true,
        publicUrl: completeResult.publicUrl,
        key: completeResult.key,
      });
    }

    // 4. ABORT MULTIPART UPLOAD
    if (action === "abort") {
      const { key, uploadId } = body;
      if (!key || !uploadId) {
        return NextResponse.json({ error: "key and uploadId required" }, { status: 400 });
      }

      await abortMultipartUpload({ key, uploadId });

      // Clean up uncompleted media record if present
      await prisma.mediaAsset.deleteMany({ where: { objectKey: key } }).catch(() => {});

      return NextResponse.json({ success: true, message: "Multipart upload aborted" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Multipart Upload Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

