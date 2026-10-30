"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import {
  ShoppingBag,
  MessageCircle,
  Check,
  Sparkles,
  Filter,
  ChevronRight,
  Eye,
  Tag,
  PackageCheck,
  PackageX,
} from "lucide-react";

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  details?: string | null;
  pricePaise: number;
  mrpPaise?: number | null;
  discountPercent?: number | null;
  isAvailable: boolean;
  category: { id: string; name: string; slug: string };
  images: { id: string; url: string; isPrimary: boolean }[];
  variants: { id: string; name: string; sku?: string | null; priceDeltaPaise: number }[];
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export default function ProductCatalog({
  products,
  categories = [],
}: {
  products: ProductItem[];
  categories?: CategoryItem[];
}) {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Derive dynamic category filter tabs
  const categoryTabs = [
    { label: "All Products", slug: "all" },
    ...categories.map((c) => ({
      label: c.name,
      slug: c.slug,
    })),
  ];

  const filteredProducts =
    selectedCategory === "all"
      ? products
      : products.filter((p) => p.category.slug === selectedCategory);

  const getWhatsAppEnquiryUrl = (product: ProductItem) => {
    const text = encodeURIComponent(
      `Hello Maa Vaishno Video Film's! I am interested in ordering "${product.name}" (${formatINR(
        product.pricePaise
      )}). Please share customization details and order process.`
    );
    return `https://wa.me/919708345649?text=${text}`;
  };

  return (
    <section id="products-catalog" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-rose text-crimson-700 text-xs font-semibold tracking-wider uppercase mb-3">
            <ShoppingBag className="w-3.5 h-3.5" />
            Sublimation & Gift Studio
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
            Customized Photo Gifts & Sublimation
          </h2>
          <p className="mt-2 text-charcoal-700 max-w-2xl text-sm sm:text-base">
            Permanent high-definition sublimation printing on ceramic mugs, t-shirts, cushions, and
            luxury frames. Handcrafted locally in Hajipur.
          </p>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryTabs.map((c) => (
            <button
              key={c.slug}
              onClick={() => setSelectedCategory(c.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === c.slug
                  ? "bg-crimson-600 text-white shadow-sm"
                  : "bg-white/80 text-charcoal-700 hover:bg-crimson-50 hover:text-crimson-600 border border-gray-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <div className="py-16 text-center liquid-glass-card rounded-3xl p-8 border border-gray-200">
          <ShoppingBag className="w-12 h-12 text-crimson-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-charcoal-900">No products in this category yet</h3>
          <p className="text-xs text-charcoal-500 mt-1">
            Check back soon or choose "All Products" to browse available studio items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => {
            const primaryImage =
              product.images.find((i) => i.isPrimary)?.url ||
              product.images[0]?.url ||
              "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";

            return (
              <div
                key={product.id}
                className="liquid-glass-card rounded-2xl overflow-hidden flex flex-col justify-between group border border-crimson-100/70 hover:border-crimson-300 transition shadow-xs"
              >
                {/* Product Image Box with Clickable Link */}
                <Link
                  href={`/products/${product.slug}`}
                  className="relative aspect-square w-full overflow-hidden bg-rose-50/25 p-4 flex items-center justify-center block cursor-pointer"
                >
                  <img
                    src={primaryImage}
                    alt={product.name}
                    className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";
                    }}
                  />

                  {/* Discount Badge */}
                  {product.discountPercent && product.discountPercent > 0 && (
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-crimson-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                      {product.discountPercent}% OFF
                    </div>
                  )}

                  {/* Stock indicator */}
                  <div className="absolute top-3 right-3">
                    {product.isAvailable ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        In Stock
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        Sold Out
                      </span>
                    )}
                  </div>

                  {/* View Details Hover Overlay */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-white/95 text-charcoal-900 font-bold text-xs shadow-md flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-crimson-600" />
                      View Gallery
                    </span>
                  </div>
                </Link>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-crimson-600">
                      {product.category.name}
                    </span>
                    <Link href={`/products/${product.slug}`} className="block">
                      <h3 className="text-base font-bold text-charcoal-900 group-hover:text-crimson-600 transition line-clamp-1 mt-0.5">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-charcoal-600 line-clamp-2 mt-1 leading-relaxed font-sans">
                      {product.description}
                    </p>

                    {/* Variants tag if available */}
                    {product.variants.length > 0 && (
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-charcoal-500 font-medium">Options:</span>
                        {product.variants.slice(0, 2).map((v) => (
                          <span
                            key={v.id}
                            className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] text-charcoal-700 font-semibold"
                          >
                            {v.name}
                          </span>
                        ))}
                        {product.variants.length > 2 && (
                          <span className="text-[10px] text-charcoal-500">
                            +{product.variants.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pricing & CTAs */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-lg font-black text-crimson-700">
                        {formatINR(product.pricePaise)}
                      </div>
                      {product.mrpPaise && (
                        <div className="text-[11px] text-charcoal-400 line-through">
                          {formatINR(product.mrpPaise)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/products/${product.slug}`}
                        className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-charcoal-700 font-bold transition"
                        title="View Full Product Details & Gallery"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <a
                        href={getWhatsAppEnquiryUrl(product)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs shrink-0"
                        title="Order on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Order</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
