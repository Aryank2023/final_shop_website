"use client";

import React, { useState, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Camera,
  Film,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
  Flame,
  Star,
  Compass,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("from");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Monitor CapsLock state
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.getModifierState) {
      setCapsLockActive(e.getModifierState("CapsLock"));
    }
  };

  const handleQuickFill = () => {
    setUsername("admin");
    setPassword("MaaVaishno@2026!");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed. Check credentials.");
      }

      const target = fromUrl && fromUrl.startsWith("/admin") ? fromUrl : "/admin/dashboard";
      router.push(target);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid administrator credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Figma Glass Terminal Card */}
      <div className="relative rounded-3xl bg-white/[0.04] backdrop-blur-2xl border border-white/[0.1] p-7 sm:p-10 shadow-[0_20px_70px_-10px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Subtle Top Glowing Beam */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-crimson-500 to-transparent opacity-80" />
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-crimson-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Terminal Header */}
        <div className="mb-7">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 p-1.5 px-3 rounded-2xl bg-white/[0.08] border border-white/10 hover:bg-white/[0.14] transition group"
              title="Return to public storefront"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-400 group-hover:-translate-x-0.5 transition text-crimson-400" />
              <span className="text-[11px] font-semibold text-gray-300">Public Site</span>
            </Link>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Studio Server Online
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-crimson-600 to-rose-700 flex items-center justify-center text-white shadow-lg shadow-crimson-600/30 border border-white/20">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Studio Management Portal
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                Authorized access for directors, editors & operations
              </p>
            </div>
          </div>
        </div>

        {/* Quick Fill Demo Helper Pill */}
        <div className="mb-6 p-3 rounded-2xl bg-gradient-to-r from-crimson-950/40 via-white/[0.03] to-white/[0.02] border border-crimson-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-7 h-7 rounded-xl bg-crimson-500/20 flex items-center justify-center text-crimson-400 shrink-0">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-gray-200">Default Admin Credentials</p>
              <p className="text-[10px] text-gray-400 truncate font-mono">user: admin</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleQuickFill}
            className="px-3 py-1.5 rounded-xl bg-crimson-600/80 hover:bg-crimson-600 text-white font-bold text-[11px] transition shadow-xs whitespace-nowrap active:scale-95"
          >
            Auto Fill
          </button>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CapsLock Warning */}
        {capsLockActive && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold flex items-center gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Caps Lock is currently turned ON</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-300 mb-1.5">
              Username or Registered Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-crimson-400 transition">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-crimson-500 focus:ring-4 focus:ring-crimson-500/20 transition backdrop-blur-md"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-300">
                Security Password
              </label>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-crimson-400 transition">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-11 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-crimson-500 focus:ring-4 focus:ring-crimson-500/20 transition backdrop-blur-md font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white transition"
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1 text-gray-400 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded-md bg-white/10 border-white/20 text-crimson-600 focus:ring-crimson-500 w-4 h-4"
              />
              <span className="text-[11px] text-gray-300">Keep session active (24 hours)</span>
            </label>

            <span className="text-[11px] text-gray-500 font-mono">Hajipur Lab</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-crimson-600 via-rose-600 to-crimson-600 hover:from-crimson-500 hover:to-rose-500 font-bold text-sm text-white shadow-lg shadow-crimson-600/30 active:scale-[0.99] disabled:opacity-60 transition duration-200 border border-crimson-400/30"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Secure Token...</span>
              </>
            ) : (
              <>
                <span>Sign In to Studio Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security & Verification Badges */}
        <div className="mt-8 pt-5 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-[10px] text-gray-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>256-Bit HS256 JWT</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-crimson-400 shrink-0" />
            <span>Brute-Force Protected</span>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Prisma SQLite ORM</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen w-full bg-[#06080d] text-white flex flex-col justify-between relative overflow-hidden">
      {/* Background Ambient Glowing Orbs */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-crimson-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[450px] h-[450px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/3 w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Grid Pattern Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-2xl bg-white/95 shadow-sm group-hover:scale-105 transition">
            <div className="relative h-7 w-28">
              <Image
                src="/logo.png"
                alt="MAA VAISHNO"
                fill
                priority
                className="object-contain"
              />
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs font-black tracking-widest uppercase text-gray-400 border-l border-white/10 pl-3">
            Studio Core
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs">
          <span className="hidden md:flex items-center gap-1.5 text-gray-400">
            <Compass className="w-3.5 h-3.5 text-crimson-500" />
            Hajipur, Lalganj Road, Bihar
          </span>
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-gray-200 font-bold transition flex items-center gap-1.5"
          >
            <span>Live Showcase</span>
            <ArrowRight className="w-3 h-3 text-crimson-400" />
          </Link>
        </div>
      </header>

      {/* Main Dual-Column Showcase & Form */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 lg:py-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Side: Cinematic Studio Canvas (7 cols on lg) */}
        <div className="hidden lg:flex lg:col-span-7 flex-col justify-between space-y-8 pr-4">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-crimson-500/10 border border-crimson-500/25 text-crimson-400 text-xs font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Pre-eminent Cinematic Film Lab
            </div>

            <h2 className="text-4xl xl:text-5xl font-black text-white leading-[1.15] tracking-tight">
              Where Every Frame Becomes A{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-crimson-400 via-rose-300 to-amber-200">
                Timeless Legacy.
              </span>
            </h2>

            <p className="text-sm text-gray-300 max-w-xl leading-relaxed">
              Serving thousands of families across Hajipur, Vaishali and Patna with cinematic 4K
              wedding cinematography, high-precision sublimation gift crafting, and digital studio services.
            </p>
          </div>

          {/* Interactive Feature Pills */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-1 hover:border-crimson-500/40 transition">
              <div className="w-8 h-8 rounded-xl bg-crimson-500/15 text-crimson-400 flex items-center justify-center font-bold">
                <Camera className="w-4 h-4" />
              </div>
              <p className="font-bold text-white text-xs mt-2">Sony Cinema Line</p>
              <p className="text-[10px] text-gray-400 leading-tight">FX3 & A7IV 4K 60fps Rigs</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-1 hover:border-purple-500/40 transition">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center font-bold">
                <Film className="w-4 h-4" />
              </div>
              <p className="font-bold text-white text-xs mt-2">Drone Aerial Fleet</p>
              <p className="text-[10px] text-gray-400 leading-tight">DJI Cinematic Perspectives</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md space-y-1 hover:border-amber-500/40 transition">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                <Star className="w-4 h-4" />
              </div>
              <p className="font-bold text-white text-xs mt-2">Sublimation Mugs</p>
              <p className="text-[10px] text-gray-400 leading-tight">Magic heat color revealing</p>
            </div>
          </div>

          {/* Floating Testimonial Pill */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-white/[0.05] via-white/[0.02] to-transparent border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-crimson-600/80 border-2 border-[#06080d] flex items-center justify-center text-[10px] font-bold"
                  >
                    ★
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-bold text-white">4.9 / 5.0 Google Verified Rating</p>
                <p className="text-[10px] text-gray-400">1,200+ weddings & event films delivered</p>
              </div>
            </div>

            <span className="text-[10px] font-mono text-crimson-400 uppercase tracking-widest font-bold">
              EST. 2012
            </span>
          </div>
        </div>

        {/* Right Side: Auth Terminal Card (5 cols on lg) */}
        <div className="lg:col-span-5 w-full">
          <Suspense
            fallback={
              <div className="p-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-crimson-500" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </main>

      {/* Footer Strip */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-500">
        <p>© 2026 MAA VAISHNO VIDEO FILM'S • All Administrative Rights Reserved.</p>
        <p className="font-mono text-gray-500">Proprietor: Abhimanyu Kumar • Near Strawberry Kids School, Hajipur</p>
      </footer>
    </div>
  );
}
