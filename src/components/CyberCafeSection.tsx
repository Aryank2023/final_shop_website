"use client";

import React from "react";
import { formatINR } from "@/lib/utils";
import {
  FileText,
  Printer,
  CreditCard,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Copy,
} from "lucide-react";

interface ServiceItem {
  id: string;
  title: string;
  category: string;
  description: string;
  startingPricePaise?: number | null;
  featuresJson?: string | null;
}

export default function CyberCafeSection({ services }: { services: ServiceItem[] }) {
  const cyberServices = services.filter((s) => s.category === "CyberCafe");

  return (
    <section id="cyber-cafe" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-rose text-crimson-700 text-xs font-semibold tracking-wider uppercase mb-3">
          <FileText className="w-3.5 h-3.5" />
          Hajipur Digital Center
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
          Cyber Cafe & Online Citizen Services
        </h2>
        <p className="mt-3 text-charcoal-700 text-sm sm:text-base">
          Accurate online form submissions, exam registrations, government scheme application
          assistance, color laser printing, and high-resolution scanning in our studio.
        </p>

        {/* Security & Authenticity Notice */}
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs text-left max-w-2xl">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            <strong>Transparency Notice:</strong> We provide expert facilitation and application
            assistance. We do not claim official government affiliation. We never ask for OTPs or
            passwords online.
          </span>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cyberServices.map((service) => {
          let features: string[] = [];
          if (service.featuresJson) {
            try {
              features = JSON.parse(service.featuresJson);
            } catch {}
          }

          return (
            <div
              key={service.id}
              className="liquid-glass-card rounded-2xl p-6 flex flex-col justify-between border border-crimson-100/70 hover:border-crimson-300 transition"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-crimson-50 text-crimson-600 flex items-center justify-center mb-4">
                  {service.title.includes("PAN") ? (
                    <CreditCard className="w-5 h-5" />
                  ) : service.title.includes("Voter") ? (
                    <UserCheck className="w-5 h-5" />
                  ) : service.title.includes("Printing") ? (
                    <Printer className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>

                <h3 className="text-base font-bold text-charcoal-900">{service.title}</h3>
                <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                  {service.description}
                </p>

                {features.length > 0 && (
                  <ul className="mt-4 space-y-1.5 text-xs text-charcoal-700">
                    {features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-crimson-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-charcoal-500 uppercase tracking-wider block">
                    Starting Fee
                  </span>
                  <span className="text-sm font-black text-crimson-700">
                    {service.startingPricePaise
                      ? formatINR(service.startingPricePaise)
                      : "Nominal Fee"}
                  </span>
                </div>

                <a
                  href="#contact-inquiry"
                  className="inline-flex items-center gap-1 text-xs font-bold text-crimson-700 hover:text-crimson-900 transition"
                >
                  Visit Studio
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
