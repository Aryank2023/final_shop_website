import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  isR2Configured,
  generateObjectKey,
  uploadBufferToR2,
  ALLOWED_IMAGE_TYPES,
  MAX_PRODUCT_IMAGE_SIZE,
} from "@/lib/storage/r2";
import fs from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const formData = await req.formData();

    // Collect all files whether passed as "files", "file", or multiple entries
    const files: File[] = [];
    formData.forEach((value, key) => {
      if ((key === "file" || key === "files" || key.startsWith("file[")) && value instanceof File) {
        files.push(value);
      }
    });

    if (files.length === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Optional category parameter from form: "products" or "portfolio"
    const formCategory = formData.get("category")?.toString() || "products";
    const storageFolder = formCategory.includes("portfolio") ? "portfolio/photos" : "products";

    const useR2 = isR2Configured();
    const uploadedResults: {
      url: string;
      key: string | null;
      filename: string;
      size: number;
      mimeType: string;
      provider: string;
    }[] = [];

    // Fallback directory in case R2 is not configured
    const localUploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!useR2) {
      await fs.mkdir(localUploadsDir, { recursive: true });
    }

    for (const file of files) {
      // Validate MIME type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type.toLowerCase())) {
        return NextResponse.json(
          {
            error: `File "${file.name}" has invalid type (${file.type}). Allowed formats: JPG, PNG, WEBP, GIF.`,
          },
          { status: 400 }
        );
      }

      // Validate File size (5 MB for products)
      if (file.size > MAX_PRODUCT_IMAGE_SIZE) {
        return NextResponse.json(
          {
            error: `File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 5MB limit. Please upload a smaller image.`,
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (useR2) {
        // Upload to Cloudflare R2
        const objectKey = generateObjectKey(storageFolder, file.name);
        const { publicUrl } = await uploadBufferToR2({
          key: objectKey,
          buffer,
          contentType: file.type,
          metadata: {
            uploadedBy: admin.id,
            originalName: encodeURIComponent(file.name),
          },
        });

        // Record media asset metadata in database
        try {
          await prisma.mediaAsset.create({
            data: {
              provider: "CLOUDFLARE_R2",
              publicUrl,
              objectKey,
              originalName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              mediaType: "IMAGE",
            },
          });
        } catch (dbErr) {
          console.warn("Could not save MediaAsset metadata:", dbErr);
        }

        uploadedResults.push({
          url: publicUrl,
          key: objectKey,
          filename: file.name,
          size: file.size,
          mimeType: file.type,
          provider: "CLOUDFLARE_R2",
        });
      } else {
        // Fallback to local storage if R2 credentials are not set yet
        const ext = path.extname(file.name).toLowerCase() || ".jpg";
        const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
        const filename = `mv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${safeExt}`;

        const filePath = path.join(localUploadsDir, filename);
        await fs.writeFile(filePath, buffer);

        const publicUrl = `/uploads/${filename}`;
        uploadedResults.push({
          url: publicUrl,
          key: null,
          filename,
          size: file.size,
          mimeType: file.type,
          provider: "LOCAL",
        });
      }
    }

    return NextResponse.json({
      success: true,
      provider: useR2 ? "CLOUDFLARE_R2" : "LOCAL",
      url: uploadedResults[0].url,
      key: uploadedResults[0].key,
      urls: uploadedResults.map((r) => r.url),
      keys: uploadedResults.map((r) => r.key),
      files: uploadedResults,
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json(
      { error: "Failed to process image upload: " + error.message },
      { status: 500 }
    );
  }
}
