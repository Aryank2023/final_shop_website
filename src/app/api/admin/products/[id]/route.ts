import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminWithRole } from "@/lib/auth";
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const bodyResult = await readBoundedJson(req, 65536);
    if (!bodyResult.ok) {
      return NextResponse.json({ error: bodyResult.error }, { status: bodyResult.status });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
    });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const body = bodyResult.data;
    const {
      name,
      description,
      price,
      pricePaise,
      mrp,
      mrpPaise,
      discountPercent,
      categoryId,
      stock,
      available,
      featured,
      status,
      images,
    } = body;

    const dataToUpdate: any = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim() || name.trim().length > 200) {
        return NextResponse.json({ error: "Product name must be between 1 and 200 characters" }, { status: 400 });
      }
      dataToUpdate.name = name.trim();
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return NextResponse.json({ error: "Description must be a string" }, { status: 400 });
      }
      dataToUpdate.description = description.trim().slice(0, 5000);
    }

    let newPrice: number | undefined;
    if (price !== undefined) {
      if (typeof price !== "number" || !isFinite(price) || isNaN(price) || price <= 0 || price > 10000000) {
        return NextResponse.json({ error: "Selling price must be a valid positive number" }, { status: 400 });
      }
      newPrice = Math.round(price * 100) / 100;
    } else if (pricePaise !== undefined) {
      const p = Number(pricePaise) / 100;
      if (typeof pricePaise !== "number" || !isFinite(p) || isNaN(p) || p <= 0 || p > 10000000) {
        return NextResponse.json({ error: "Selling price must be a valid positive number" }, { status: 400 });
      }
      newPrice = Math.round(p * 100) / 100;
    }

    if (newPrice !== undefined) {
      dataToUpdate.price = newPrice;
    }

    const effectivePrice = newPrice !== undefined ? newPrice : Number(existing.price);

    // Handle MRP updates
    if (mrp !== undefined || mrpPaise !== undefined) {
      let finalMrp: number | null = null;
      const rawMrp = mrp !== undefined && mrp !== null && mrp !== ""
        ? mrp
        : (mrpPaise !== undefined && mrpPaise !== null && mrpPaise !== "" ? Number(mrpPaise) / 100 : null);

      if (rawMrp !== null) {
        if (typeof rawMrp !== "number" || !isFinite(rawMrp) || isNaN(rawMrp) || rawMrp <= 0 || rawMrp > 10000000) {
          return NextResponse.json({ error: "MRP must be a valid positive number" }, { status: 400 });
        }
        finalMrp = Math.round(rawMrp * 100) / 100;
        if (finalMrp < effectivePrice) {
          return NextResponse.json({ error: "MRP cannot be less than selling price." }, { status: 400 });
        }
      }
      dataToUpdate.mrp = finalMrp;
    }

    // Handle Discount Percentage
    if (discountPercent !== undefined) {
      if (discountPercent === null || discountPercent === "") {
        dataToUpdate.discountPercent = 0;
      } else {
        if (typeof discountPercent !== "number" || !Number.isInteger(discountPercent) || discountPercent < 0 || discountPercent > 99) {
          return NextResponse.json({ error: "Discount percentage must be an integer between 0 and 99" }, { status: 400 });
        }
        dataToUpdate.discountPercent = discountPercent;
      }
    } else if (dataToUpdate.mrp !== undefined && dataToUpdate.mrp !== null && dataToUpdate.mrp > effectivePrice) {
      dataToUpdate.discountPercent = Math.round(((dataToUpdate.mrp - effectivePrice) / dataToUpdate.mrp) * 100);
    } else if (newPrice !== undefined && existing.mrp !== null) {
      const existingMrpNum = Number(existing.mrp);
      if (existingMrpNum >= newPrice) {
        dataToUpdate.discountPercent = Math.round(((existingMrpNum - newPrice) / existingMrpNum) * 100);
      }
    }

    if (categoryId !== undefined) {
      if (typeof categoryId !== "string" || !categoryId.trim()) {
        return NextResponse.json({ error: "Category ID must be a non-empty string" }, { status: 400 });
      }
      const categoryExists = await prisma.productCategory.findUnique({ where: { id: categoryId.trim() } });
      if (!categoryExists) {
        return NextResponse.json({ error: "Referenced category not found" }, { status: 400 });
      }
      dataToUpdate.categoryId = categoryId.trim();
    }

    if (stock !== undefined) {
      if (typeof stock !== "number" || !Number.isInteger(stock) || stock < 0 || stock > 1000000) {
        return NextResponse.json({ error: "Stock must be a non-negative integer" }, { status: 400 });
      }
      dataToUpdate.stock = stock;
    }

    // Reject string booleans
    if (available !== undefined) {
      if (typeof available !== "boolean") {
        return NextResponse.json({ error: "available field must be a boolean" }, { status: 400 });
      }
      dataToUpdate.available = available;
    }

    if (featured !== undefined) {
      if (typeof featured !== "boolean") {
        return NextResponse.json({ error: "featured field must be a boolean" }, { status: 400 });
      }
      dataToUpdate.featured = featured;
    }

    if (status !== undefined) {
      const validStatuses = ["PUBLISHED", "DRAFT", "HIDDEN"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
      dataToUpdate.status = status;
    }

    if (images !== undefined) {
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
      dataToUpdate.images = sanitizedImages;
    }

    const updated = await prisma.product.update({
      where: { id },
      data: dataToUpdate,
      include: { category: true },
    });

    try {
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "UPDATE_PRODUCT",
          entity: "Product",
          entityId: id,
          metadata: { name: updated.name, price: Number(updated.price), mrp: updated.mrp ? Number(updated.mrp) : null },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    try {
      revalidatePath("/");
      revalidatePath("/products");
      revalidatePath(`/products/${updated.slug}`);
    } catch {}

    return NextResponse.json({ success: true, product: normalizeProduct(updated) });
  } catch (error: any) {
    console.error("Update Product Error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyCsrfOrigin(req)) {
    return NextResponse.json({ error: "Forbidden: cross-origin request rejected" }, { status: 403 });
  }

  try {
    const { admin, error, status: authStatus } = await requireAdminWithRole(["OWNER"]);
    if (!admin) return NextResponse.json({ error }, { status: authStatus });

    const { id } = await params;
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id } });

    try {
      await prisma.auditLog.create({
        data: {
          adminId: admin.id,
          action: "DELETE_PRODUCT",
          entity: "Product",
          entityId: id,
          metadata: { name: existing.name },
        },
      });
    } catch (auditErr) {
      console.warn("Audit log notice:", auditErr);
    }

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Delete Product Error:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
