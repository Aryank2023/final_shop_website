"use client";

import React from "react";
import { formatINR } from "@/lib/utils";
import { Camera, Film, Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

interface ServiceItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  startingPricePaise?: number | null;
  imageUrl?: string | null;
  featuresJson?: string | null;
}

export default function PhotographyServices({ services }: { services: ServiceItem[] }) {
  const photoServices = services.filter((s) => s.category !== "CyberCafe");

  return (
    <section id="photography-services" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-rose text-crimson-700 text-xs font-semibold tracking-wider uppercase mb-3">
          <Camera className="w-3.5 h-3.5" />
          Master Visual Storytelling
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
          Photography & Cinematic Videography
        </h2>
        <p className="mt-3 text-charcoal-700 text-base sm:text-lg">
          Equipped with cinema-grade 4K gear, motorized 3-axis gimbals, prime glass, and licensed
          aerial drones for weddings, pre-weddings, and milestones.
        </p>
      </div>

      {/* Services Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {photoServices.map((service) => {
          let features: string[] = [];
          if (service.featuresJson) {
            try {
              features = JSON.parse(service.featuresJson);
            } catch {}
          }

          const img =
            service.imageUrl ||
            "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80";

          return (
            <div
              key={service.id}
              className="liquid-glass-card rounded-3xl overflow-hidden flex flex-col justify-between border border-crimson-100/80 group"
            >
              <div>
                {/* Image Cover */}
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <img
                    src={img}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/80 backdrop-blur-md text-xs font-bold text-crimson-700 border border-white/60">
                    {service.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-charcoal-900 group-hover:text-crimson-600 transition">
                    {service.title}
                  </h3>
                  <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                    {service.description}
                  </p>

                  {/* Bullet features */}
                  {features.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      {features.map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-charcoal-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-crimson-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Price & CTA */}
              <div className="p-6 pt-0 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-charcoal-400 uppercase tracking-wider block">
                    Starting Package
                  </span>
                  <span className="text-base font-black text-crimson-700">
                    {service.startingPricePaise
                      ? formatINR(service.startingPricePaise)
                      : "Custom Quote"}
                  </span>
                </div>

                <a
                  href="#contact-inquiry"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs"
                >
                  Book Shoot
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
