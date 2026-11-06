import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminWithRole } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { readBoundedJson, verifyCsrfOrigin } from "@/lib/security";

export async function GET() {
  try {
    const { admin, error, status } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status });

    const categories = await prisma.productCategory.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error("Get Categories Error:", error);
    return NextResponse.json({ error: "Failed to retrieve categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const bodyResult = await readBoundedJson(req, 4096);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const { name, description, status = "PUBLISHED" } = bodyResult.data;
    if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
      return NextResponse.json(
        { error: "Category name is required and must be between 1 and 100 characters" },
        { status: 400 }
      );
    }

    if (description !== undefined && description !== null && typeof description !== "string") {
      return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
    }

    const validStatuses = ["PUBLISHED", "DRAFT", "HIDDEN"];
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const baseSlug = slugify(name);
    let finalSlug = baseSlug;
    let count = 1;
    while (await prisma.productCategory.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count++}`;
    }

    const category = await prisma.productCategory.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: description?.trim() ? description.trim().slice(0, 500) : null,
        status: status || "PUBLISHED",
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "CREATE_CATEGORY",
          entity: "ProductCategory",
          entityId: category.id,
          metadata: { name: category.name },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error: any) {
    console.error("Create Category Error:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const bodyResult = await readBoundedJson(req, 4096);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const { id, name, description, status } = bodyResult.data;
    if (typeof id !== "string" || !id.trim()) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim() || name.trim().length > 100)) {
      return NextResponse.json(
        { error: "Category name must be between 1 and 100 characters" },
        { status: 400 }
      );
    }

    if (description !== undefined && description !== null && typeof description !== "string") {
      return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
    }

    const validStatuses = ["PUBLISHED", "DRAFT", "HIDDEN"];
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const existing = await prisma.productCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await prisma.productCategory.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        description: description !== undefined ? (description?.trim() ? description.trim().slice(0, 500) : null) : undefined,
        status: status || undefined,
      },
      include: { _count: { select: { products: true } } },
    });

    try {
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "UPDATE_CATEGORY",
          entity: "ProductCategory",
          entityId: id,
          metadata: { name: updated.name },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    console.error("Update Category Error:", error);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Category ID required" }, { status: 400 });
    }

    const productsCount = await prisma.product.count({ where: { categoryId: id } });
    if (productsCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete category: ${productsCount} product(s) are assigned to it. Reassign or delete the products first.`,
        },
        { status: 400 }
      );
    }

    await prisma.productCategory.delete({ where: { id } });

    try {
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "DELETE_CATEGORY",
          entity: "ProductCategory",
          entityId: id,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error: any) {
    console.error("Delete Category Error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
