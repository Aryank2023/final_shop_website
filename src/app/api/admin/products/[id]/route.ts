import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const {
      name,
      description,
      details,
      pricePaise,
      mrpPaise,
      discountPercent,
      categoryId,
      isAvailable,
      isFeatured,
      isPublished,
      images,
      variants,
    } = body;

    // Update product core fields
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(details !== undefined && { details }),
        ...(pricePaise !== undefined && { pricePaise: Number(pricePaise) }),
        ...(mrpPaise !== undefined && { mrpPaise: mrpPaise ? Number(mrpPaise) : null }),
        ...(discountPercent !== undefined && { discountPercent: Number(discountPercent) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
      },
      include: { category: true, images: true, variants: true },
    });

    // If new images provided
    if (images && Array.isArray(images)) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await prisma.productImage.create({
          data: {
            productId: id,
            url: typeof img === "string" ? img : img.url,
            isPrimary: i === 0,
            sortOrder: i,
          },
        });
      }
    }

    // If variants provided
    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      for (const v of variants) {
        await prisma.productVariant.create({
          data: {
            productId: id,
            name: v.name,
            sku: v.sku || null,
            priceDeltaPaise: Number(v.priceDeltaPaise || 0),
          },
        });
      }
    }

    // Audit log
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "UPDATE_PRODUCT",
        entityType: "Product",
        entityId: id,
      },
    });

    const refreshed = await prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true, variants: true },
    });

    return NextResponse.json({ success: true, product: refreshed });
  } catch (error: any) {
    console.error("Update Product Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;
    await prisma.product.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "DELETE_PRODUCT",
        entityType: "Product",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
