"use client";

import React, { useState, useEffect } from "react";
import { formatINR } from "@/lib/utils";
import { Plus, Trash2, Camera, Loader2, Check, X } from "lucide-react";

interface Service {
  id: string;
  title: string;
  category: string;
  description: string;
  startingPricePaise?: number | null;
  imageUrl?: string | null;
  featuresJson?: string | null;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Photography");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (data.services) setServices(data.services);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          description,
          startingPricePaise: price ? Number(price) * 100 : null,
          imageUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to create service");
      setModalOpen(false);
      setTitle("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      await fetchServices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
      await fetchServices();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
            Studio Capabilities
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1">
            Photography, Cinema & Cyber Cafe Services
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Manage packages, starting fees, and descriptions for photography and online services
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-crimson-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.id}
              className="liquid-glass-card rounded-2xl p-5 border border-crimson-100 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-crimson-50 text-crimson-700">
                    {s.category}
                  </span>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="p-1 rounded text-charcoal-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-base font-bold text-charcoal-900">{s.title}</h3>
                <p className="text-xs text-charcoal-600 mt-1 line-clamp-3 leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-charcoal-500 font-medium">Starting Fee:</span>
                <span className="font-black text-crimson-700">
                  {s.startingPricePaise ? formatINR(s.startingPricePaise) : "Custom Quote"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-crimson-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <h2 className="text-lg font-black text-charcoal-900">Add Service Offering</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-charcoal-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Service Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Pre-Wedding Drone Cinematography"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                  >
                    <option value="Photography">Photography</option>
                    <option value="Videography">Videography</option>
                    <option value="CyberCafe">Cyber Cafe</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Starting Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Service highlights, gear used, or deliverables..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Cover Image URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                />
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl liquid-btn-primary font-bold text-white shadow-xs"
                >
                  {submitting ? "Saving..." : "Create Service"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
