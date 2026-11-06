import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 0; // Always fresh database records

export async function GET(req: NextRequest) {
  try {
    const rawProducts = await prisma.product.findMany({
      where: { status: "PUBLISHED" },
      include: {
        category: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const products = rawProducts.map((p) => {
      const priceNum = Number(p.price);
      const pricePaise = Math.round(priceNum * 100);
      const mrpNum = p.mrp != null ? Number(p.mrp) : null;
      const mrpPaise = mrpNum != null ? Math.round(mrpNum * 100) : null;

      const savedDiscount = p.discountPercent != null ? Number(p.discountPercent) : 0;
      const calculatedDiscount = mrpNum && mrpNum > priceNum ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;
      const discountPercent = savedDiscount > 0 ? savedDiscount : calculatedDiscount;

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: priceNum,
        pricePaise,
        mrp: mrpNum,
        mrpPaise,
        discountPercent,
        available: p.available ?? true,
        isAvailable: p.available ?? true,
        featured: p.featured ?? false,
        category: {
          id: p.category.id,
          name: p.category.name,
          slug: p.category.slug,
        },
        images: Array.isArray(p.images) ? p.images : [],
      };
    });

    return NextResponse.json({ success: true, count: products.length, products });
  } catch (error: any) {
    console.error("Public products API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
