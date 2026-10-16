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

    if (!name || !pricePaise || !categoryId) {
      return NextResponse.json({ error: "Name, price and category are required" }, { status: 400 });
    }

    const baseSlug = customSlug ? slugify(customSlug) : slugify(name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        description: description || "",
        details: details || null,
        pricePaise: Number(pricePaise),
        mrpPaise: mrpPaise ? Number(mrpPaise) : null,
        discountPercent: discountPercent ? Number(discountPercent) : 0,
        categoryId,
        isAvailable: Boolean(isAvailable),
        isFeatured: Boolean(isFeatured),
        isPublished: Boolean(isPublished),
        images: {
          create: images.map((img: any, idx: number) => ({
            url: typeof img === "string" ? img : img.url,
            isPrimary: idx === 0,
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
      include: { category: true, images: true, variants: true },
    });

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
