"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, User, AlertCircle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams.get("from");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (data.requiresPasswordChange) {
        router.push("/admin/change-password");
        router.refresh();
        return;
      }

      // Strictly validate redirect destination to prevent open redirect vulnerabilities
      function sanitizeRedirect(url: string | null): string {
        if (!url) return "/admin/dashboard";
        const trimmed = url.trim();
        if (!trimmed.startsWith("/admin") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
          return "/admin/dashboard";
        }
        const safeRegex = /^\/admin(\/[a-zA-Z0-9_\-\.\/]*)?(\?[a-zA-Z0-9_\-=&]*)?$/;
        return safeRegex.test(trimmed) ? trimmed : "/admin/dashboard";
      }

      const target = sanitizeRedirect(fromUrl);
      router.push(target);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand identity header */}
      <div className="text-center mb-8">
        <div className="relative h-14 w-52 mx-auto mb-4">
          <Image
            src="/logo.png"
            alt="MAA VAISHNO VIDEO FILM'S"
            fill
            priority
            className="object-contain"
          />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-crimson-50 text-crimson-700 text-xs font-bold uppercase tracking-wider border border-crimson-200">
          <Lock className="w-3 h-3" />
          Restricted Administrative Access
        </div>
        <h1 className="text-2xl font-black text-charcoal-900 mt-2">Studio Management Console</h1>
        <p className="text-xs text-charcoal-500 mt-1">
          Sign in with authorized administrator credentials
        </p>
      </div>

      {/* Liquid Glass Login Card */}
      <div className="liquid-glass-card rounded-3xl p-8 border border-crimson-200/70 shadow-liquid-hover">
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1.5 uppercase tracking-wider">
              Administrator Username / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/90 border border-gray-200 text-sm focus:outline-none focus:border-crimson-600 focus:ring-2 focus:ring-crimson-100 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-charcoal-700 mb-1.5 uppercase tracking-wider">
              Security Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-charcoal-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/90 border border-gray-200 text-sm focus:outline-none focus:border-crimson-600 focus:ring-2 focus:ring-crimson-100 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl liquid-btn-primary font-bold text-sm text-white shadow-liquid-hover disabled:opacity-60 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                <span>Sign In to Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-[11px] text-charcoal-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Encrypted Session • Rate-Limited Authentication</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fcfbf7] via-rose-50/30 to-[#f8f6f0] flex flex-col justify-center items-center p-4">
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
  );
}
