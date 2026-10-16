import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAA VAISHNO VIDEO FILM’S | Photography, Cinematic Films & Customized Gifts Hajipur",
  description:
    "Professional wedding photography, 4K cinematic videography, 3-axis gimbal shoots, sublimation mugs, customized photo frames, and authorized cyber cafe services in Hajipur, Vaishali, Bihar.",
  keywords: [
    "Maa Vaishno Video Films",
    "Wedding Photography Hajipur",
    "Cinematic Videography Vaishali",
    "Pre Wedding Shoots Hajipur",
    "Customized Mugs Printing",
    "Sublimation Gifts Hajipur",
    "Photo Frames Lalganj Road",
    "Cyber Cafe Hajipur",
    "Abhimanyu Kumar Photographer",
  ],
  authors: [{ name: "Abhimanyu Kumar" }],
  openGraph: {
    title: "MAA VAISHNO VIDEO FILM’S — Capturing Moments. Creating Memories.",
    description:
      "Premier photography studio, cinematic wedding films, sublimation photo gifts and digital services in Hajipur, Bihar.",
    url: "https://maavaishnovideofilms.com",
    siteName: "MAA VAISHNO VIDEO FILM'S",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "MAA VAISHNO VIDEO FILM'S Hajipur",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "MAA VAISHNO VIDEO FILM’S",
    image: "https://maavaishnovideofilms.com/logo.png",
    "@id": "https://maps.app.goo.gl/ZSZKFxj4UMeUjVz68",
    url: "https://maavaishnovideofilms.com",
    telephone: "+919708345649",
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Near Strawberry Kids School, Hathsarganj, Lalganj Road",
      addressLocality: "Hajipur",
      addressRegion: "Bihar",
      postalCode: "844101",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 25.688849,
      longitude: 85.207949,
    },
    founder: {
      "@type": "Person",
      name: "Abhimanyu Kumar",
      jobTitle: "Proprietor & Director of Photography",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Studio Services & Products",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Wedding Photography" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Cinematic Wedding Films" } },
        { "@type": "Offer", itemOffered: { "@type": "Product", name: "Customized Sublimation Mugs" } },
        { "@type": "Offer", itemOffered: { "@type": "Product", name: "LED Illuminated Photo Frames" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Cyber Cafe & Online Services" } },
      ],
    },
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen font-sans bg-[#fcfbf7]">{children}</body>
    </html>
  );
}
