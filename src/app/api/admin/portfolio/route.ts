import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithRole } from "@/lib/auth";
import { deleteFileFromImageKit, isImageKitConfigured, IMAGEKIT_FILE_ID_REGEX } from "@/lib/storage/imagekit";
import {
  getClientIp,
  readBoundedJson,
  verifyCsrfOrigin,
  validateMediaUrl,
  validateVideoEmbedUrl,
} from "@/lib/security";

export async function GET() {
  try {
    const { admin, error, status } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status });

    const galleryItems = await prisma.gallery.findMany({
      orderBy: { createdAt: "desc" },
    });

    const portfolio = galleryItems.map((g) => ({
      id: g.id,
      title: g.title,
      category: g.category,
      description: g.altText,
      clientName: g.clientName || null,
      videoUrl: g.videoUrl || null,
      fileId: g.fileId || null,
      images: [{ id: g.id, url: g.imageUrl, fileId: g.fileId || null }],
      createdAt: g.createdAt.toISOString(),
      featured: g.featured,
      status: g.status,
    }));

    return NextResponse.json({ portfolio });
  } catch (error: any) {
    console.error("Get Portfolio Error:", error);
    return NextResponse.json({ error: "Failed to retrieve portfolio" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status });

    const bodyResult = await readBoundedJson(req, 16384);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const body = bodyResult.data;
    const {
      title,
      category = "Weddings",
      description,
      clientName,
      videoUrl,
      imageUrl,
      fileId,
      images = [],
      status: itemStatus = "PUBLISHED",
      featured,
    } = body;

    if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
      return NextResponse.json({ error: "Title is required and must be between 1 and 200 characters" }, { status: 400 });
    }

    if (category !== undefined && (typeof category !== "string" || category.trim().length > 50)) {
      return NextResponse.json({ error: "Category must be a string up to 50 characters" }, { status: 400 });
    }

    if (clientName !== undefined && clientName !== null && typeof clientName !== "string") {
      return NextResponse.json({ error: "Client name must be a string" }, { status: 400 });
    }

    // Reject string booleans
    if (featured !== undefined && typeof featured !== "boolean") {
      return NextResponse.json({ error: "featured field must be a boolean" }, { status: 400 });
    }

    const validStatuses = ["PUBLISHED", "DRAFT", "HIDDEN"];
    if (itemStatus !== undefined && !validStatuses.includes(itemStatus)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    let finalImageUrl = "";
    let finalFileId: string | null = null;

    if (typeof imageUrl === "string" && imageUrl.trim()) {
      if (!validateMediaUrl(imageUrl)) {
        return NextResponse.json({ error: "Invalid or untrusted image URL provided" }, { status: 400 });
      }
      finalImageUrl = imageUrl.trim();
    } else if (Array.isArray(images) && images.length > 0) {
      const first = images[0];
      const candidateUrl = typeof first === "string" ? first : (first?.url || "");
      if (candidateUrl) {
        if (!validateMediaUrl(candidateUrl)) {
          return NextResponse.json({ error: "Invalid or untrusted image URL provided" }, { status: 400 });
        }
        finalImageUrl = candidateUrl.trim();
      }
      if (typeof first === "object" && (first?.fileId || first?.key)) {
        const rawFid = String(first.fileId || first.key).trim();
        if (IMAGEKIT_FILE_ID_REGEX.test(rawFid)) {
          finalFileId = rawFid;
        }
      }
    }

    if (fileId && typeof fileId === "string" && IMAGEKIT_FILE_ID_REGEX.test(fileId.trim())) {
      finalFileId = fileId.trim();
    }

    let validatedVideoUrl: string | null = null;
    if (videoUrl && typeof videoUrl === "string" && videoUrl.trim()) {
      if (!validateVideoEmbedUrl(videoUrl)) {
        return NextResponse.json({ error: "Invalid or untrusted video embed URL. Only YouTube, Vimeo, or ImageKit URLs are permitted." }, { status: 400 });
      }
      validatedVideoUrl = videoUrl.trim();
    }

    if (!finalImageUrl && !validatedVideoUrl) {
      finalImageUrl = "/logo.png";
    }

    const item = await prisma.gallery.create({
      data: {
        title: title.trim(),
        category: (category || "Weddings").trim(),
        altText: typeof description === "string" ? description.trim().slice(0, 500) : title.trim(),
        clientName: clientName ? String(clientName).trim().slice(0, 100) : null,
        videoUrl: validatedVideoUrl,
        fileId: finalFileId,
        imageUrl: finalImageUrl || "/logo.png",
        featured: Boolean(featured),
        status: itemStatus || "PUBLISHED",
      },
    });

    try {
      const ip = getClientIp(req);
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "CREATE_GALLERY",
          entity: "Gallery",
          entityId: item.id,
          ipAddress: ip,
          metadata: { title: item.title, category: item.category },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json(
      {
        success: true,
        project: {
          id: item.id,
          title: item.title,
          category: item.category,
          description: item.altText,
          clientName: item.clientName,
          videoUrl: item.videoUrl,
          fileId: item.fileId,
          images: [{ id: item.id, url: item.imageUrl, fileId: item.fileId }],
          createdAt: item.createdAt.toISOString(),
          featured: item.featured,
          status: item.status,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create Portfolio Error:", error);
    return NextResponse.json({ error: "Failed to create portfolio item" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status });

    const bodyResult = await readBoundedJson(req, 16384);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const body = bodyResult.data;
    const {
      id,
      title,
      category,
      description,
      clientName,
      videoUrl,
      imageUrl,
      fileId,
      images,
      status: itemStatus,
      featured,
    } = body;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
        return NextResponse.json({ error: "Title must be between 1 and 200 characters" }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (category !== undefined) {
      if (typeof category !== "string" || category.trim().length > 50) {
        return NextResponse.json({ error: "Category must be a string up to 50 characters" }, { status: 400 });
      }
      updateData.category = category.trim();
    }

    if (description !== undefined) {
      updateData.altText = typeof description === "string" ? description.trim().slice(0, 500) : "";
    }

    if (clientName !== undefined) {
      updateData.clientName = clientName ? String(clientName).trim().slice(0, 100) : null;
    }

    if (videoUrl !== undefined) {
      if (videoUrl && typeof videoUrl === "string" && videoUrl.trim()) {
        if (!validateVideoEmbedUrl(videoUrl)) {
          return NextResponse.json({ error: "Invalid video embed URL" }, { status: 400 });
        }
        updateData.videoUrl = videoUrl.trim();
      } else {
        updateData.videoUrl = null;
      }
    }

    if (imageUrl !== undefined && typeof imageUrl === "string" && imageUrl.trim()) {
      if (!validateMediaUrl(imageUrl)) {
        return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
      }
      updateData.imageUrl = imageUrl.trim();
    }

    if (fileId !== undefined) {
      if (fileId && typeof fileId === "string" && IMAGEKIT_FILE_ID_REGEX.test(fileId.trim())) {
        updateData.fileId = fileId.trim();
      } else {
        updateData.fileId = null;
      }
    }

    if (featured !== undefined) {
      if (typeof featured !== "boolean") {
        return NextResponse.json({ error: "featured field must be a boolean" }, { status: 400 });
      }
      updateData.featured = featured;
    }

    if (itemStatus !== undefined) {
      const validStatuses = ["PUBLISHED", "DRAFT", "HIDDEN"];
      if (!validStatuses.includes(itemStatus)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      updateData.status = itemStatus;
    }

    const updated = await prisma.gallery.update({
      where: { id },
      data: updateData,
    });

    try {
      const ip = getClientIp(req);
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "UPDATE_GALLERY",
          entity: "Gallery",
          entityId: id,
          ipAddress: ip,
          metadata: { title: updated.title },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json({
      success: true,
      project: {
        id: updated.id,
        title: updated.title,
        category: updated.category,
        description: updated.altText,
        clientName: updated.clientName,
        videoUrl: updated.videoUrl,
        fileId: updated.fileId,
        images: [{ id: updated.id, url: updated.imageUrl, fileId: updated.fileId }],
        createdAt: updated.createdAt.toISOString(),
        featured: updated.featured,
        status: updated.status,
      },
    });
  } catch (error: any) {
    console.error("Update Portfolio Error:", error);
    return NextResponse.json({ error: "Failed to update portfolio item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const existing = await prisma.gallery.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Gallery item not found" }, { status: 404 });
    }

    await prisma.gallery.delete({ where: { id } });

    // Multi-table reference check to ensure deletion cannot remove shared media assets still referenced elsewhere
    if (existing.fileId && isImageKitConfigured()) {
      const [productRef, otherGalleryRef, cyberRef, photoRef, slideRef] = await Promise.all([
        prisma.product.findFirst({ where: { images: { has: existing.imageUrl } } }),
        prisma.gallery.findFirst({
          where: {
            id: { not: existing.id },
            OR: [
              { imageUrl: existing.imageUrl },
              ...(existing.fileId ? [{ fileId: existing.fileId }] : []),
            ],
          },
        }),
        prisma.cyberCafeService.findFirst({ where: { icon: existing.imageUrl } }),
        prisma.photographyService.findFirst({ where: { heroImage: existing.imageUrl } }),
        prisma.homepageSlide.findFirst({ where: { imageUrl: existing.imageUrl } }),
      ]);

      const isReferencedElsewhere = Boolean(
        productRef || otherGalleryRef || cyberRef || photoRef || slideRef
      );

      if (!isReferencedElsewhere) {
        deleteFileFromImageKit(existing.fileId).catch((e) =>
          console.warn("Notice: background ImageKit cleanup error:", e.message)
        );
      }
    }

    try {
      const ip = getClientIp(req);
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "DELETE_GALLERY",
          entity: "Gallery",
          entityId: id,
          ipAddress: ip,
          metadata: { title: existing.title },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json({ success: true, message: "Gallery item deleted" });
  } catch (error: any) {
    console.error("Delete Portfolio Error:", error);
    return NextResponse.json({ error: "Failed to delete portfolio item" }, { status: 500 });
  }
}
