import React from "react";
import { MapPin, Phone, MessageCircle, Navigation, Compass } from "lucide-react";

export default function GoogleMapCard() {
  const mapsUrl = "https://maps.app.goo.gl/PXY8owyi2jSiD1oc7";

  return (
    <div className="relative rounded-3xl overflow-hidden liquid-glass-card border border-crimson-200/60 p-6 sm:p-8 shadow-liquid-hover">
      <div className="flex flex-col gap-6">
        {/* Left/Main Information */}
        <div className="space-y-4">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs hover:opacity-95 transition"
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

        {/* Embedded Google Map Box */}
        <div className="w-full h-[240px] sm:h-[250px] rounded-2xl overflow-hidden border border-crimson-100 shadow-md relative bg-rose-50">
          <iframe
            title="MAA VAISHNO VIDEO FILM'S Google Maps Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3594.9143047418956!2d85.2053279!3d25.7072612!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39ed5c6b8648d575%3A0xc40f92739202a210!2sMAA%20VAISHNO%20VIDEO%20FILM'S%20%26%20DIGITAL%20STUDIO!5e0!3m2!1sen!2sin!4v1793509341220!5m2!1sen!2sin"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            className="w-full h-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  );
}
