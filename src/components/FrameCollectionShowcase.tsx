"use client";

import React from "react";
import Link from "next/link";
import { formatINR } from "@/lib/utils";
import { Sparkles, Layers, ShieldCheck, Sun, MessageCircle, Eye } from "lucide-react";

interface FrameItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  details?: string | null;
  pricePaise: number;
  mrpPaise?: number | null;
  discountPercent?: number | null;
  images: { url: string; isPrimary?: boolean }[];
  variants: { name: string; priceDeltaPaise: number }[];
}

export default function FrameCollectionShowcase({ frames }: { frames: FrameItem[] }) {
  if (!frames || frames.length === 0) return null;

  return (
    <section id="photo-frames" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-rose text-crimson-700 text-xs font-semibold tracking-wider uppercase mb-3">
          <Layers className="w-3.5 h-3.5" />
          Gallery Quality Preservation
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
          Premium Photo Frames & LED Illumination
        </h2>
        <p className="mt-3 text-charcoal-700 text-sm sm:text-base">
          Handcrafted frames featuring imported cast acrylic, ambient LED edge lighting,
          moisture-sealed laminations, and rich wooden textures. Crafted in Hajipur.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {frames.map((frame) => {
          const primaryImg =
            frame.images.find((i) => i.isPrimary)?.url ||
            frame.images[0]?.url ||
            "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80";

          const waUrl = `https://wa.me/919708345649?text=${encodeURIComponent(
            `Hello Maa Vaishno Studio! I want to inquire about "${frame.name}" (${formatINR(
              frame.pricePaise
            )}). Please share size options.`
          )}`;

          return (
            <div
              key={frame.id}
              className="liquid-glass-card rounded-3xl overflow-hidden p-5 flex flex-col justify-between border border-crimson-100 group hover:border-crimson-300 transition shadow-xs"
            >
              <div>
                <Link
                  href={`/products/${frame.slug}`}
                  className="relative aspect-square rounded-2xl overflow-hidden bg-rose-50/30 mb-4 p-2 flex items-center justify-center block cursor-pointer"
                >
                  <img
                    src={primaryImg}
                    alt={frame.name}
                    className="w-full h-full object-cover rounded-xl filter drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80";
                    }}
                  />

                  {(frame.discountPercent ?? 0) > 0 ? (
                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-crimson-600 text-white text-[10px] font-black tracking-wider uppercase shadow-xs">
                      {frame.discountPercent}% OFF
                    </div>
                  ) : null}

                  <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-white/95 text-charcoal-900 font-bold text-xs shadow-md flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-crimson-600" />
                      View Gallery
                    </span>
                  </div>
                </Link>

                <div className="flex items-center gap-1 text-[10px] font-bold text-crimson-700 uppercase tracking-wider mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Handcrafted Wood</span>
                </div>

                <Link href={`/products/${frame.slug}`} className="block">
                  <h3 className="text-base font-bold text-charcoal-900 group-hover:text-crimson-600 transition line-clamp-1">
                    {frame.name}
                  </h3>
                </Link>
                <p className="text-xs text-charcoal-600 mt-1 line-clamp-2 leading-relaxed">
                  {frame.description}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-4">
                <div>
                  <div className="text-base font-black text-crimson-700">
                    {formatINR(frame.pricePaise)}
                  </div>
                  {frame.mrpPaise && (
                    <div className="text-[10px] text-charcoal-400 line-through">
                      {formatINR(frame.mrpPaise)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Link
                    href={`/products/${frame.slug}`}
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
                    <span>Inquire</span>
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
