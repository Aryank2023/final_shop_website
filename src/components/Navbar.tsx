"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, Phone, Calendar, Camera } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "#hero-section" },
    { name: "Photography", href: "#photography-services" },
    { name: "Portfolio", href: "#portfolio-gallery" },
    { name: "Gifts & Mugs", href: "#products-catalog" },
    { name: "Photo Frames", href: "#photo-frames" },
    { name: "Live Preview", href: "#customization-preview" },
    { name: "Cyber Cafe", href: "#cyber-cafe" },
    { name: "Contact", href: "#contact-inquiry" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "py-2.5 liquid-glass-nav shadow-liquid-glass"
          : "py-4 bg-white/70 backdrop-blur-md border-b border-crimson-100/40"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link href="#hero-section" className="flex items-center gap-3 group">
            <div className="relative h-11 w-36 sm:h-12 sm:w-44 transition-transform group-hover:scale-[1.02]">
              <Image
                src="/logo.png"
                alt="MAA VAISHNO VIDEO FILM'S - Photography & Videography"
                fill
                priority
                className="object-contain object-left"
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal-800 hover:text-crimson-600 hover:bg-crimson-50/60 transition"
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Action CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            <a
              href="tel:9708345649"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-charcoal-800 bg-white/80 border border-crimson-200 hover:border-crimson-400 hover:text-crimson-600 transition shadow-xs"
            >
              <Phone className="w-3.5 h-3.5 text-crimson-600" />
              <span>9708345649</span>
            </a>

            <a
              href="#contact-inquiry"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white liquid-btn-primary shadow-sm"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Now</span>
            </a>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <a
              href="tel:9708345649"
              className="p-2 rounded-xl bg-crimson-50 text-crimson-600 border border-crimson-200"
              aria-label="Call Business"
            >
              <Phone className="w-4 h-4" />
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-white border border-gray-200 text-charcoal-800 hover:text-crimson-600 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden liquid-glass-nav border-t border-crimson-100 px-5 pt-3 pb-6 mt-2 space-y-1 animate-in fade-in slide-in-from-top-2">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-charcoal-800 hover:bg-crimson-50 hover:text-crimson-600 transition"
            >
              {link.name}
            </a>
          ))}

          <div className="pt-3 flex flex-col gap-2">
            <a
              href="tel:9708345649"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-crimson-200 text-xs font-bold text-charcoal-800"
            >
              <Phone className="w-4 h-4 text-crimson-600" />
              Call 9708345649
            </a>
            <a
              href="#contact-inquiry"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-sm"
            >
              <Calendar className="w-4 h-4" />
              Book An Event / Order Gift
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
