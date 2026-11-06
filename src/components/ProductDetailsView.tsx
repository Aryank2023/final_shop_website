"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import {
  MessageCircle,
  Phone,
  Check,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Star,
  ChevronLeft,
  ChevronRight,
  Share2,
  PackageCheck,
  PackageX,
  Layers,
  ArrowLeft,
  Home,
  Tag,
} from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
  sortOrder?: number;
}

interface ProductVariant {
  id: string;
  name: string;
  priceDeltaPaise: number;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string;
  details?: string | null;
  pricePaise: number;
  mrpPaise?: number | null;
  discountPercent?: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string };
  images: ProductImage[];
  variants: ProductVariant[];
}

export default function ProductDetailsView({
  product,
  relatedProducts,
}: {
  product: ProductData;
  relatedProducts: ProductData[];
}) {
  // Sort images: primary first or by sortOrder
  const sortedImages = [...product.images].sort((a, b) => {
    if (a.isPrimary) return -1;
    if (b.isPrimary) return 1;
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants.length > 0 ? product.variants[0] : null
  );
  const [copiedLink, setCopiedLink] = useState(false);

  // Active image URL with fallback
  const currentImage =
    sortedImages[activeImageIndex]?.url ||
    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";

  // Calculate live price including variant delta
  const basePrice = product.pricePaise;
  const deltaPrice = selectedVariant ? selectedVariant.priceDeltaPaise : 0;
  const effectivePricePaise = basePrice + deltaPrice;

  // WhatsApp order URL
  const getWhatsAppOrderUrl = () => {
    const variantText = selectedVariant ? ` (Variant: ${selectedVariant.name})` : "";
    const pageUrl = typeof window !== "undefined" ? window.location.href : `http://localhost:3000/products/${product.slug}`;
    const text = encodeURIComponent(
      `Hello Maa Vaishno Video Film's! I want to customize and order:
*${product.name}*${variantText}
Price: ${formatINR(effectivePricePaise)}
Product Link: ${pageUrl}

Please guide me on how to send photos/text for customization.`
    );
    return `https://wa.me/919708345649?text=${text}`;
  };

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % sortedImages.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length);
  };

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-charcoal-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
        <Link href="/" className="hover:text-crimson-600 transition flex items-center gap-1">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        <span>/</span>
        <Link href="/#products-catalog" className="hover:text-crimson-600 transition">
          Customized Gifts
        </Link>
        <span>/</span>
        <span className="font-semibold text-charcoal-700">{product.category.name}</span>
        <span>/</span>
        <span className="font-bold text-crimson-700 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
        {/* ========================================================= */}
        {/* LEFT COLUMN: INTERACTIVE IMAGE GALLERY (7 cols on lg)     */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Large Main Feature Image Card */}
          <div className="liquid-glass-card rounded-3xl overflow-hidden border border-crimson-100/80 p-4 sm:p-6 relative bg-white group shadow-sm">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-rose-50/20 flex items-center justify-center">
              <img
                src={currentImage}
                alt={`${product.name} - Photo ${activeImageIndex + 1}`}
                className="w-full h-full object-contain filter drop-shadow-md transition-all duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";
                }}
              />

              {/* Discount Tag */}
              {(product.discountPercent ?? 0) > 0 ? (
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-crimson-600 text-white text-xs font-black tracking-wider uppercase shadow-xs">
                  {product.discountPercent}% OFF
                </div>
              ) : null}

              {/* Stock Status Badge */}
              <div className="absolute top-3 right-3">
                {product.isAvailable ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    In Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold shadow-xs">
                    <PackageX className="w-3.5 h-3.5" />
                    Sold Out
                  </span>
                )}
              </div>

              {/* Previous / Next Arrows for Image Carousel */}
              {sortedImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-charcoal-800 flex items-center justify-center shadow-md transition hover:scale-110 active:scale-95"
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-charcoal-800 flex items-center justify-center shadow-md transition hover:scale-110 active:scale-95"
                    aria-label="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Image index counter badge */}
              {sortedImages.length > 0 && (
                <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[11px] font-mono">
                  {activeImageIndex + 1} / {sortedImages.length}
                </div>
              )}
            </div>
          </div>

          {/* Thumbnail Strip */}
          {sortedImages.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {sortedImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 bg-white transition p-1 ${
                    idx === activeImageIndex
                      ? "border-crimson-600 ring-2 ring-crimson-200 scale-105"
                      : "border-gray-200 hover:border-crimson-300 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  {img.isPrimary && (
                    <span className="absolute bottom-1 inset-x-1 bg-crimson-600 text-[8px] text-white font-bold text-center rounded py-0.2">
                      Cover
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: PRODUCT DETAILS & ACTIONS (5 cols on lg)    */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Header & Title */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-crimson-50 text-crimson-700 text-xs font-bold uppercase tracking-wider border border-crimson-100">
                {product.category.name}
              </span>

              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-charcoal-600 transition flex items-center gap-1.5 text-xs font-bold"
                title="Share product link"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedLink ? "Link Copied!" : "Share"}</span>
              </button>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Price section */}
            <div className="pt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-crimson-700">
                {formatINR(effectivePricePaise)}
              </span>
              {product.mrpPaise && (
                <span className="text-base text-charcoal-400 line-through">
                  {formatINR(product.mrpPaise)}
                </span>
              )}
              {(product.discountPercent ?? 0) > 0 ? (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-extrabold">
                  Save {product.discountPercent}%
                </span>
              ) : null}
            </div>
            <p className="text-[11px] text-charcoal-500 font-medium">
              Inclusive of GST & customized sublimation printing
            </p>
          </div>

          {/* Description */}
          <div className="liquid-glass-card rounded-2xl p-5 border border-crimson-100/60 space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-charcoal-500">
              Description & Highlights
            </h3>
            <p className="text-sm text-charcoal-700 leading-relaxed font-sans">
              {product.description}
            </p>
          </div>

          {/* Technical Specs & Inclusions */}
          {product.details && (
            <div className="liquid-glass-card rounded-2xl p-5 border border-crimson-100/60 space-y-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-charcoal-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-crimson-600" />
                Technical Specifications & Inclusions
              </h3>
              <p className="text-xs text-charcoal-800 leading-relaxed font-mono bg-white/80 p-3 rounded-xl border border-gray-100">
                {product.details}
              </p>
            </div>
          )}

          {/* Variants Selector (if any) */}
          {product.variants.length > 0 && (
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
                Select Option / Edition:
              </label>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-crimson-600 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-charcoal-700 hover:border-crimson-300"
                      }`}
                    >
                      <span>{variant.name}</span>
                      {variant.priceDeltaPaise > 0 && (
                        <span className={isSelected ? "text-crimson-100" : "text-crimson-600"}>
                          (+{formatINR(variant.priceDeltaPaise)})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Call to Actions: WhatsApp & Direct Call */}
          <div className="space-y-3 pt-2">
            <a
              href={getWhatsAppOrderUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-liquid-hover transition duration-200 active:scale-[0.99]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Order & Customize on WhatsApp</span>
            </a>

            <div className="flex items-center gap-3">
              <a
                href="tel:9708345649"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-gray-200 hover:border-crimson-300 hover:bg-crimson-50 text-charcoal-800 font-bold text-xs transition"
              >
                <Phone className="w-4 h-4 text-crimson-600" />
                <span>Call Studio: 9708345649</span>
              </a>

              <Link
                href="/#contact-inquiry"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white border border-gray-200 hover:border-crimson-300 hover:bg-crimson-50 text-charcoal-800 font-bold text-xs transition"
              >
                <span>Send Studio Inquiry</span>
              </Link>
            </div>
          </div>

          {/* Studio Trust Guarantees */}
          <div className="p-4 rounded-2xl bg-rose-50/40 border border-crimson-100 space-y-2.5 text-xs text-charcoal-700">
            <div className="flex items-center gap-2 font-bold text-crimson-900">
              <ShieldCheck className="w-4 h-4 text-crimson-600 shrink-0" />
              <span>Maa Vaishno Studio Assurance</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-charcoal-600">
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Ultra-Vibrant Sublimation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Scratch & Wash Proof</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Same-Day / 24h Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Hajipur Lalganj Rd Pickup</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Showcase */}
      {relatedProducts.length > 0 && (
        <div className="mt-20 pt-12 border-t border-crimson-100/70 space-y-8">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
                More in {product.category.name}
              </span>
              <h2 className="text-2xl font-black text-charcoal-900 mt-1">
                You May Also Like
              </h2>
            </div>
            <Link
              href="/#products-catalog"
              className="text-xs font-bold text-crimson-600 hover:underline flex items-center gap-1"
            >
              <span>View All Catalog</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.slice(0, 4).map((rel) => {
              const relImg =
                rel.images.find((i) => i.isPrimary)?.url || rel.images[0]?.url || "/logo.png";

              return (
                <Link
                  key={rel.id}
                  href={`/products/${rel.slug}`}
                  className="liquid-glass-card rounded-2xl overflow-hidden border border-crimson-100/70 group hover:border-crimson-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-square w-full bg-rose-50/20 p-4 flex items-center justify-center overflow-hidden">
                      <img
                        src={relImg}
                        alt={rel.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";
                        }}
                      />
                      {(rel.discountPercent ?? 0) > 0 ? (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-crimson-600 text-white text-[9px] font-black uppercase">
                          {rel.discountPercent}% OFF
                        </span>
                      ) : null}
                    </div>

                    <div className="p-4 space-y-1">
                      <p className="text-[10px] font-bold text-crimson-600 uppercase tracking-wider">
                        {rel.category.name}
                      </p>
                      <h4 className="font-bold text-charcoal-900 text-sm line-clamp-1 group-hover:text-crimson-600 transition">
                        {rel.name}
                      </h4>
                      <p className="text-xs text-charcoal-500 line-clamp-1">{rel.description}</p>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center justify-between">
                    <span className="font-black text-crimson-700 text-base">
                      {formatINR(rel.pricePaise)}
                    </span>
                    <span className="text-[11px] font-bold text-charcoal-700 group-hover:text-crimson-600 transition flex items-center gap-0.5">
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
