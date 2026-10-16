"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Phone, MessageSquare, Loader2 } from "lucide-react";

export default function InquiryForm() {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    inquiryType: "Wedding Photography",
    message: "",
    honeypot: "", // hidden spam trap
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successInfo, setSuccessInfo] = useState<{ message: string; emailStatus?: string } | null>(
    null
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit inquiry");
      }

      setStatus("success");
      setSuccessInfo({
        message: data.message,
        emailStatus: data.emailStatus,
      });

      // Reset form
      setFormData({
        name: "",
        mobile: "",
        email: "",
        inquiryType: "Wedding Photography",
        message: "",
        honeypot: "",
      });
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "An unexpected error occurred. Please call 9708345649.");
    }
  };

  return (
    <div className="relative liquid-glass-card rounded-3xl p-6 sm:p-10 border border-crimson-200/60 shadow-liquid-hover">
      {/* Decorative gradient glow */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-crimson-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
            Direct Studio Inquiry
          </span>
          <h3 className="text-2xl font-black text-charcoal-900 mt-1">
            Let’s Capture Your Story or Craft Your Gift
          </h3>
          <p className="text-sm text-charcoal-600 mt-1.5">
            Fill in your details below and proprietor Abhimanyu Kumar will get in touch with you
            with exact quotes and date availability.
          </p>
        </div>

        {status === "success" && (
          <div className="mb-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-sm">{successInfo?.message}</p>
                {successInfo?.emailStatus && (
                  <p className="text-xs text-emerald-700 mt-0.5">{successInfo.emailStatus}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setStatus("idle")}
              className="mt-3 text-xs font-semibold text-emerald-800 underline hover:text-emerald-950"
            >
              Send another inquiry
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <p className="text-xs font-medium">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Honeypot anti-spam field */}
          <input
            type="text"
            name="honeypot"
            value={formData.honeypot}
            onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Your Full Name <span className="text-crimson-600">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Amit Kumar"
                className="w-full px-4 py-2.5 rounded-xl bg-white/90 border border-gray-200 text-sm focus:outline-none focus:border-crimson-600 focus:ring-2 focus:ring-crimson-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Mobile Number (10 digits) <span className="text-crimson-600">*</span>
              </label>
              <input
                type="tel"
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, "") })
                }
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-2.5 rounded-xl bg-white/90 border border-gray-200 text-sm focus:outline-none focus:border-crimson-600 focus:ring-2 focus:ring-crimson-100 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. amit@example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white/90 border border-gray-200 text-sm focus:outline-none focus:border-crimson-600 focus:ring-2 focus:ring-crimson-100 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Service or Product <span className="text-crimson-600">*</span>
              </label>
              <select
                value={formData.inquiryType}
                onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-white/90 border border-gray-200 text-sm focus:outline-none focus:border-crimson-600 focus:ring-2 focus:ring-crimson-100 transition"
              >
                <option value="Wedding Photography">Wedding Photography</option>
                <option value="Cinematic Wedding Films">Cinematic Wedding Films</option>
                <option value="Pre-Wedding Shoots">Pre-Wedding Shoot</option>
                <option value="Birthday & Events">Birthday & Event Photography</option>
                <option value="Customized Mugs">Customized Mugs / Magic Mugs</option>
                <option value="Photo Frames">Premium / LED Photo Frames</option>
                <option value="Sublimation Gifts">T-Shirts, Pillows & Gifts</option>
                <option value="Cyber Cafe Services">Cyber Cafe (PAN/Voter/Printing)</option>
                <option value="General Inquiry">Other Inquiry</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Event Date, Venue or Specific Requirements <span className="text-crimson-600">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Tell us about the dates, venue location in Hajipur/Vaishali, number of mug pieces, or specific frame size..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/90 border border-gray-200 text-sm focus:outline-none focus:border-crimson-600 focus:ring-2 focus:ring-crimson-100 transition resize-none"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl liquid-btn-primary font-bold text-sm tracking-wide text-white shadow-liquid-hover disabled:opacity-60"
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Transmitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Official Inquiry
                </>
              )}
            </button>

            <a
              href="https://wa.me/919708345649?text=Hello%20Maa%20Vaishno%20Video%20Film's!%20I%20want%20to%20enquire%20about%20your%20services."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl liquid-btn-glass text-xs font-bold text-charcoal-800"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Chat on WhatsApp
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
