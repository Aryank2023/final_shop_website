import React from "react";
import { MapPin, Phone, MessageCircle, ExternalLink, Navigation, Compass } from "lucide-react";

export default function GoogleMapCard() {
  const mapsUrl = "https://maps.app.goo.gl/ZSZKFxj4UMeUjVz68";

  return (
    <div className="relative rounded-3xl overflow-hidden liquid-glass-card border border-crimson-200/60 p-6 sm:p-8 shadow-liquid-hover">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        {/* Left Information */}
        <div className="space-y-4 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-crimson-50 text-crimson-700 text-xs font-bold uppercase tracking-wider">
            <Compass className="w-3.5 h-3.5" />
            Find Our Studio in Hajipur
          </div>

          <h3 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 leading-tight">
            Visit MAA VAISHNO VIDEO FILM’S
          </h3>

          <div className="space-y-2 text-sm text-charcoal-700">
            <p className="flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-crimson-600 shrink-0 mt-0.5" />
              <span>
                <strong>Address:</strong> Near Strawberry Kids School, Hathsarganj, Lalganj Road,
                Hajipur, Vaishali, Bihar - 844101.
              </span>
            </p>
            <p className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-crimson-600 shrink-0" />
              <span>
                <strong>Mobile / Proprietor:</strong> +91 9708345649 (Abhimanyu Kumar)
              </span>
            </p>
          </div>

          <p className="text-xs text-charcoal-500">
            Conveniently located on Lalganj Road, just minutes from the Hajipur main market. Walk-ins
            welcome for photo shoots, gift printing, and cyber cafe assistance.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs"
            >
              <Navigation className="w-4 h-4" />
              Open in Google Maps
            </a>

            <a
              href="tel:9708345649"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-btn-glass text-xs font-bold text-charcoal-800"
            >
              <Phone className="w-4 h-4 text-crimson-600" />
              Call Now: 9708345649
            </a>

            <a
              href="https://wa.me/919708345649"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              WhatsApp Studio
            </a>
          </div>
        </div>

        {/* Right Interactive Visual Map Box */}
        <div className="w-full lg:w-96 aspect-[4/3] rounded-2xl overflow-hidden border border-crimson-100 shadow-md relative group bg-rose-50 flex items-center justify-center">
          {/* Stylized Google Map iframe representation pointing to Hajipur, Vaishali */}
          <iframe
            title="Maa Vaishno Video Film's Hajipur Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14382.476140580922!2d85.207949!3d25.688849!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ed586c00000001%3A0x1!2sHajipur%2C%20Bihar!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
            className="w-full h-full border-0 filter contrast-105"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />

          {/* Floating location pin card overlay */}
          <div className="absolute bottom-3 left-3 right-3 p-3 rounded-xl bg-white/95 backdrop-blur-md border border-crimson-200 shadow-lg flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-charcoal-900">MAA VAISHNO VIDEO FILM’S</p>
              <p className="text-[10px] text-charcoal-600">Lalganj Road, Hajipur (844101)</p>
            </div>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-crimson-600 text-white hover:bg-crimson-700 transition"
              title="Open verified location"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
