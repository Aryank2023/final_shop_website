import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetailsView from "@/components/ProductDetailsView";

export const revalidate = 0; // Always fresh database records

function formatProduct(p: any) {
  const priceNum = Number(p.price);
  const pricePaise = Math.round(priceNum * 100);
  const mrpNum = (p as any).mrp != null && (p as any).mrp !== "" ? Number((p as any).mrp) : null;
  const mrpPaise = mrpNum != null ? Math.round(mrpNum * 100) : null;

  const savedDiscount = (p as any).discountPercent != null ? Number((p as any).discountPercent) : 0;
  const calculatedDiscount = mrpNum && mrpNum > priceNum ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;
  const discountPercent = savedDiscount > 0 ? savedDiscount : calculatedDiscount;

  const images = (Array.isArray(p.images) && p.images.length > 0 ? p.images : ["/logo.png"]).map(
    (url: string, idx: number) => ({
      id: `${p.id}-img-${idx}`,
      url,
      isPrimary: idx === 0,
      sortOrder: idx,
    })
  );

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    details: p.description,
    pricePaise,
    mrpPaise,
    discountPercent,
    isAvailable: p.available ?? true,
    isFeatured: p.featured ?? false,
    category: {
      id: p.category.id,
      name: p.category.name,
      slug: p.category.slug,
    },
    images,
    variants: [],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product || product.status !== "PUBLISHED") {
    return {
      title: "Product Not Found | MAA VAISHNO VIDEO FILM'S",
    };
  }

  const primaryImg = product.images?.[0] || "/logo.png";

  return {
    title: `${product.name} | Customized Gifts Hajipur | MAA VAISHNO`,
    description: product.description.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: primaryImg }],
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rawProduct = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
    },
  });

  if (!rawProduct || rawProduct.status !== "PUBLISHED") {
    notFound();
  }

  // Fetch related published products in same category
  const rawRelated = await prisma.product.findMany({
    where: {
      categoryId: rawProduct.categoryId,
      status: "PUBLISHED",
      id: { not: rawProduct.id },
    },
    include: {
      category: true,
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

  const product = formatProduct(rawProduct);
  const relatedProducts = rawRelated.map(formatProduct);

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-charcoal-900 selection:bg-crimson-100 selection:text-crimson-900 flex flex-col justify-between">
      {/* Top Navigation */}
      <Navbar />

      <main className="pt-24 sm:pt-28 flex-1">
        <ProductDetailsView product={product} relatedProducts={relatedProducts} />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
