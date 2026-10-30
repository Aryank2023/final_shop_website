import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { deleteMediaFromR2 } from "@/lib/storage/r2";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { images: true },
    });
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

    // If images array provided, update images cleanly preserving R2 keys
    let keysToCheckForCleanup: string[] = [];
    if (images && Array.isArray(images)) {
      const validImages = images
        .map((img: any, idx: number) => {
          const url = typeof img === "string" ? img.trim() : (img?.url || "").trim();
          const key = typeof img === "object" && img.key ? String(img.key).trim() : null;
          const isPrimary = typeof img === "object" && typeof img.isPrimary === "boolean" ? img.isPrimary : false;
          const sortOrder = typeof img === "object" && typeof img.sortOrder === "number" ? img.sortOrder : idx;
          return { url, key, isPrimary, sortOrder };
        })
        .filter((img) => img.url.length > 0);

      // Ensure at least one image is primary if images exist
      if (validImages.length > 0 && !validImages.some((i) => i.isPrimary)) {
        validImages[0].isPrimary = true;
      }

      // Collect previously assigned keys that might be orphaned
      const newKeySet = new Set(validImages.map((v) => v.key).filter(Boolean));
      keysToCheckForCleanup = existing.images
        .map((img) => img.key)
        .filter((k): k is string => Boolean(k) && !newKeySet.has(k));

      await prisma.productImage.deleteMany({ where: { productId: id } });

      for (let i = 0; i < validImages.length; i++) {
        const item = validImages[i];
        await prisma.productImage.create({
          data: {
            productId: id,
            url: item.url,
            key: item.key || null,
            isPrimary: item.isPrimary,
            sortOrder: i,
          },
        });

        if (item.key) {
          await prisma.mediaAsset.updateMany({
            where: { objectKey: item.key },
            data: { productId: id },
          }).catch(() => {});
        }
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

    // Safe Post-Commit Media Cleanup (Phase 9)
    // Only check and delete if the key is no longer referenced anywhere in database
    for (const oldKey of keysToCheckForCleanup) {
      try {
        const otherRef = await prisma.productImage.findFirst({
          where: { key: oldKey },
        });
        const portfolioRef = await prisma.portfolioImage.findFirst({
          where: { key: oldKey },
        });
        if (!otherRef && !portfolioRef) {
          await deleteMediaFromR2(oldKey);
          await prisma.mediaAsset.deleteMany({ where: { objectKey: oldKey } }).catch(() => {});
        }
      } catch (cleanErr) {
        console.warn("Post-update media cleanup notice:", cleanErr);
      }
    }

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

    const candidateKeys = existing.images
      .map((img) => img.key)
      .filter((k): k is string => Boolean(k));

    // Delete product from database first (cascades images and variants)
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

    // Safe Post-Commit R2 Deletion (Phase 9)
    // Verify each key is not referenced elsewhere before deleting from R2
    for (const key of candidateKeys) {
      try {
        const stillInUse = await prisma.productImage.findFirst({ where: { key } });
        const inPortfolio = await prisma.portfolioImage.findFirst({ where: { key } });
        if (!stillInUse && !inPortfolio) {
          await deleteMediaFromR2(key);
          await prisma.mediaAsset.deleteMany({ where: { objectKey: key } }).catch(() => {});
        }
      } catch (cleanErr) {
        console.warn("Post-delete media cleanup notice:", cleanErr);
      }
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Delete Product Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
