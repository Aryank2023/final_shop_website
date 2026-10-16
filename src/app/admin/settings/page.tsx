"use client";

import React, { useState, useEffect } from "react";
import { Settings, Save, Check, Loader2, MapPin, Phone, Mail, Globe } from "lucide-react";

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [businessName, setBusinessName] = useState("MAA VAISHNO VIDEO FILM'S");
  const [proprietor, setProprietor] = useState("Abhimanyu Kumar");
  const [phone, setPhone] = useState("9708345649");
  const [email, setEmail] = useState("contact@maavaishnovideofilms.com");
  const [address, setAddress] = useState(
    "Near Strawberry Kids School, Hathsarganj, Lalganj Road, Hajipur, Vaishali, Bihar - 844101"
  );
  const [mapsUrl, setMapsUrl] = useState("https://maps.app.goo.gl/ZSZKFxj4UMeUjVz68");
  const [heroHeadline, setHeroHeadline] = useState("MAA VAISHNO VIDEO FILM'S");
  const [heroSubhead, setHeroSubhead] = useState("Capturing Moments. Creating Memories.");
  const [heroDescription, setHeroDescription] = useState(
    "Professional Photography, Cinematic Films, Customized Gifts, Premium Photo Frames and Digital Services—all in one place."
  );
  const [footerText, setFooterText] = useState(
    "Trusted by thousands of families in Hajipur & Vaishali."
  );

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.settings) {
          const s = data.settings;
          if (s.businessName) setBusinessName(s.businessName);
          if (s.proprietor) setProprietor(s.proprietor);
          if (s.phone) setPhone(s.phone);
          if (s.email) setEmail(s.email);
          if (s.address) setAddress(s.address);
          if (s.mapsUrl) setMapsUrl(s.mapsUrl);
          if (s.heroHeadline) setHeroHeadline(s.heroHeadline);
          if (s.heroSubhead) setHeroSubhead(s.heroSubhead);
          if (s.heroDescription) setHeroDescription(s.heroDescription);
          if (s.footerText) setFooterText(s.footerText);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          proprietor,
          phone,
          email,
          address,
          mapsUrl,
          heroHeadline,
          heroSubhead,
          heroDescription,
          footerText,
        }),
      });

      if (!res.ok) throw new Error("Failed to save settings");
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-crimson-600" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-10 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
            Brand & Meta Configuration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1">
            Website & Studio Settings
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Update proprietor information, phone numbers, Google Maps location, and hero copywriting
          </p>
        </div>

        {savedSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <Check className="w-4 h-4 text-emerald-600" />
            Settings Updated Live!
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Contact & Location Card */}
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 border border-crimson-100 space-y-4">
          <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2 pb-3 border-b border-gray-100">
            <Phone className="w-4 h-4 text-crimson-600" />
            Verified Contact & Studio Identity
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-charcoal-700 mb-1">Business Name</label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 mb-1">Proprietor Name</label>
              <input
                type="text"
                required
                value={proprietor}
                onChange={(e) => setProprietor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-charcoal-700 mb-1">Primary Mobile Phone</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 mb-1">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Physical Studio Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
            />
          </div>

          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Verified Google Maps URL</label>
            <input
              type="url"
              required
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
            />
          </div>
        </div>

        {/* Hero Section Copywriting Card */}
        <div className="liquid-glass-card rounded-3xl p-6 sm:p-8 border border-crimson-100 space-y-4">
          <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2 pb-3 border-b border-gray-100">
            <Globe className="w-4 h-4 text-crimson-600" />
            Homepage Hero Copywriting
          </h2>

          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Main Hero Headline</label>
            <input
              type="text"
              required
              value={heroHeadline}
              onChange={(e) => setHeroHeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
            />
          </div>

          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Supporting Subheading</label>
            <input
              type="text"
              required
              value={heroSubhead}
              onChange={(e) => setHeroSubhead(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
            />
          </div>

          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Hero Description</label>
            <textarea
              rows={3}
              required
              value={heroDescription}
              onChange={(e) => setHeroDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 resize-none"
            />
          </div>

          <div>
            <label className="block font-bold text-charcoal-700 mb-1">Footer Trust Banner Text</label>
            <input
              type="text"
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
            />
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl liquid-btn-primary font-bold text-sm text-white shadow-liquid-hover disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save All Settings Live
          </button>
        </div>
      </form>
    </div>
  );
}
