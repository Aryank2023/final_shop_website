import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const products = await prisma.product.findMany({
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
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
      name,
      slug: customSlug,
      description,
      details,
      pricePaise,
      mrpPaise,
      discountPercent,
      categoryId,
      isAvailable = true,
      isFeatured = false,
      isPublished = true,
      images = [],
      variants = [],
    } = body;

    if (!name || pricePaise === undefined || !categoryId) {
      return NextResponse.json(
        { error: "Product name, selling price, and category are required" },
        { status: 400 }
      );
    }

    const baseSlug = customSlug ? slugify(customSlug) : slugify(name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    // Process and sanitize images, preserving Cloudflare R2 object keys
    const rawImagesList = Array.isArray(images) ? images : [];
    const validImages = rawImagesList
      .map((img: any, idx: number) => {
        const url = typeof img === "string" ? img.trim() : (img?.url || "").trim();
        const key = typeof img === "object" && img.key ? String(img.key).trim() : null;
        const isPrimary = typeof img === "object" && typeof img.isPrimary === "boolean" ? img.isPrimary : false;
        const sortOrder = typeof img === "object" && typeof img.sortOrder === "number" ? img.sortOrder : idx;
        return { url, key, isPrimary, sortOrder };
      })
      .filter((img) => img.url.length > 0);

    // Ensure exactly one primary image exists if images are provided
    if (validImages.length > 0) {
      const hasPrimary = validImages.some((img) => img.isPrimary);
      if (!hasPrimary) {
        validImages[0].isPrimary = true;
      }
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: (description || "").trim(),
        details: details ? details.trim() : null,
        pricePaise: Number(pricePaise),
        mrpPaise: mrpPaise ? Number(mrpPaise) : null,
        discountPercent: discountPercent ? Number(discountPercent) : 0,
        categoryId,
        isAvailable: Boolean(isAvailable),
        isFeatured: Boolean(isFeatured),
        isPublished: Boolean(isPublished),
        images: {
          create: validImages.map((img, idx) => ({
            url: img.url,
            key: img.key || null,
            isPrimary: img.isPrimary,
            sortOrder: idx,
          })),
        },
        variants: {
          create: variants.map((v: any) => ({
            name: v.name,
            sku: v.sku || null,
            priceDeltaPaise: Number(v.priceDeltaPaise || 0),
          })),
        },
      },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
    });

    // Link uploaded MediaAsset records to this product
    for (const img of validImages) {
      if (img.key) {
        await prisma.mediaAsset.updateMany({
          where: { objectKey: img.key },
          data: { productId: product.id },
        }).catch(() => {});
      }
    }

    // Audit log
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: admin.id,
        action: "CREATE_PRODUCT",
        entityType: "Product",
        entityId: product.id,
        detailsJson: JSON.stringify({ name: product.name, price: product.pricePaise }),
      },
    });

    return NextResponse.json({ success: true, product }, { status: 201 });
  } catch (error: any) {
    console.error("Create Product Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
