import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import {
  isR2Configured,
  validateMediaUpload,
  generateObjectKey,
  createPresignedPutUrl,
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
            "Cloudflare R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, and R2_BUCKET_NAME in your environment.",
        },
        { status: 503 }
      );
    }

    const body = await req.json();
    const { filename, mimeType, size, category = "product-image" } = body;

    if (!filename || !mimeType) {
      return NextResponse.json(
        { error: "Filename and mimeType are required" },
        { status: 400 }
      );
    }

    // Validate file
    const validation = validateMediaUpload({
      filename,
      size: Number(size || 0),
      mimeType,
      category: category as any,
    });

    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Generate folder prefix
    let folder: "products" | "portfolio/photos" | "portfolio/videos" | "services" = "products";
    if (category === "portfolio-video") folder = "portfolio/videos";
    else if (category === "portfolio-photo") folder = "portfolio/photos";

    const key = generateObjectKey(folder, filename);

    // Create Presigned PUT URL
    const { uploadUrl, publicUrl } = await createPresignedPutUrl({
      key,
      contentType: mimeType,
      contentLength: size ? Number(size) : undefined,
      expiresInSeconds: 3600, // 1 hour
    });

    // Pre-create MediaAsset record in database
    const mediaAsset = await prisma.mediaAsset.create({
      data: {
        provider: "CLOUDFLARE_R2",
        publicUrl,
        objectKey: key,
        originalName: filename,
        mimeType,
        fileSize: size ? Number(size) : null,
        mediaType: category === "portfolio-video" ? "VIDEO" : "IMAGE",
      },
    });

    return NextResponse.json({
      success: true,
      uploadUrl,
      publicUrl,
      key,
      mediaId: mediaAsset.id,
    });
  } catch (error: any) {
    console.error("Presigned URL Error:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned upload URL: " + error.message },
      { status: 500 }
    );
  }
}

