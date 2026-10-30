import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const services = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
    return NextResponse.json({ services });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, category, description, startingPricePaise, imageUrl, features } = body;

    if (!title) {
      return NextResponse.json({ error: "Service title is required" }, { status: 400 });
    }

    const baseSlug = slugify(title);
    let finalSlug = baseSlug;
    let count = 1;
    while (await prisma.service.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const service = await prisma.service.create({
      data: {
        title,
        slug: finalSlug,
        category: category || "Photography",
        description: description || "",
        startingPricePaise: startingPricePaise ? Number(startingPricePaise) : null,
        imageUrl: imageUrl || null,
        featuresJson: features ? (typeof features === "string" ? features : JSON.stringify(features)) : null,
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "CREATE_SERVICE",
        entityType: "Service",
        entityId: service.id,
        detailsJson: JSON.stringify({ title: service.title }),
      },
    });

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, title, category, description, startingPricePaise, imageUrl, features, isFeatured } =
      body;

    if (!id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(startingPricePaise !== undefined && {
          startingPricePaise: startingPricePaise ? Number(startingPricePaise) : null,
        }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(features !== undefined && {
          featuresJson: typeof features === "string" ? features : JSON.stringify(features),
        }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
      },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "UPDATE_SERVICE",
        entityType: "Service",
        entityId: id,
        detailsJson: JSON.stringify({ title: updated.title }),
      },
    });

    return NextResponse.json({ success: true, service: updated });
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

    await prisma.service.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "DELETE_SERVICE",
        entityType: "Service",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, message: "Service deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
