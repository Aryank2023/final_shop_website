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
    await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(details !== undefined && { details: details ? details.trim() : null }),
        ...(pricePaise !== undefined && { pricePaise: Number(pricePaise) }),
        ...(mrpPaise !== undefined && { mrpPaise: mrpPaise ? Number(mrpPaise) : null }),
        ...(discountPercent !== undefined && { discountPercent: Number(discountPercent) }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isAvailable !== undefined && { isAvailable: Boolean(isAvailable) }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
      },
    });

    // If images array provided, replace images cleanly
    if (images && Array.isArray(images)) {
      const validImages = images
        .map((img: any, idx: number) => {
          const url = typeof img === "string" ? img.trim() : (img?.url || "").trim();
          const isPrimary = typeof img === "object" && typeof img.isPrimary === "boolean" ? img.isPrimary : false;
          const sortOrder = typeof img === "object" && typeof img.sortOrder === "number" ? img.sortOrder : idx;
          return { url, isPrimary, sortOrder };
        })
        .filter((img) => img.url.length > 0);

      // Ensure at least one image is primary if images exist
      if (validImages.length > 0 && !validImages.some((i) => i.isPrimary)) {
        validImages[0].isPrimary = true;
      }

      await prisma.productImage.deleteMany({ where: { productId: id } });

      for (let i = 0; i < validImages.length; i++) {
        const item = validImages[i];
        await prisma.productImage.create({
          data: {
            productId: id,
            url: item.url,
            isPrimary: item.isPrimary,
            sortOrder: i,
          },
        });
      }
    }

    // If variants provided
    if (variants && Array.isArray(variants)) {
      await prisma.productVariant.deleteMany({ where: { productId: id } });
      for (const v of variants) {
        if (v.name && v.name.trim()) {
          await prisma.productVariant.create({
            data: {
              productId: id,
              name: v.name.trim(),
              sku: v.sku ? v.sku.trim() : null,
              priceDeltaPaise: Number(v.priceDeltaPaise || 0),
            },
          });
        }
      }
    }

    // Audit log
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "UPDATE_PRODUCT",
        entityType: "Product",
        entityId: id,
        detailsJson: JSON.stringify({ name, pricePaise }),
      },
    });

    const refreshed = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
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
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });

    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "DELETE_PRODUCT",
        entityType: "Product",
        entityId: id,
        detailsJson: JSON.stringify({ name: existing.name }),
      },
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Delete Product Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
