import React from "react";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import GimbalCamera from "@/components/GimbalCamera";
import InteractiveDrone from "@/components/InteractiveDrone";
import PhotographyServices from "@/components/PhotographyServices";
import PortfolioGallery from "@/components/PortfolioGallery";
import ProductCatalog from "@/components/ProductCatalog";
import MugCollectionShowcase from "@/components/MugCollectionShowcase";
import FrameCollectionShowcase from "@/components/FrameCollectionShowcase";
import CustomizationPreview from "@/components/CustomizationPreview";
import CyberCafeSection from "@/components/CyberCafeSection";
import InquiryForm from "@/components/InquiryForm";
import GoogleMapCard from "@/components/GoogleMapCard";
import Footer from "@/components/Footer";
import {
  Camera,
  Film,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Video,
  CheckCircle2,
} from "lucide-react";

// Server component fetching live database content
export const revalidate = 0; // Always fresh database records

export default async function HomePage() {
  // Fetch real data from Prisma database
  const [siteSettings, services, portfolioProjects, products] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: "default" } }),
    prisma.service.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.portfolioProject.findMany({
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { isPublished: true },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const mugs = products.filter((p) => p.category.slug === "customized-mugs");
  const frames = products.filter((p) => p.category.slug === "premium-photo-frames");

  return (
    <div className="min-h-screen bg-[#fcfbf7] text-charcoal-900 selection:bg-crimson-100 selection:text-crimson-900">
      {/* SECTION A: Floating Glass Navigation */}
      <Navbar />

      {/* Website-Wide Persistent Flying & Dodging Quadcopter Drone */}
      <InteractiveDrone />

      {/* SECTION B: Cinematic Hero with 3D Gimbal-Mounted Camera */}
      <section
        id="hero-section"
        className="relative pt-28 pb-16 sm:pt-36 sm:pb-24 overflow-hidden border-b border-crimson-100/50"
      >
        {/* Soft Liquid Glass Ambient Gradients */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-crimson-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-rose-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Hero Left Typography & CTAs (6 cols) */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Studio Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass-rose text-crimson-700 text-xs font-bold tracking-wider uppercase shadow-xs">
                <span className="w-2 h-2 rounded-full bg-crimson-600 animate-pulse" />
                Premier Hajipur Photography & Digital Studio
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black text-charcoal-900 tracking-tight leading-[1.1]">
                  MAA VAISHNO <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson-600 via-rose-600 to-crimson-700">
                    VIDEO FILM’S
                  </span>
                </h1>
                <p className="text-lg sm:text-xl font-bold text-charcoal-700">
                  {siteSettings?.heroSubhead || "Capturing Moments. Creating Memories."}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm sm:text-base text-charcoal-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                {siteSettings?.heroDescription ||
                  "Professional Photography, Cinematic Films, Customized Gifts, Premium Photo Frames and Digital Services—all in one place."}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <a
                  href="#portfolio-gallery"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl liquid-btn-primary font-bold text-sm tracking-wide text-white shadow-liquid-hover"
                >
                  Explore Our Work
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#contact-inquiry"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl liquid-btn-glass font-bold text-sm text-charcoal-800"
                >
                  Book Your Event
                </a>
              </div>

              {/* Service Highlights Trust Badges */}
              <div className="pt-6 border-t border-gray-200/80 grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4 text-crimson-600 shrink-0" />
                  <span className="text-xs font-semibold text-charcoal-700">4K Gimbals & Drone</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-crimson-600 shrink-0" />
                  <span className="text-xs font-semibold text-charcoal-700">Sublimation Mugs</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-crimson-600 shrink-0" />
                  <span className="text-xs font-semibold text-charcoal-700">Hajipur Verified</span>
                </div>
              </div>
            </div>

            {/* Hero Right: SIGNATURE 3D GIMBAL-MOUNTED CAMERA CENTERPIECE (6 cols) */}
            <div className="lg:col-span-6 relative flex items-center justify-center">
              {/* Studio Pedestal Backdrop Glow */}
              <div className="absolute inset-4 bg-gradient-to-tr from-white via-rose-50/60 to-white rounded-3xl border border-crimson-100/60 shadow-liquid-glass -z-10" />

              {/* 3D WebGL Camera Component (Cursor-following, stationary gimbal stand) */}
              <GimbalCamera />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C: Photography & Videography Services */}
      <PhotographyServices services={services} />

      {/* SECTION D: Portfolio & Cinematic Gallery */}
      <PortfolioGallery items={portfolioProjects} />

      {/* SECTION E: Customized Gifts & Sublimation Products */}
      <ProductCatalog products={products} />

      {/* SECTION F: Customized Mug Collection */}
      <MugCollectionShowcase mugs={mugs} />

      {/* SECTION G: Premium Photo Frames */}
      <FrameCollectionShowcase frames={frames} />

      {/* SECTION H: Interactive Customization Live Preview */}
      <CustomizationPreview />

      {/* SECTION I: Cyber Cafe & Digital Services */}
      <CyberCafeSection services={services} />

      {/* SECTION J & K: Contact Inquiry & Interactive Location Map */}
      <section id="contact-inquiry" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Glass Customer Inquiry Form (7 cols) */}
          <div className="lg:col-span-7">
            <InquiryForm />
          </div>

          {/* Interactive Google Map Card & Direct Studio Contacts (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <GoogleMapCard />
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
