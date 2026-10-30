import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

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
    const { title, category, description, clientName, videoUrl, images = [] } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const baseSlug = slugify(title);
    let finalSlug = baseSlug;
    let count = 1;
    while (await prisma.portfolioProject.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const project = await prisma.portfolioProject.create({
      data: {
        title,
        slug: finalSlug,
        category: category || "Weddings",
        description,
        clientName,
        videoUrl,
        images: {
          create: images.map((url: string, idx: number) => ({
            url: typeof url === "string" ? url : (url as any).url,
            sortOrder: idx,
          })),
        },
      },
      include: { images: true },
    });

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
    const { id, title, category, description, clientName, videoUrl, images } = body;

    if (!id) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const existing = await prisma.portfolioProject.findUnique({ where: { id } });
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
      },
      include: { images: true },
    });

    if (images && Array.isArray(images)) {
      await prisma.portfolioImage.deleteMany({ where: { projectId: id } });
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await prisma.portfolioImage.create({
          data: {
            projectId: id,
            url: typeof img === "string" ? img : img.url,
            sortOrder: i,
          },
        });
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

    await prisma.portfolioProject.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "DELETE_PORTFOLIO",
        entityType: "PortfolioProject",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, message: "Project deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
