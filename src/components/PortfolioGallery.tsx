"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Play, Eye, X, Film, Camera, Sparkles } from "lucide-react";

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  clientName?: string | null;
  videoUrl?: string | null;
  images: { id: string; url: string; caption?: string | null }[];
}

export default function PortfolioGallery({ items }: { items: PortfolioItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeItem, setActiveItem] = useState<PortfolioItem | null>(null);

  const categories = [
    "All",
    "Weddings",
    "Pre-Weddings",
    "Birthdays",
    "Engagements",
    "Cinematic Films",
  ];

  const filteredItems =
    selectedCategory === "All"
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <section id="portfolio-gallery" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-rose text-crimson-700 text-xs font-semibold tracking-wider uppercase mb-4">
          <Camera className="w-3.5 h-3.5" />
          Cinematic Portfolio
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
          Moments Captured With Soul & Precision
        </h2>
        <p className="mt-4 text-base sm:text-lg text-charcoal-700">
          Browse our recent wedding films, pre-wedding couple sessions, and celebration galleries
          filmed across Vaishali and Bihar.
        </p>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-crimson-600 text-white shadow-md scale-105"
                  : "bg-white/80 text-charcoal-700 hover:bg-crimson-50 hover:text-crimson-600 border border-gray-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Responsive Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredItems.map((item) => {
          const coverImage =
            item.images[0]?.url ||
            "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80";

          return (
            <div
              key={item.id}
              onClick={() => setActiveItem(item)}
              className="group relative rounded-2xl overflow-hidden liquid-glass-card cursor-pointer border border-crimson-100 shadow-liquid-glass"
            >
              {/* Media Container */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <img
                  src={coverImage}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Video Badge */}
                {item.videoUrl && (
                  <div className="absolute top-3 right-3 p-2 rounded-full bg-crimson-600/90 text-white shadow-lg backdrop-blur-xs">
                    <Play className="w-3.5 h-3.5 fill-white" />
                  </div>
                )}

                {/* Subtle Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-5">
                  <div className="text-white space-y-1">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-rose-300">
                      {item.category}
                    </span>
                    <h3 className="text-base font-bold leading-tight">{item.title}</h3>
                    {item.clientName && (
                      <p className="text-xs text-zinc-300">Client: {item.clientName}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Info */}
              <div className="p-4 bg-white/80 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-charcoal-900 group-hover:text-crimson-600 transition truncate max-w-[200px]">
                    {item.title}
                  </h4>
                  <span className="text-xs text-charcoal-500">{item.category}</span>
                </div>
                <div className="p-1.5 rounded-lg bg-crimson-50 text-crimson-600 group-hover:bg-crimson-600 group-hover:text-white transition">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-charcoal-900/80 text-white hover:bg-crimson-600 transition"
              aria-label="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Content */}
            <div className="relative aspect-video w-full bg-black">
              {activeItem.videoUrl ? (
                /\.(mp4|webm|mov|mkv)(\?.*)?$/i.test(activeItem.videoUrl) ||
                (!activeItem.videoUrl.includes("youtube.com") &&
                  !activeItem.videoUrl.includes("youtu.be") &&
                  !activeItem.videoUrl.includes("vimeo.com")) ? (
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-contain"
                    src={activeItem.videoUrl}
                  >
                    Your browser does not support HTML5 video playback.
                  </video>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-zinc-950">
                    <Film className="w-12 h-12 text-crimson-500 mb-3" />
                    <h4 className="text-lg font-bold">{activeItem.title}</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-md">
                      Watch full cinematic 4K film on YouTube or contact studio for original master.
                    </p>
                    <a
                      href={activeItem.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Open Video Master
                    </a>
                  </div>
                )
              ) : (
                <img
                  src={activeItem.images[0]?.url}
                  alt={activeItem.title}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Details Footer */}
            <div className="p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-crimson-600 uppercase tracking-wider">
                  {activeItem.category}
                </span>
                <h3 className="text-xl font-bold text-charcoal-900 mt-0.5">{activeItem.title}</h3>
                {activeItem.description && (
                  <p className="text-xs text-charcoal-600 mt-1">{activeItem.description}</p>
                )}
              </div>

              <a
                href="#contact-inquiry"
                onClick={() => setActiveItem(null)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shrink-0"
              >
                Book Similar Shoot
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
