"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { Sparkles, Upload, RefreshCw, Send, CheckCircle2, MessageCircle } from "lucide-react";

interface ProductTemplate {
  id: string;
  name: string;
  category: string;
  baseImage: string;
  overlayType: "mug" | "tshirt" | "frame" | "cushion" | "keychain";
  description: string;
  price: string;
}

const TEMPLATES: ProductTemplate[] = [
  {
    id: "mug",
    name: "Sublimation Ceramic Mug",
    category: "Mugs",
    baseImage: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80",
    overlayType: "mug",
    description: "360° permanent heat-press sublimation on high-gloss ceramic",
    price: "₹249",
  },
  {
    id: "frame",
    name: "LED Backlit Glow Frame",
    category: "Photo Frames",
    baseImage: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=800&q=80",
    overlayType: "frame",
    description: "High-clarity optical acrylic with warm ambient LED glow",
    price: "₹1,499",
  },
  {
    id: "tshirt",
    name: "Personalized Sublimation T-Shirt",
    category: "Gifts",
    baseImage: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
    overlayType: "tshirt",
    description: "Breathable micro-polyester fabric with zero-fade chest print",
    price: "₹399",
  },
  {
    id: "cushion",
    name: "Velvet Photo Cushion",
    category: "Gifts",
    baseImage: "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=800&q=80",
    overlayType: "cushion",
    description: "Plush velvet cover with vibrant edge-to-edge sublimation",
    price: "₹449",
  },
];

