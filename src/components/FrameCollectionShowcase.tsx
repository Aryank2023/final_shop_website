"use client";

import React from "react";
import { formatINR } from "@/lib/utils";
import { Sparkles, Layers, ShieldCheck, Sun, MessageCircle } from "lucide-react";

interface FrameItem {
  id: string;
  name: string;
  description: string;
  details?: string | null;
  pricePaise: number;
  mrpPaise?: number | null;
  images: { url: string }[];
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
          moisture-sealed laminations, and rich wooden textures.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {frames.map((frame) => {
          const img =
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
              className="liquid-glass-card rounded-3xl overflow-hidden p-5 flex flex-col justify-between border border-crimson-100 group hover:border-crimson-300"
            >
              <div>
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-rose-50/30 mb-4 p-2 flex items-center justify-center">
                  <img
                    src={img}
                    alt={frame.name}
                    className="w-full h-full object-cover rounded-xl filter drop-shadow-md transition-transform duration-500 group-hover:scale-105"
                  />
                  {frame.name.includes("LED") && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase shadow-md">
                      <Sun className="w-3 h-3" />
                      LED Glow
                    </div>
                  )}
                  {frame.name.includes("Waterproof") && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase shadow-md">
                      <ShieldCheck className="w-3 h-3" />
                      Waterproof
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-charcoal-900 group-hover:text-crimson-600 transition line-clamp-1">
                  {frame.name}
                </h3>
                <p className="text-xs text-charcoal-600 mt-1 line-clamp-2 leading-relaxed">
                  {frame.description}
                </p>

                {frame.details && (
                  <p className="text-[11px] text-charcoal-500 mt-2 bg-gray-50/80 p-2 rounded-lg font-mono">
                    {frame.details}
                  </p>
                )}

                {frame.variants.length > 0 && (
                  <div className="mt-3">
                    <span className="text-[10px] text-charcoal-400 block mb-1">Available Sizes:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {frame.variants.map((v, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold bg-crimson-50 text-crimson-800"
                        >
                          {v.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-lg font-black text-crimson-700">
                    {formatINR(frame.pricePaise)}
                  </span>
                  {frame.mrpPaise && (
                    <span className="text-xs text-charcoal-400 line-through ml-2">
                      {formatINR(frame.mrpPaise)}
                    </span>
                  )}
                </div>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Order
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
