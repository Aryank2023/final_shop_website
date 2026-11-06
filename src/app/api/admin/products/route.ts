import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminWithRole } from "@/lib/auth";
import { slugify } from "@/lib/utils";
import { readBoundedJson, verifyCsrfOrigin, validateMediaUrl } from "@/lib/security";

function normalizeProduct(p: any) {
  const priceNum = Number(p.price);
  const mrpNum = p.mrp != null && p.mrp !== "" ? Number(p.mrp) : null;
  const savedDiscount = p.discountPercent != null ? Number(p.discountPercent) : 0;
  const calculatedDiscount = mrpNum && mrpNum > priceNum
    ? Math.round(((mrpNum - priceNum) / mrpNum) * 100)
    : 0;
  const discount = savedDiscount > 0 ? savedDiscount : calculatedDiscount;

  const pricePaise = Math.round(priceNum * 100);
  const mrpPaise = mrpNum != null ? Math.round(mrpNum * 100) : null;
  const isAvailable = p.available ?? true;
  const isPublished = p.status === "PUBLISHED";

  return {
    ...p,
    price: priceNum,
    pricePaise,
    mrp: mrpNum,
    mrpPaise,
    discountPercent: discount,
    available: isAvailable,
    isAvailable,
    status: p.status || (isPublished ? "PUBLISHED" : "DRAFT"),
    isPublished,
    stock: Number(p.stock ?? 0),
  };
}

export async function GET() {
  try {
    const { admin, error, status } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status });

    const rawProducts = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const products = rawProducts.map(normalizeProduct);

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error("Get Products Error:", error);
    return NextResponse.json({ error: "Failed to retrieve products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const bodyResult = await readBoundedJson(req, 65536);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const body = bodyResult.data;
    const {
      name,
      slug: customSlug,
      description = "",
      price,
      pricePaise,
      mrp,
      mrpPaise,
      discountPercent,
      categoryId,
      stock = 100,
      available,
      featured,
      status = "PUBLISHED",
      images = [],
    } = body;

    // Validate name
    if (typeof name !== "string" || !name.trim() || name.trim().length > 200) {
      return NextResponse.json(
        { error: "Product name is required and must be between 1 and 200 characters" },
        { status: 400 }
      );
    }

    // Validate price
    const rawPrice = price !== undefined ? price : (pricePaise !== undefined ? Number(pricePaise) / 100 : undefined);
    if (rawPrice === undefined || typeof rawPrice !== "number" || !isFinite(rawPrice) || isNaN(rawPrice) || rawPrice <= 0 || rawPrice > 10000000) {
      return NextResponse.json(
        { error: "Selling price must be a valid positive number" },
        { status: 400 }
      );
    }
    const finalPrice = Math.round(rawPrice * 100) / 100;

    // Validate MRP
    let finalMrp: number | null = null;
    const rawMrp = mrp !== undefined && mrp !== null && mrp !== ""
      ? mrp
      : (mrpPaise !== undefined && mrpPaise !== null && mrpPaise !== "" ? Number(mrpPaise) / 100 : null);

    if (rawMrp !== null) {
      if (typeof rawMrp !== "number" || !isFinite(rawMrp) || isNaN(rawMrp) || rawMrp <= 0 || rawMrp > 10000000) {
        return NextResponse.json({ error: "MRP must be a valid positive number" }, { status: 400 });
      }
      finalMrp = Math.round(rawMrp * 100) / 100;
      if (finalMrp < finalPrice) {
        return NextResponse.json(
          { error: "MRP cannot be less than selling price." },
          { status: 400 }
        );
      }
    }

    // Validate discount percentage
    let computedDiscount = 0;
    if (discountPercent !== undefined && discountPercent !== null && discountPercent !== "") {
      if (typeof discountPercent !== "number" || !Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 99) {
        return NextResponse.json({ error: "Discount percentage must be an integer between 0 and 99" }, { status: 400 });
      }
      computedDiscount = discountPercent;
    } else if (finalMrp !== null && finalMrp > finalPrice) {
      computedDiscount = Math.round(((finalMrp - finalPrice) / finalMrp) * 100);
    }

    // Validate categoryId and ensure referenced record exists in DB
    if (typeof categoryId !== "string" || !categoryId.trim()) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }
    const categoryExists = await prisma.productCategory.findUnique({ where: { id: categoryId.trim() } });
    if (!categoryExists) {
      return NextResponse.json({ error: "Referenced category not found" }, { status: 400 });
    }

    // Validate stock (reject negative stock, NaN, non-integer)
    if (stock !== undefined && (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0 || stock > 1000000)) {
      return NextResponse.json({ error: "Stock must be a non-negative integer" }, { status: 400 });
    }

    // Reject string booleans ("true"/"false")
    if (available !== undefined && typeof available !== "boolean") {
      return NextResponse.json({ error: "available field must be a boolean" }, { status: 400 });
    }
    if (featured !== undefined && typeof featured !== "boolean") {
      return NextResponse.json({ error: "featured field must be a boolean" }, { status: 400 });
    }

    // Validate status enum
    const validStatuses = ["PUBLISHED", "DRAFT", "HIDDEN"];
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Validate images array and URLs against media URL policy
    if (!Array.isArray(images)) {
      return NextResponse.json({ error: "Images must be an array of URLs" }, { status: 400 });
    }
    const sanitizedImages: string[] = [];
    for (const img of images) {
      const urlStr = typeof img === "string" ? img : (typeof img === "object" && img?.url ? String(img.url) : "");
      if (urlStr) {
        if (!validateMediaUrl(urlStr)) {
          return NextResponse.json({ error: "Invalid or untrusted image URL provided" }, { status: 400 });
        }
        sanitizedImages.push(urlStr.trim());
      }
    }

    const baseSlug = customSlug && typeof customSlug === "string" ? slugify(customSlug) : slugify(name);
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        slug: finalSlug,
        description: typeof description === "string" ? description.trim().slice(0, 5000) : "",
        price: finalPrice,
        mrp: finalMrp,
        discountPercent: computedDiscount,
        categoryId: categoryId.trim(),
        stock: stock !== undefined ? stock : 100,
        available: available !== undefined ? available : true,
        featured: featured !== undefined ? featured : false,
        status: (status as any) || "PUBLISHED",
        images: sanitizedImages,
      },
      include: {
        category: true,
      },
    });

    try {
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "CREATE_PRODUCT",
          entity: "Product",
          entityId: product.id,
          metadata: { name: product.name, price: Number(product.price), mrp: finalMrp },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    try {
      revalidatePath("/");
      revalidatePath("/products");
    } catch {}

    return NextResponse.json({ success: true, product: normalizeProduct(product) }, { status: 201 });
  } catch (error: any) {
    console.error("Create Product Error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
