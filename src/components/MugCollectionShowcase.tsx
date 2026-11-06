"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { Coffee, Sparkles, MessageCircle, ArrowRight, Eye } from "lucide-react";

interface MugItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  details?: string | null;
  pricePaise: number;
  mrpPaise?: number | null;
  discountPercent?: number | null;
  images: { url: string; isPrimary?: boolean }[];
  variants: { name: string }[];
}

export default function MugCollectionShowcase({ mugs }: { mugs: MugItem[] }) {
  if (!mugs || mugs.length === 0) return null;

  return (
    <section id="mug-collection" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-rose text-crimson-700 text-xs font-semibold tracking-wider uppercase mb-3">
          <Coffee className="w-3.5 h-3.5" />
          Sublimation Mugs Series
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
          Customized Mug Collection
        </h2>
        <p className="mt-2 text-charcoal-700 text-sm sm:text-base">
          From heat-activated magic mugs that reveal photos with hot tea to frosted crystal glassware
          and dual-tone color accents. Handcrafted in Hajipur.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mugs.map((mug) => {
          const primaryImg =
            mug.images.find((i) => i.isPrimary)?.url ||
            mug.images[0]?.url ||
            "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";

          const waUrl = `https://wa.me/919708345649?text=${encodeURIComponent(
            `Hello Maa Vaishno Studio! I want to customize and order ${mug.name} (${formatINR(mug.pricePaise)}).`
          )}`;

          return (
            <div
              key={mug.id}
              className="liquid-glass-card rounded-2xl overflow-hidden p-5 flex flex-col justify-between border border-crimson-100 group hover:border-crimson-300 transition shadow-xs"
            >
              <div>
                <Link
                  href={`/products/${mug.slug}`}
                  className="relative aspect-[4/3] rounded-xl overflow-hidden bg-rose-50/40 mb-4 flex items-center justify-center block cursor-pointer"
                >
                  <img
                    src={primaryImg}
                    alt={mug.name}
                    className="w-full h-full object-contain filter drop-shadow transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-crimson-700 shadow-xs">
                    Ceramic Grade A
                  </div>

                  {(mug.discountPercent ?? 0) > 0 ? (
                    <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-crimson-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                      {mug.discountPercent}% OFF
                    </div>
                  ) : null}

                  <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-white/95 text-charcoal-900 font-bold text-xs shadow-md flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-crimson-600" />
                      View Details
                    </span>
                  </div>
                </Link>

                <Link href={`/products/${mug.slug}`} className="block">
                  <h3 className="text-base font-bold text-charcoal-900 group-hover:text-crimson-600 transition">
                    {mug.name}
                  </h3>
                </Link>
                <p className="text-xs text-charcoal-600 mt-1 line-clamp-2 leading-relaxed">
                  {mug.description}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
                <div>
                  <div className="text-base font-black text-crimson-700">
                    {formatINR(mug.pricePaise)}
                  </div>
                  {mug.mrpPaise && (
                    <div className="text-[11px] text-charcoal-400 line-through">
                      {formatINR(mug.mrpPaise)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/products/${mug.slug}`}
                    className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-charcoal-700 font-bold transition"
                    title="View Full Product Details & Gallery"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Order</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
