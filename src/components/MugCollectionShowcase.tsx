"use client";

import React, { useState } from "react";
import { formatINR } from "@/lib/utils";
import { Coffee, Sparkles, MessageCircle, ArrowRight } from "lucide-react";

interface MugItem {
  id: string;
  name: string;
  description: string;
  details?: string | null;
  pricePaise: number;
  mrpPaise?: number | null;
  images: { url: string }[];
  variants: { name: string }[];
}

export default function MugCollectionShowcase({ mugs }: { mugs: MugItem[] }) {
  const [activeMug, setActiveMug] = useState<MugItem>(mugs[0] || null);

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
          and dual-tone color accents.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mugs.map((mug) => {
          const img =
            mug.images[0]?.url ||
            "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";

          const waUrl = `https://wa.me/919708345649?text=${encodeURIComponent(
            `Hello! I want to order ${mug.name} (${formatINR(mug.pricePaise)}).`
          )}`;

          return (
            <div
              key={mug.id}
              className="liquid-glass-card rounded-2xl overflow-hidden p-5 flex flex-col justify-between border border-crimson-100 group hover:border-crimson-300"
            >
              <div>
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-rose-50/40 mb-4 flex items-center justify-center">
                  <img
                    src={img}
                    alt={mug.name}
                    className="w-full h-full object-contain filter drop-shadow transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-crimson-700 shadow-xs">
                    Ceramic Grade A
                  </div>
                </div>

                <h3 className="text-base font-bold text-charcoal-900 group-hover:text-crimson-600 transition">
                  {mug.name}
                </h3>
                <p className="text-xs text-charcoal-600 mt-1 line-clamp-2 leading-relaxed">
                  {mug.description}
                </p>

                {mug.details && (
                  <p className="text-[11px] text-charcoal-500 mt-2 font-mono bg-gray-50 p-2 rounded-lg">
                    {mug.details}
                  </p>
                )}

                {mug.variants && mug.variants.length > 0 && (
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    {mug.variants.map((v, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-crimson-50 text-crimson-800"
                      >
                        {v.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-crimson-700">
                    {formatINR(mug.pricePaise)}
                  </span>
                  {mug.mrpPaise && (
                    <span className="text-xs text-charcoal-400 line-through ml-2">
                      {formatINR(mug.mrpPaise)}
                    </span>
                  )}
                </div>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg liquid-btn-primary text-xs font-bold text-white shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Order Mug
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
