import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

// Allowed mime types & max file size
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const formData = await req.formData();

    // Collect all files whether passed as "files", "file", or multiple entries
    const files: File[] = [];
    for (const [key, value] of formData.entries()) {
      if ((key === "file" || key === "files" || key.startsWith("file[")) && value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    const uploadedResults: { url: string; filename: string; size: number }[] = [];

    for (const file of files) {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          {
            error: `File "${file.name}" has invalid type (${file.type}). Allowed formats: JPG, PNG, WEBP, GIF.`,
          },
          { status: 400 }
        );
      }

      // Validate File size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File "${file.name}" (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 5MB limit. Please upload a smaller image.`,
          },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Clean safe extension
      const ext = path.extname(file.name).toLowerCase() || ".jpg";
      const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
      const filename = `mv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${safeExt}`;

      const filePath = path.join(uploadsDir, filename);
      await fs.writeFile(filePath, buffer);

      const publicUrl = `/uploads/${filename}`;
      uploadedResults.push({
        url: publicUrl,
        filename,
        size: file.size,
      });
    }

    return NextResponse.json({
      success: true,
      url: uploadedResults[0].url,
      urls: uploadedResults.map((r) => r.url),
      files: uploadedResults,
    });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to process image upload: " + error.message }, { status: 500 });
  }
}
