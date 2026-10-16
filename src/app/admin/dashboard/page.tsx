import React from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDate } from "@/lib/utils";
import {
  ShoppingBag,
  Film,
  MessageSquare,
  Clock,
  Plus,
  ArrowRight,
  Shield,
  CheckCircle,
  Eye,
} from "lucide-react";

export const revalidate = 0;

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  // Query live metrics
  const [
    totalProducts,
    totalPortfolio,
    newInquiries,
    pendingInquiries,
    recentInquiries,
    recentAudits,
  ] = await Promise.all([
    prisma.product.count({ where: { isPublished: true } }),
    prisma.portfolioProject.count(),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.inquiry.count({ where: { status: { in: ["NEW", "CONTACTED", "IN_PROGRESS"] } } }),
    prisma.inquiry.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.adminAuditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { adminUser: { select: { username: true, name: true } } },
    }),
  ]);

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
            Overview & Telemetry
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1">
            Studio Operations Dashboard
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Real-time catalog metrics and customer lead monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </Link>
        </div>
      </div>

      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="liquid-glass-card rounded-2xl p-5 border border-crimson-100/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              Published Products
            </span>
            <div className="p-2 rounded-xl bg-crimson-50 text-crimson-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-charcoal-900 mt-2">{totalProducts}</div>
          <p className="text-[11px] text-charcoal-500 mt-1">Live in store & catalog</p>
        </div>

        <div className="liquid-glass-card rounded-2xl p-5 border border-crimson-100/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              Portfolio Projects
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-charcoal-900 mt-2">{totalPortfolio}</div>
          <p className="text-[11px] text-charcoal-500 mt-1">Weddings & shoot stories</p>
        </div>

        <div className="liquid-glass-card rounded-2xl p-5 border border-crimson-100/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              New Customer Leads
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2">{newInquiries}</div>
          <p className="text-[11px] text-charcoal-500 mt-1">Awaiting studio call</p>
        </div>

        <div className="liquid-glass-card rounded-2xl p-5 border border-crimson-100/70">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
              Pending / In Progress
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-700 mt-2">{pendingInquiries}</div>
          <p className="text-[11px] text-charcoal-500 mt-1">Active client quotes</p>
        </div>
      </div>

      {/* Two Columns: Recent Inquiries & Activity Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Inquiries (7 cols) */}
        <div className="lg:col-span-7 liquid-glass-card rounded-3xl p-6 border border-crimson-100/70">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-charcoal-900">Recent Customer Inquiries</h2>
              <p className="text-xs text-charcoal-500">Incoming inquiries from website forms</p>
            </div>
            <Link
              href="/admin/inquiries"
              className="text-xs font-bold text-crimson-600 hover:text-crimson-800 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentInquiries.length === 0 ? (
            <p className="text-xs text-charcoal-400 py-6 text-center">No inquiries yet.</p>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="p-3.5 rounded-xl bg-white/70 border border-gray-100 flex items-center justify-between hover:border-crimson-200 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-charcoal-900">{inq.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-crimson-50 text-crimson-700">
                        {inq.inquiryType}
                      </span>
                    </div>
                    <p className="text-[11px] text-charcoal-600 truncate max-w-sm">{inq.message}</p>
                    <p className="text-[10px] text-charcoal-400 font-mono">
                      Phone: {inq.mobile} • {formatDate(inq.createdAt)}
                    </p>
                  </div>

                  <Link
                    href={`/admin/inquiries`}
                    className="p-2 rounded-lg bg-gray-50 text-charcoal-600 hover:bg-crimson-50 hover:text-crimson-600 transition"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Administrative Audit Log (5 cols) */}
        <div className="lg:col-span-5 liquid-glass-card rounded-3xl p-6 border border-crimson-100/70">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-charcoal-900">Security & Action Logs</h2>
              <p className="text-xs text-charcoal-500">Traceable administrative record</p>
            </div>
            <Shield className="w-4 h-4 text-crimson-600" />
          </div>

          {recentAudits.length === 0 ? (
            <p className="text-xs text-charcoal-400 py-6 text-center">No audit records yet.</p>
          ) : (
            <div className="space-y-3">
              {recentAudits.map((log) => (
                <div key={log.id} className="text-xs p-3 rounded-xl bg-white/70 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-crimson-700">{log.action}</span>
                    <span className="text-[10px] text-charcoal-400">{formatDate(log.createdAt)}</span>
                  </div>
                  <p className="text-[11px] text-charcoal-600 mt-1">
                    By {log.adminUser?.name || log.adminUser?.username || "System"} • {log.entityType || "Auth"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