const SAMPLE_PHOTOS = [
  { name: "Wedding Couple", url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80" },
  { name: "Pre-Wedding Sunset", url: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=600&q=80" },
  { name: "Baby Milestone", url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80" },
];

export default function CustomizationPreview() {
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate>(TEMPLATES[0]);
  const [customText, setCustomText] = useState("Rahul & Priya");
  const [customDate, setCustomDate] = useState("Together Forever • 2026");
  const [fontStyle, setFontStyle] = useState<"serif" | "cursive" | "sans">("cursive");
  const [textColor, setTextColor] = useState("#be123c");
  const [selectedPhoto, setSelectedPhoto] = useState(SAMPLE_PHOTOS[0].url);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setSelectedPhoto(ev.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const fontClass =
    fontStyle === "cursive"
      ? "font-serif italic tracking-wide"
      : fontStyle === "serif"
      ? "font-serif tracking-widest uppercase font-semibold"
      : "font-sans font-bold tracking-tight";

  const getWhatsAppLink = () => {
    const msg = encodeURIComponent(
      `Hello Maa Vaishno Video Film's! I customized a ${selectedTemplate.name} on your website with Text: "${customText}" and would like to order it.`
    );
    return `https://wa.me/919708345649?text=${msg}`;
  };

  return (
    <section id="customization-preview" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass-rose text-crimson-700 text-xs font-semibold tracking-wider uppercase mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Interactive Studio Simulator
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-charcoal-900 tracking-tight">
          Preview Your Custom Photo & Gifts Live
        </h2>
        <p className="mt-4 text-base sm:text-lg text-charcoal-700">
          Upload your favorite portrait or enter personalized names to see a real-time sublimation
          render on mugs, illuminated frames, cushions, and t-shirts before placing your order.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column (Left) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Step 1: Product Selector */}
          <div className="liquid-glass-card rounded-2xl p-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-3">
              1. Choose Product To Personalize
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              {TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl)}
                  className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                    selectedTemplate.id === tpl.id
                      ? "border-crimson-600 bg-crimson-50/70 shadow-sm"
                      : "border-gray-200 hover:border-crimson-200 bg-white/70"
                  }`}
                >
                  <span className="text-xs font-bold text-charcoal-900">{tpl.name}</span>
                  <span className="text-[11px] text-crimson-700 font-semibold mt-1">
                    {tpl.price}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Photo Selection */}
          <div className="liquid-glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700">
                2. Choose or Upload Photo
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-crimson-700 bg-crimson-100/70 hover:bg-crimson-200/70 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Your Photo
              </button>
            </div>

            {/* Preset thumbnails */}
            <div className="flex items-center gap-3">
              {SAMPLE_PHOTOS.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedPhoto(sp.url)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition ${
                    selectedPhoto === sp.url
                      ? "border-crimson-600 ring-2 ring-crimson-200"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  <img src={sp.url} alt={sp.name} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Text & Typography */}
          <div className="liquid-glass-card rounded-2xl p-5 space-y-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
              3. Customize Text & Typography
            </label>

            <div>
              <span className="text-[11px] font-medium text-charcoal-600">Headline / Names:</span>
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                maxLength={35}
                className="mt-1 w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-crimson-500"
                placeholder="e.g. Rahul & Priya"
              />
            </div>

            <div>
              <span className="text-[11px] font-medium text-charcoal-600">Subtext / Date:</span>
              <input
                type="text"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                maxLength={40}
                className="mt-1 w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-crimson-500"
                placeholder="e.g. 24th November 2026"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="text-[11px] font-medium text-charcoal-600 block mb-1">
                  Font Style:
                </span>
                <div className="flex gap-1.5">
                  {(["cursive", "serif", "sans"] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setFontStyle(st)}
                      className={`px-2.5 py-1 text-xs rounded-lg border capitalize ${
                        fontStyle === st
                          ? "bg-crimson-600 text-white border-crimson-600"
                          : "bg-white text-charcoal-700 border-gray-200"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-medium text-charcoal-600 block mb-1">
                  Text Color:
                </span>
                <div className="flex gap-2">
                  {["#be123c", "#0f172a", "#d97706", "#ffffff"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setTextColor(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full border-2 ${
                        textColor === c ? "border-crimson-600 scale-110" : "border-gray-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Canvas / Simulator Showcase Column (Right) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="relative w-full max-w-lg aspect-square bg-gradient-to-b from-white via-rose-50/40 to-white rounded-3xl p-6 border border-crimson-100 shadow-liquid-glass flex items-center justify-center overflow-hidden">
            {/* Ambient liquid glow behind preview */}
            <div className="absolute -top-16 -right-16 w-52 h-52 bg-crimson-200/40 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />

            {/* Realistic Product Mockup Base */}
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Product Background Image */}
              <img
                src={selectedTemplate.baseImage}
                alt={selectedTemplate.name}
                className="w-full h-full object-contain filter contrast-105 drop-shadow-2xl rounded-2xl"
              />

              {/* DYNAMIC PRODUCT OVERLAY PRINT REGION */}
              {selectedTemplate.overlayType === "mug" && (
                <div className="absolute top-[32%] left-[34%] w-[36%] h-[42%] flex flex-col items-center justify-center text-center p-2 rounded-lg bg-white/40 backdrop-blur-[1px] shadow-inner border border-white/60 overflow-hidden transform -rotate-1 skew-y-1">
                  <div className="relative w-full h-[62%] rounded-md overflow-hidden mb-1.5 shadow-sm">
                    <img src={selectedPhoto} alt="Personalized" className="w-full h-full object-cover" />
                  </div>
                  <p className={`text-xs ${fontClass} leading-tight line-clamp-1`} style={{ color: textColor }}>
                    {customText}
                  </p>
                  <p className="text-[9px] text-charcoal-700 tracking-wider font-medium line-clamp-1">
                    {customDate}
                  </p>
                </div>
              )}

              {selectedTemplate.overlayType === "frame" && (
                <div className="absolute top-[22%] left-[23%] w-[54%] h-[56%] flex flex-col items-center justify-center text-center p-3 rounded-lg bg-white/20 shadow-2xl overflow-hidden border-2 border-white/80">
                  <div className="relative w-full h-[70%] rounded overflow-hidden mb-2 shadow-md">
                    <img src={selectedPhoto} alt="Personalized" className="w-full h-full object-cover" />
                  </div>
                  <p className={`text-sm ${fontClass} drop-shadow-sm line-clamp-1`} style={{ color: textColor }}>
                    {customText}
                  </p>
                  <p className="text-[10px] text-charcoal-800 font-semibold tracking-wider line-clamp-1">
                    {customDate}
                  </p>
                </div>
              )}

              {selectedTemplate.overlayType === "tshirt" && (
                <div className="absolute top-[34%] left-[36%] w-[28%] h-[32%] flex flex-col items-center justify-center text-center p-2 rounded bg-white/30 backdrop-blur-[0.5px] border border-white/40 shadow-inner overflow-hidden">
                  <div className="relative w-full h-[65%] rounded overflow-hidden mb-1">
                    <img src={selectedPhoto} alt="Personalized" className="w-full h-full object-cover" />
                  </div>
                  <p className={`text-[10px] ${fontClass} line-clamp-1`} style={{ color: textColor }}>
                    {customText}
                  </p>
                  <p className="text-[8px] text-charcoal-700 line-clamp-1">{customDate}</p>
                </div>
              )}

              {selectedTemplate.overlayType === "cushion" && (
                <div className="absolute top-[26%] left-[26%] w-[48%] h-[48%] flex flex-col items-center justify-center text-center p-3 rounded-2xl bg-white/40 backdrop-blur-[1px] shadow-inner border border-white/60 overflow-hidden">
                  <div className="relative w-full h-[68%] rounded-xl overflow-hidden mb-2 shadow-md">
                    <img src={selectedPhoto} alt="Personalized" className="w-full h-full object-cover" />
                  </div>
                  <p className={`text-xs ${fontClass} line-clamp-1`} style={{ color: textColor }}>
                    {customText}
                  </p>
                  <p className="text-[9px] text-charcoal-700 line-clamp-1">{customDate}</p>
                </div>
              )}
            </div>

            {/* Badge */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-crimson-200 text-charcoal-800 text-[11px] font-bold shadow-xs">
              Live Mockup • High-Res Sublimation
            </div>
          </div>

          {/* Pricing & WhatsApp Order CTA */}
          <div className="w-full max-w-lg mt-5 p-4 rounded-2xl liquid-glass-card flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-charcoal-600 font-medium">{selectedTemplate.name}</div>
              <div className="text-2xl font-black text-crimson-600">
                {selectedTemplate.price}
                <span className="text-xs font-normal text-charcoal-500 ml-1.5">(Inclusive of Print)</span>
              </div>
            </div>

            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl liquid-btn-primary font-bold text-sm tracking-wide text-white shadow-liquid-hover"
            >
              <MessageCircle className="w-4 h-4" />
              Order This Customization
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
