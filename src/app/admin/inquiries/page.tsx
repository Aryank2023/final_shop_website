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

  const handleSaveNotes = async () => {
    if (!selectedInquiry) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/inquiries/${selectedInquiry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, internalNotes: notes }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSelectedInquiry(null);
      await fetchInquiries();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Permanently delete inquiry from ${name}?`)) return;
    try {
      await fetch(`/api/admin/inquiries/${id}`, { method: "DELETE" });
      await fetchInquiries();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
          Customer Relations
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1">
          Customer Inquiries & Leads
        </h1>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Review submissions, set contact status, and attach private internal notes
        </p>
      </div>

      {/* Filter status tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 liquid-glass-card rounded-2xl p-4 border border-crimson-100/70">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { label: "All Leads", val: "ALL", count: counts.all },
            { label: "New", val: "NEW", count: counts.new },
            { label: "Contacted", val: "CONTACTED", count: counts.contacted },
            { label: "Resolved", val: "RESOLVED", count: counts.resolved },
          ].map((tab) => (
            <button
              key={tab.val}
              onClick={() => setStatusFilter(tab.val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                statusFilter === tab.val
                  ? "bg-crimson-600 text-white shadow-xs"
                  : "bg-white text-charcoal-700 hover:bg-crimson-50 border border-gray-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/10">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-crimson-600"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-crimson-600" />
        </div>
      ) : inquiries.length === 0 ? (
        <div className="py-16 text-center liquid-glass-card rounded-3xl p-8">
          <MessageSquare className="w-12 h-12 text-crimson-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-charcoal-900">No inquiries in this category</h3>
        </div>
      ) : (
        <div className="liquid-glass-card rounded-3xl overflow-hidden border border-crimson-100/70 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-rose-50/50 border-b border-crimson-100 text-charcoal-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Inquiry Type</th>
                  <th className="py-3.5 px-4">Message</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inquiries.map((inq) => (
                  <tr key={inq.id} className="hover:bg-white/80 transition">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-charcoal-900">{inq.name}</p>
                      <p className="text-[10px] text-charcoal-400">{formatDate(inq.createdAt)}</p>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <a
                        href={`tel:${inq.mobile}`}
                        className="font-bold text-crimson-700 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {inq.mobile}
                      </a>
                      {inq.email && <p className="text-[10px] text-charcoal-500">{inq.email}</p>}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-crimson-50 text-crimson-800 font-semibold text-[10px]">
                        {inq.inquiryType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs truncate text-charcoal-600">
                      {inq.message}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inq.status === "NEW"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : inq.status === "CONTACTED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : inq.status === "RESOLVED"
                            ? "bg-gray-100 text-charcoal-700"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {inq.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openInquiryModal(inq)}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-crimson-50 hover:text-crimson-600 font-semibold text-[11px] transition"
                      >
                        View & Notes
                      </button>

                      <button
                        onClick={() => handleDelete(inq.id, inq.name)}
                        className="p-1 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inquiry Detail / Notes Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-crimson-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h2 className="text-lg font-black text-charcoal-900">Inquiry Details</h2>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-charcoal-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <div className="flex justify-between">
                  <span className="font-bold text-charcoal-900 text-sm">
                    {selectedInquiry.name}
                  </span>
                  <span className="font-mono text-charcoal-500">
                    {formatDate(selectedInquiry.createdAt)}
                  </span>
                </div>
                <p className="font-mono font-bold text-crimson-700">Phone: {selectedInquiry.mobile}</p>
                {selectedInquiry.email && (
                  <p className="text-charcoal-600">Email: {selectedInquiry.email}</p>
                )}
                <p className="text-crimson-800 font-semibold mt-1">
                  Interest: {selectedInquiry.inquiryType}
                </p>
              </div>

              <div>
                <label className="font-bold text-charcoal-700 block mb-1">Customer Message:</label>
                <div className="p-3 rounded-xl bg-rose-50/40 border border-crimson-100 text-charcoal-800 whitespace-pre-wrap leading-relaxed">
                  {selectedInquiry.message}
                </div>
              </div>

              <div>
                <label className="font-bold text-charcoal-700 block mb-1">Update Status:</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600"
                >
                  <option value="NEW">NEW</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-charcoal-700 block mb-1">
                  Private Studio Internal Notes:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Called client on 14th Oct. Quoted ₹30,000 for wedding on 12th Dec. Follow up next Monday."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-bold text-charcoal-600"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="px-5 py-2 rounded-xl liquid-btn-primary font-bold text-white shadow-xs"
                >
                  {saving ? "Saving..." : "Save Status & Notes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
