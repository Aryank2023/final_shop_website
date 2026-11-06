import React from "react";
import Image from "next/image";
import { Phone, MapPin, MessageCircle, ExternalLink, Mail, ShieldCheck } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gradient-to-b from-[#fcfbf7] to-white border-t border-crimson-100/60 pt-16 pb-12 overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-crimson-100/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 items-start">
          {/* Brand & Proprietor Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="relative h-12 w-48">
              <Image
                src="/logo.png"
                alt="MAA VAISHNO VIDEO FILM'S"
                fill
                className="object-contain object-left"
              />
            </div>

            <p className="text-sm text-charcoal-700 leading-relaxed pr-4">
              Premium photography, cinematic videography, 3-axis gimbal cinematography, customized
              sublimation gifts, LED photo frames, and authorized cyber cafe digital services in
              Hajipur, Vaishali.
            </p>

            <div className="pt-2 text-xs text-charcoal-600 space-y-1">
              <p>
                <strong className="text-charcoal-900">Proprietor:</strong> Abhimanyu Kumar
              </p>
              <p>
                <strong className="text-charcoal-900">Experience:</strong> Serving Vaishali District
                with professional studio & digital expertise.
              </p>
            </div>
          </div>

          {/* Quick Service Links (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-crimson-700">
              Services & Products
            </h4>
            <ul className="space-y-2 text-xs text-charcoal-700">
              <li>
                <a href="#photography-services" className="hover:text-crimson-600 transition">
                  Wedding & Pre-Wedding Shoots
                </a>
              </li>
              <li>
                <a href="#photography-services" className="hover:text-crimson-600 transition">
                  Cinematic 4K Wedding Films
                </a>
              </li>
              <li>
                <a href="#products-catalog" className="hover:text-crimson-600 transition">
                  Magic & Ceramic Photo Mugs
                </a>
              </li>
              <li>
                <a href="#photo-frames" className="hover:text-crimson-600 transition">
                  LED & Waterproof Photo Frames
                </a>
              </li>
              <li>
                <a href="#customization-preview" className="hover:text-crimson-600 transition">
                  Sublimation T-Shirts & Pillows
                </a>
              </li>
              <li>
                <a href="#cyber-cafe" className="hover:text-crimson-600 transition">
                  PAN & Voter ID Online Services
                </a>
              </li>
            </ul>
          </div>

          {/* Exact Address & Contact Details (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-crimson-700">
              Studio Location & Direct Contact
            </h4>

            <div className="space-y-2.5 text-xs text-charcoal-700">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-crimson-600 shrink-0 mt-0.5" />
                <p>
                  Near Strawberry Kids School, Hathsarganj, Lalganj Road, Hajipur, Vaishali, Bihar -
                  844101.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-crimson-600 shrink-0" />
                <a
                  href="tel:9708345649"
                  className="font-bold text-charcoal-900 hover:text-crimson-600 transition"
                >
                  +91 9708345649
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <a
                  href="https://wa.me/919708345649"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  WhatsApp: 9708345649
                </a>
              </div>
            </div>

            {/* Direct Google Maps Link */}
            <div className="pt-2">
              <a
                href="https://maps.app.goo.gl/PXY8owyi2jSiD1oc7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-crimson-200 text-xs font-bold text-crimson-700 hover:bg-crimson-50 transition shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open In Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Legal and Disclaimer Bar */}
        <div className="mt-12 pt-6 border-t border-gray-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-500">
          <p>© {currentYear} MAA VAISHNO VIDEO FILM’S. All rights reserved.</p>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-crimson-600" />
              Direct Studio Service
            </span>
            <a href="#privacy" className="hover:text-crimson-600 transition">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-crimson-600 transition">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
