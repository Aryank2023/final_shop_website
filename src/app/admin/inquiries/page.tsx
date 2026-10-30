"use client";

import React, { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import {
  MessageSquare,
  Search,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  Trash2,
  Edit3,
  Loader2,
  X,
  ExternalLink,
  MessageCircle,
  Check,
  Calendar,
  AlertCircle,
  Filter,
  User,
} from "lucide-react";

interface Inquiry {
  id: string;
  name: string;
  email?: string | null;
  mobile: string;
  inquiryType: string;
  subject?: string | null;
  message: string;
  status: string;
  internalNotes?: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  NEW: { label: "New Lead", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  CONTACTED: { label: "Contacted", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
  IN_PROGRESS: { label: "In Progress", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  RESOLVED: { label: "Confirmed / Booked", bg: "bg-purple-50 border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  CANCELLED: { label: "Closed / Cancelled", bg: "bg-gray-100 border-gray-200", text: "text-gray-600", dot: "bg-gray-400" },
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [counts, setCounts] = useState({ all: 0, new: 0, contacted: 0, resolved: 0 });
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Selected Inquiry Modal
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [notes, setNotes] = useState("");
  const [editStatus, setEditStatus] = useState("NEW");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const url = `/api/admin/inquiries?status=${statusFilter}&q=${encodeURIComponent(search)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.inquiries) setInquiries(data.inquiries);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, search]);

  const openInquiryModal = (inq: Inquiry) => {
    setSelectedInquiry(inq);
    setNotes(inq.internalNotes || "");
    setEditStatus(inq.status);
  };

  const handleQuickStatusChange = async (inq: Inquiry, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/inquiries/${inq.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
      await fetchInquiries();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${selectedInquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, internalNotes: notes }),
      });
      if (!res.ok) throw new Error("Failed to save follow-up details");

      setSuccess("Inquiry status & follow-up notes updated!");
      setTimeout(() => setSuccess(null), 3000);
      setSelectedInquiry(null);
      await fetchInquiries();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete inquiry from "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setSuccess("Inquiry record deleted.");
      setTimeout(() => setSuccess(null), 3000);
      await fetchInquiries();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const getCleanMobile = (mob: string) => {
    return mob.replace(/[^0-9]/g, "");
  };

  const getWhatsAppUrl = (inq: Inquiry) => {
    const cleanMob = getCleanMobile(inq.mobile);
    const formattedMob = cleanMob.length === 10 ? `91${cleanMob}` : cleanMob;
    const msg = `Hello ${inq.name}, thank you for contacting MAA VAISHNO VIDEO FILM'S Hajipur regarding your inquiry for ${inq.inquiryType}. How can we assist you with your dates and photography requirements?`;
    return `https://wa.me/${formattedMob}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
            Lead CRM & Customer Inquiries
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1">
            Customer Inquiries & Quotes
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Incoming booking requests, wedding quotes, customized gift orders, and direct client follow-ups
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
            {counts.new} New Awaiting Action
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Controls Bar: Search & Status Filters */}
      <div className="liquid-glass-card rounded-2xl p-4 border border-crimson-100/70 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by client name, mobile, or message..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600 bg-white"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: "ALL", label: "All Inquiries" },
            { id: "NEW", label: "New Leads" },
            { id: "CONTACTED", label: "Contacted" },
            { id: "IN_PROGRESS", label: "In Progress" },
            { id: "RESOLVED", label: "Booked" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? "bg-crimson-600 text-white shadow-xs"
                  : "bg-white text-charcoal-600 hover:bg-crimson-50 border border-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inquiries List */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-crimson-600" />
          <p className="text-xs text-charcoal-400 mt-2">Loading inquiries...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8">
          <MessageSquare className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-charcoal-700">No inquiries found</h3>
          <p className="text-xs text-charcoal-400 mt-1">
            {search ? "No leads matched your search criteria." : "All leads have been processed."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inq) => {
            const statusStyle = STATUS_CONFIG[inq.status] || STATUS_CONFIG.NEW;
            const cleanMob = getCleanMobile(inq.mobile);

            return (
              <div
                key={inq.id}
                className="liquid-glass-card rounded-2xl p-5 border border-crimson-100/70 hover:border-crimson-300 transition shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Left: Lead Details */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-crimson-100 text-crimson-700 flex items-center justify-center font-bold text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-extrabold text-charcoal-900 text-sm">{inq.name}</span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-crimson-50 text-crimson-700 border border-crimson-100">
                      {inq.inquiryType}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusStyle.bg} ${statusStyle.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {statusStyle.label}
                    </span>

                    <span className="text-[11px] text-charcoal-400 font-mono ml-auto lg:ml-0">
                      {formatDate(inq.createdAt)}
                    </span>
                  </div>

                  {/* Message Body */}
                  <p className="text-xs text-charcoal-700 bg-white/70 p-3 rounded-xl border border-gray-100 leading-relaxed font-sans">
                    {inq.message}
                  </p>

                  {/* Contact info strip */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-600 font-mono">
                    <span className="flex items-center gap-1.5 font-bold text-charcoal-900">
                      <Phone className="w-3.5 h-3.5 text-crimson-600" />
                      {inq.mobile}
                    </span>

                    {inq.email && (
                      <span className="flex items-center gap-1.5 text-charcoal-500 font-sans">
                        <Mail className="w-3.5 h-3.5 text-charcoal-400" />
                        {inq.email}
                      </span>
                    )}

                    {inq.internalNotes && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-700 font-sans bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                        <Edit3 className="w-3 h-3" />
                        Notes: {inq.internalNotes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Quick Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                  {/* WhatsApp Quick Message */}
                  <a
                    href={getWhatsAppUrl(inq)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                    title="Send WhatsApp message"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>

                  {/* Phone Call */}
                  <a
                    href={`tel:${cleanMob}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-charcoal-800 font-bold text-xs transition"
                    title="Call directly"
                  >
                    <Phone className="w-3.5 h-3.5 text-charcoal-600" />
                    Call
                  </a>

                  {/* Open Notes & Full Details Modal */}
                  <button
                    onClick={() => openInquiryModal(inq)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-crimson-50 hover:border-crimson-200 hover:text-crimson-700 font-bold text-xs text-charcoal-700 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Status & Notes
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(inq.id, inq.name)}
                    className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 text-charcoal-400 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Status & Follow-up Notes */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-crimson-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-charcoal-900">
                  Lead Follow-up: {selectedInquiry.name}
                </h3>
                <p className="text-xs text-charcoal-500 font-mono">
                  {selectedInquiry.mobile} • {selectedInquiry.inquiryType}
                </p>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-charcoal-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-charcoal-700 mb-1">
                  Customer Message Inquiry
                </label>
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-charcoal-700 leading-relaxed font-sans max-h-32 overflow-y-auto">
                  {selectedInquiry.message}
                </div>
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Lead Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 font-bold"
                >
                  <option value="NEW">🟢 New Lead (Awaiting Studio Call)</option>
                  <option value="CONTACTED">🔵 Contacted (Quote Sent / Discussion In Progress)</option>
                  <option value="IN_PROGRESS">🟡 In Progress (Dates Finalizing / Samples Shown)</option>
                  <option value="RESOLVED">🟣 Confirmed / Booked (Advance Paid / Order Active)</option>
                  <option value="CANCELLED">⚪ Closed / Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">
                  Internal Studio Notes & Quote Record
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record quote amounts given, wedding event dates, advance payment details, or special requests..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 resize-none font-sans"
                />
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-gray-100">
                <a
                  href={getWhatsAppUrl(selectedInquiry)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-700 font-bold hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Open WhatsApp
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedInquiry(null)}
                    className="px-4 py-2 rounded-xl border border-gray-200 font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSaveNotes}
                    className="px-5 py-2 rounded-xl liquid-btn-primary font-bold text-white shadow-xs"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
