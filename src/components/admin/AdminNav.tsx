"use client";

import React from "react";
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
  Shield,
} from "lucide-react";

interface AdminUserProps {
  id: string;
  username: string;
  name?: string | null;
  role: string;
}

export default function AdminNav({ user }: { user: AdminUserProps }) {
  const pathname = usePathname();
  const router = useRouter();

  const navLinks = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Products Catalog", href: "/admin/products", icon: ShoppingBag },
    { label: "Categories", href: "/admin/categories", icon: Layers },
    { label: "Services", href: "/admin/services", icon: Camera },
    { label: "Portfolio", href: "/admin/portfolio", icon: Film },
    { label: "Inquiries", href: "/admin/inquiries", icon: MessageSquare },
    { label: "Site Settings", href: "/admin/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <aside className="w-full md:w-64 bg-white/90 backdrop-blur-md border-r border-crimson-100 flex flex-col justify-between p-4 sm:p-5 shrink-0 z-20 shadow-sm">
      <div className="space-y-6">
        {/* Brand identity */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="relative h-10 w-36">
            <Image src="/logo.png" alt="Maa Vaishno" fill className="object-contain object-left" />
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-crimson-50 text-crimson-700 uppercase">
            Admin
          </span>
        </div>

        {/* User Badge */}
        <div className="p-3 rounded-xl bg-crimson-50/50 border border-crimson-100/60 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-crimson-600 text-white flex items-center justify-center font-bold text-xs">
            {user.name ? user.name.charAt(0) : "A"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-charcoal-900 truncate">
              {user.name || user.username}
            </p>
            <p className="text-[10px] text-crimson-700 font-semibold">{user.role}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? "bg-crimson-600 text-white shadow-sm"
                    : "text-charcoal-700 hover:bg-crimson-50 hover:text-crimson-600"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="pt-6 border-t border-gray-100 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-charcoal-600 hover:bg-gray-100 transition"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            View Public Site
          </span>
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition text-left"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
