"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Camera,
  Film,
  MessageSquare,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";

interface AdminUserProps {
  id: string;
  username: string;
  name?: string | null;
  role: string;
}

interface AdminNavProps {
  user: AdminUserProps;
  newInquiriesCount?: number;
}

export default function AdminNav({ user, newInquiriesCount = 0 }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Skip nav if on login page
  if (pathname === "/admin/login") {
    return null;
  }

  const navLinks = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Products Catalog", href: "/admin/products", icon: ShoppingBag },
    { label: "Categories", href: "/admin/categories", icon: Layers },
    { label: "Studio Services", href: "/admin/services", icon: Camera },
    { label: "Portfolio Stories", href: "/admin/portfolio", icon: Film },
    {
      label: "Customer Inquiries",
      href: "/admin/inquiries",
      icon: MessageSquare,
      badge: newInquiriesCount > 0 ? newInquiriesCount : undefined,
    },
    { label: "Site Settings", href: "/admin/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/auth/logout", { method: "POST" });
      if (!res.ok) {
        console.error("Logout request failed with status:", res.status);
      }
    } catch (e) {
      console.error("Logout network error:", e);
    } finally {
      // Clear client navigation and route to login
      router.push("/admin/login");
      router.refresh();
    }
  };

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-crimson-100/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-28">
            <Image
              src="/logo.png"
              alt="Maa Vaishno Video Film's"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-crimson-100/80 text-crimson-700 uppercase tracking-wider">
            Admin
          </span>
        </div>

        <div className="flex items-center gap-2">
          {newInquiriesCount > 0 && (
            <Link
              href="/admin/inquiries"
              className="px-2 py-1 rounded-full bg-crimson-600 text-white text-[11px] font-bold flex items-center gap-1 animate-pulse"
            >
              <MessageSquare className="w-3 h-3" />
              <span>{newInquiriesCount}</span>
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-charcoal-700 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden sticky top-[57px] z-20 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-4 space-y-4 shadow-lg animate-in fade-in slide-in-from-top-2">
          {/* User profile strip */}
          <div className="p-3 rounded-2xl bg-crimson-50/60 border border-crimson-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-crimson-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.name ? user.name.charAt(0) : "A"}
              </div>
              <div>
                <p className="text-xs font-bold text-charcoal-900 leading-tight">
                  {user.name || user.username}
                </p>
                <p className="text-[10px] text-crimson-700 font-semibold">{user.role}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3 h-3" /> Active
            </span>
          </div>

          {/* Links */}
          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? "bg-crimson-600 text-white shadow-xs"
                      : "text-charcoal-700 hover:bg-crimson-50 hover:text-crimson-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive ? "bg-white text-crimson-700" : "bg-crimson-600 text-white"
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <Link
              href="/"
              target="_blank"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-charcoal-700 text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Public Site
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-white/90 backdrop-blur-md border-r border-crimson-100/70 flex-col justify-between p-5 shrink-0 z-20 shadow-xs min-h-screen">
        <div className="space-y-6">
          {/* Brand Identity */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <Link href="/admin/dashboard" className="relative h-10 w-36 block">
              <Image
                src="/logo.png"
                alt="MAA VAISHNO"
                fill
                className="object-contain object-left"
                priority
              />
            </Link>
            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-crimson-50 text-crimson-700 uppercase tracking-wider border border-crimson-200">
              Admin
            </span>
          </div>

          {/* User Badge */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-crimson-50/70 via-rose-50/40 to-amber-50/30 border border-crimson-100/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-crimson-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {user.name ? user.name.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-charcoal-900 truncate">
                  {user.name || user.username}
                </p>
                <p className="text-[10px] text-crimson-700 font-semibold">{user.role}</p>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Online" />
          </div>

          {/* Nav Links */}
          <nav className="space-y-1.5">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-charcoal-400 px-3 mb-2">
              Management
            </p>
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-crimson-600 text-white shadow-sm shadow-crimson-200"
                      : "text-charcoal-700 hover:bg-crimson-50/80 hover:text-crimson-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{link.label}</span>
                  </div>

                  {link.badge !== undefined ? (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${
                        isActive
                          ? "bg-white text-crimson-700"
                          : "bg-crimson-600 text-white shadow-xs animate-pulse"
                      }`}
                    >
                      {link.badge}
                    </span>
                  ) : isActive ? (
                    <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-5 border-t border-gray-100 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-charcoal-700 hover:bg-gray-100/80 transition"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="w-3.5 h-3.5 text-charcoal-500" />
              View Public Site
            </span>
            <span className="text-[10px] text-charcoal-400 font-mono">⌘ Live</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50/90 transition text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
