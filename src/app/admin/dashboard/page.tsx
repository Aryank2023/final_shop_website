import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  Film,
  MessageSquare,
  Clock,
  ArrowRight,
  Plus,
  Activity,
  ExternalLink,
  Shield,
  MessageCircle,
  Phone,
  Eye,
  Server,
  Sparkles,
} from "lucide-react";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  // Query live metrics and recent items using Neon models
  const [
    totalProducts,
    totalCategories,
    photographyServicesCount,
    cyberCafeServicesCount,
    totalGallery,
    unreadMessages,
    readMessages,
    recentMessages,
    recentAudits,
  ] = await Promise.all([
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.productCategory.count(),
    prisma.photographyService.count(),
    prisma.cyberCafeService.count(),
    prisma.gallery.count(),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.contactMessage.count({ where: { read: true } }),
    prisma.contactMessage.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { Admin: { select: { email: true, name: true } } },
    }),
  ]);

  const totalServices = photographyServicesCount + cyberCafeServicesCount;

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Banner & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-crimson-50 text-crimson-700 text-xs font-bold uppercase tracking-wider border border-crimson-100 mb-2">
            <Activity className="w-3.5 h-3.5 text-crimson-600 animate-pulse" />
            Live Studio Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 tracking-tight">
            Welcome back, {admin.name || admin.username}
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Maa Vaishno Video Film's • Hajipur, Bihar • Real-time Operations & Client Leads
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            New Product
          </Link>
          <Link
            href="/admin/portfolio"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-charcoal-700 hover:border-crimson-300 hover:text-crimson-700 text-xs font-bold shadow-xs transition"
          >
            <Film className="w-4 h-4 text-purple-600" />
            New Gallery Item
          </Link>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-charcoal-700 text-xs font-bold transition"
            title="Preview live public storefront"
          >
            <ExternalLink className="w-4 h-4 text-charcoal-500" />
            Live Store
          </Link>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link
          href="/admin/products"
          className="liquid-glass-card rounded-2xl p-5 border border-crimson-100/70 hover:border-crimson-300 transition group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              Published Products
            </span>
            <div className="p-2.5 rounded-xl bg-crimson-50 text-crimson-600 group-hover:scale-110 transition">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-charcoal-900 mt-2">{totalProducts}</div>
          <p className="text-[11px] text-charcoal-500 mt-1 flex items-center gap-1.5">
            <span className="text-crimson-600 font-bold">{totalCategories} categories</span> in catalog
          </p>
        </Link>

        <Link
          href="/admin/portfolio"
          className="liquid-glass-card rounded-2xl p-5 border border-crimson-100/70 hover:border-purple-300 transition group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              Gallery Works
            </span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-charcoal-900 mt-2">{totalGallery}</div>
          <p className="text-[11px] text-charcoal-500 mt-1 flex items-center gap-1.5">
            <span className="text-purple-600 font-bold">{totalServices} studio services</span> online
          </p>
        </Link>

        <Link
          href="/admin/inquiries?filter=unread"
          className="liquid-glass-card rounded-2xl p-5 border border-crimson-100/70 hover:border-emerald-300 transition group shadow-xs bg-gradient-to-br from-white via-emerald-50/20 to-white"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              Unread Messages
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2 flex items-center gap-2">
            <span>{unreadMessages}</span>
            {unreadMessages > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 animate-pulse">
                Needs Reply
              </span>
            )}
          </div>
          <p className="text-[11px] text-charcoal-500 mt-1">Direct inquiries awaiting WhatsApp/call</p>
        </Link>

        <Link
          href="/admin/inquiries"
          className="liquid-glass-card rounded-2xl p-5 border border-crimson-100/70 hover:border-amber-300 transition group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              Total Messages
            </span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-700 mt-2">{unreadMessages + readMessages}</div>
          <p className="text-[11px] text-charcoal-500 mt-1">Client leads received via website</p>
        </Link>
      </div>

      {/* Main Grid: Recent Messages & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Inquiries (7 cols) */}
        <div className="lg:col-span-7 liquid-glass-card rounded-3xl p-6 sm:p-7 border border-crimson-100/70 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-crimson-600" />
                Recent Customer Inquiries
              </h2>
              <p className="text-xs text-charcoal-500">Live booking quotes and photography requests</p>
            </div>
            <Link
              href="/admin/inquiries"
              className="text-xs font-bold text-crimson-600 hover:text-crimson-800 flex items-center gap-1 group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </Link>
          </div>

          {recentMessages.length === 0 ? (
            <div className="py-12 text-center text-charcoal-400 text-xs">
              No inquiries received yet. They will appear here immediately when submitted on the website.
            </div>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg) => {
                const cleanPhone = msg.phone.replace(/[^0-9]/g, "");
                const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
                const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
                  `Hello ${msg.name}, thank you for contacting MAA VAISHNO VIDEO FILM'S Hajipur regarding "${msg.subject}".`
                )}`;

                return (
                  <div
                    key={msg.id}
                    className="p-4 rounded-2xl bg-white/90 border border-gray-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-crimson-200 transition shadow-xs"
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-charcoal-900">{msg.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-crimson-50 text-crimson-700">
                          {msg.subject}
                        </span>
                        {!msg.read && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md font-extrabold bg-emerald-500 text-white">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-charcoal-600 truncate max-w-md font-sans">
                        {msg.message}
                      </p>
                      <p className="text-[11px] text-charcoal-400 font-mono">
                        📱 {msg.phone} • {formatDate(msg.createdAt)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition shadow-xs"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <a
                        href={`tel:${cleanPhone}`}
                        className="p-2 rounded-xl bg-gray-50 hover:bg-gray-200 text-charcoal-700 transition"
                        title="Call Phone"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                      <Link
                        href="/admin/inquiries"
                        className="p-2 rounded-xl bg-gray-50 hover:bg-crimson-50 hover:text-crimson-600 text-charcoal-600 transition"
                        title="View Full Lead Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: System Telemetry & Administrative Audit Log (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Quick Telemetry Card */}
          <div className="liquid-glass-card rounded-3xl p-6 border border-crimson-100/70 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 flex items-center gap-2">
              <Server className="w-3.5 h-3.5 text-crimson-600" />
              Studio System Status
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-white border border-gray-100 text-xs">
                <span className="text-[10px] text-charcoal-400 font-semibold block">Prisma Database</span>
                <span className="font-extrabold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Neon PostgreSQL Active
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-white border border-gray-100 text-xs">
                <span className="text-[10px] text-charcoal-400 font-semibold block">Admin Session</span>
                <span className="font-extrabold text-crimson-700 flex items-center gap-1.5 mt-0.5">
                  <Shield className="w-3 h-3 text-crimson-600" />
                  {admin.role}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[11px] text-charcoal-500 border-t border-gray-100">
              <span>Studio: Hajipur, Bihar</span>
              <Link href="/admin/settings" className="font-bold text-crimson-600 hover:underline">
                Configure Settings →
              </Link>
            </div>
          </div>

          {/* Audit Log */}
          <div className="liquid-glass-card rounded-3xl p-6 border border-crimson-100/70 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-charcoal-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-crimson-600" />
                  Audit & Security Trail
                </h2>
                <p className="text-xs text-charcoal-500">Traceable actions recorded in Neon</p>
              </div>
            </div>

            {recentAudits.length === 0 ? (
              <p className="text-xs text-charcoal-400 py-6 text-center">No audit records yet.</p>
            ) : (
              <div className="space-y-2.5">
                {recentAudits.map((log) => (
                  <div
                    key={log.id}
                    className="text-xs p-3 rounded-xl bg-white/80 border border-gray-100 space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-crimson-700 text-[11px]">
                        {log.action}
                      </span>
                      <span className="text-[10px] text-charcoal-400 font-mono">
                        {formatDate(log.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal-600">
                      By {log.Admin?.name || log.Admin?.email || "Admin"} •{" "}
                      {log.entity || "Security"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
