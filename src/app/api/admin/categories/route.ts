import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, description } = await req.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Category name is required" }, { status: 400 });
    }

    const baseSlug = slugify(name);
    let finalSlug = baseSlug;
    let count = 1;
    while (await prisma.category.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const category = await prisma.category.create({
      data: { name: name.trim(), slug: finalSlug, description: description?.trim() || null },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "CREATE_CATEGORY",
        entityType: "Category",
        entityId: category.id,
        detailsJson: JSON.stringify({ name: category.name }),
      },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, name, description } = await req.json();
    if (!id || !name || !name.trim()) {
      return NextResponse.json({ error: "Category ID and name are required" }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description !== undefined ? description?.trim() || null : undefined,
      },
      include: { _count: { select: { products: true } } },
    });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "UPDATE_CATEGORY",
        entityType: "Category",
        entityId: id,
        detailsJson: JSON.stringify({ name: updated.name }),
      },
    });

    return NextResponse.json({ success: true, category: updated });
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
    if (!id) return NextResponse.json({ error: "Category ID required" }, { status: 400 });

    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category: ${productsCount} product(s) are assigned to it. Reassign or delete the products first.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "DELETE_CATEGORY",
        entityType: "Category",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
