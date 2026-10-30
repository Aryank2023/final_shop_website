import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { deleteMediaFromR2 } from "@/lib/storage/r2";

export async function GET() {
  try {
    const portfolio = await prisma.portfolioProject.findMany({
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ portfolio });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      title,
      category,
      description,
      clientName,
      videoUrl,
      videoKey,
      images = [],
    } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const baseSlug = slugify(title);
    let finalSlug = baseSlug;
    let count = 1;
    while (await prisma.portfolioProject.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const formattedImages = images.map((item: any, idx: number) => {
      const url = typeof item === "string" ? item.trim() : (item?.url || "").trim();
      const key = typeof item === "object" && item.key ? String(item.key).trim() : null;
      return { url, key, sortOrder: idx };
    }).filter((img: any) => img.url.length > 0);

    const project = await prisma.portfolioProject.create({
      data: {
        title,
        slug: finalSlug,
        category: category || "Weddings",
        description,
        clientName,
        videoUrl: videoUrl || null,
        videoKey: videoKey || null,
        images: {
          create: formattedImages.map((img: any) => ({
            url: img.url,
            key: img.key || null,
            sortOrder: img.sortOrder,
          })),
        },
      },
      include: { images: true },
    });

    // Link MediaAsset records
    for (const img of formattedImages) {
      if (img.key) {
        await prisma.mediaAsset.updateMany({
          where: { objectKey: img.key },
          data: { portfolioId: project.id },
        }).catch(() => {});
      }
    }
    if (videoKey) {
      await prisma.mediaAsset.updateMany({
        where: { objectKey: videoKey },
        data: { portfolioId: project.id },
      }).catch(() => {});
    }

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "CREATE_PORTFOLIO",
        entityType: "PortfolioProject",
        entityId: project.id,
        detailsJson: JSON.stringify({ title: project.title }),
      },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      id,
      title,
      category,
      description,
      clientName,
      videoUrl,
      videoKey,
      images,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const existing = await prisma.portfolioProject.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const updated = await prisma.portfolioProject.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(clientName !== undefined && { clientName }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(videoKey !== undefined && { videoKey }),
      },
      include: { images: true },
    });

    let keysToCheckForCleanup: string[] = [];
    if (images && Array.isArray(images)) {
      const formattedImages = images.map((item: any, idx: number) => {
        const url = typeof item === "string" ? item.trim() : (item?.url || "").trim();
        const key = typeof item === "object" && item.key ? String(item.key).trim() : null;
        return { url, key, sortOrder: idx };
      }).filter((img: any) => img.url.length > 0);

      const newKeySet = new Set(formattedImages.map((v: any) => v.key).filter(Boolean));
      keysToCheckForCleanup = existing.images
        .map((img) => img.key)
        .filter((k): k is string => Boolean(k) && !newKeySet.has(k));

      await prisma.portfolioImage.deleteMany({ where: { projectId: id } });

      for (let i = 0; i < formattedImages.length; i++) {
        const img = formattedImages[i];
        await prisma.portfolioImage.create({
          data: {
            projectId: id,
            url: img.url,
            key: img.key || null,
            sortOrder: i,
          },
        });

        if (img.key) {
          await prisma.mediaAsset.updateMany({
            where: { objectKey: img.key },
            data: { portfolioId: id },
          }).catch(() => {});
        }
      }
    }

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "UPDATE_PORTFOLIO",
        entityType: "PortfolioProject",
        entityId: id,
        detailsJson: JSON.stringify({ title: updated.title }),
      },
    });

    const refreshed = await prisma.portfolioProject.findUnique({
      where: { id },
      include: { images: true },
    });

    // Safe Post-Commit Media Cleanup (Phase 9)
    for (const oldKey of keysToCheckForCleanup) {
      try {
        const otherRef = await prisma.portfolioImage.findFirst({ where: { key: oldKey } });
        const productRef = await prisma.productImage.findFirst({ where: { key: oldKey } });
        if (!otherRef && !productRef) {
          await deleteMediaFromR2(oldKey);
          await prisma.mediaAsset.deleteMany({ where: { objectKey: oldKey } }).catch(() => {});
        }
      } catch (cleanErr) {
        console.warn("Post-update portfolio media cleanup notice:", cleanErr);
      }
    }

    return NextResponse.json({ success: true, project: refreshed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const existing = await prisma.portfolioProject.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const candidateKeys = existing.images
      .map((img) => img.key)
      .filter((k): k is string => Boolean(k));
    if (existing.videoKey) {
      candidateKeys.push(existing.videoKey);
    }

    // Delete from database first
    await prisma.portfolioProject.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "DELETE_PORTFOLIO",
        entityType: "PortfolioProject",
        entityId: id,
      },
    });

    // Safe Post-Commit R2 Deletion (Phase 9)
    for (const key of candidateKeys) {
      try {
        const stillInUse = await prisma.portfolioImage.findFirst({ where: { key } });
        const inProduct = await prisma.productImage.findFirst({ where: { key } });
        const inVideo = await prisma.portfolioProject.findFirst({ where: { videoKey: key } });
        if (!stillInUse && !inProduct && !inVideo) {
          await deleteMediaFromR2(key);
          await prisma.mediaAsset.deleteMany({ where: { objectKey: key } }).catch(() => {});
        }
      } catch (cleanErr) {
        console.warn("Post-delete portfolio media cleanup notice:", cleanErr);
      }
    }

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
