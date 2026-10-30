import React from "react";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductDetailsView from "@/components/ProductDetailsView";

export const revalidate = 0; // Always fresh database records

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
  });

  if (!product || !product.isPublished) {
    return {
      title: "Product Not Found | MAA VAISHNO VIDEO FILM'S",
    };
  }

  const primaryImg =
    product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || "/logo.png";

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
  params: { slug: string };
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
    },
  });

  if (!product || !product.isPublished) {
    notFound();
  }

  // Fetch related published products in same category
  const relatedProducts = await prisma.product.findMany({
    where: {
      categoryId: product.categoryId,
      isPublished: true,
      id: { not: product.id },
    },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: true,
    },
    take: 4,
    orderBy: { createdAt: "desc" },
  });

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
