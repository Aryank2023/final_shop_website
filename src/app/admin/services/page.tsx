"use client";

import React, { useState, useEffect, useRef } from "react";
import { formatINR } from "@/lib/utils";
import {
  Plus,
  Trash2,
  Edit2,
  Camera,
  Loader2,
  Check,
  X,
  Upload,
  Sparkles,
  AlertCircle,
  Tag,
} from "lucide-react";

interface Service {
  id: string;
  title: string;
  category: string;
  description: string;
  startingPricePaise?: number | null;
  imageUrl?: string | null;
  featuresJson?: string | null;
  isFeatured?: boolean;
}

const SERVICE_CATEGORIES = [
  "Photography",
  "Videography & Cinema",
  "Drone Aerial Shoots",
  "Sublimation Printing",
  "Cyber Cafe & Digital",
  "Album Design & Framing",
];

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Photography");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(""); // in Rupees
  const [imageUrl, setImageUrl] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const openCreateModal = () => {
    setEditingService(null);
    setTitle("");
    setCategory("Photography");
    setDescription("");
    setPrice("");
    setImageUrl("");
    setFeatures([]);
    setFeatureInput("");
    setIsFeatured(false);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (s: Service) => {
    setEditingService(s);
    setTitle(s.title);
    setCategory(s.category);
    setDescription(s.description || "");
    setPrice(s.startingPricePaise ? String(Math.round(s.startingPricePaise / 100)) : "");
    setImageUrl(s.imageUrl || "");
    setIsFeatured(Boolean(s.isFeatured));

    try {
      const parsed = s.featuresJson ? JSON.parse(s.featuresJson) : [];
      setFeatures(Array.isArray(parsed) ? parsed : []);
    } catch {
      setFeatures([]);
    }

    setFeatureInput("");
    setError(null);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("category", "services");
      data.append("folder", "/services");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      setImageUrl(json.url);
    } catch (err: any) {
      alert(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setFeatures([...features, featureInput.trim()]);
    setFeatureInput("");
  };

  const removeFeature = (idx: number) => {
    setFeatures(features.filter((_, i) => i !== idx));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...(editingService && { id: editingService.id }),
        title,
        category,
        description,
        startingPricePaise: price ? Math.round(Number(price) * 100) : null,
        imageUrl: imageUrl || null,
        features,
        isFeatured,
      };

      const method = editingService ? "PUT" : "POST";
      const res = await fetch("/api/admin/services", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save service");

      setModalOpen(false);
      setSuccess(editingService ? "Service updated successfully!" : "New service created!");
      setTimeout(() => setSuccess(null), 3000);
      await fetchServices();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, serviceTitle: string) => {
    if (!confirm(`Permanently delete service "${serviceTitle}"?`)) return;
    try {
      const res = await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");

      setSuccess("Service deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
      await fetchServices();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
            Studio Offerings
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1">
            Studio Services & Packages
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Configure photography coverage, cinematic wedding video packages, drone shoots, and cyber services
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Add Studio Service
        </button>
      </div>

      {/* Notifications */}
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

      {/* Services Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-crimson-600" />
          <p className="text-xs text-charcoal-400 mt-2">Loading studio services...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8">
          <Camera className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-charcoal-700">No services added yet</h3>
          <p className="text-xs text-charcoal-400 mt-1">
            Add photography, drone, or printing packages to showcase on the home page.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => {
            let featuresList: string[] = [];
            try {
              if (s.featuresJson) featuresList = JSON.parse(s.featuresJson);
            } catch {
              featuresList = [];
            }

            return (
              <div
                key={s.id}
                className="liquid-glass-card rounded-2xl overflow-hidden border border-crimson-100 flex flex-col justify-between shadow-xs hover:border-crimson-300 transition"
              >
                <div>
                  {s.imageUrl ? (
                    <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                      <img src={s.imageUrl} alt={s.title} className="w-full h-full object-cover" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-xs text-charcoal-900 text-[10px] font-bold shadow-xs">
                        {s.category}
                      </span>
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-gradient-to-br from-crimson-50 to-rose-100 flex items-center justify-center relative">
                      <Camera className="w-10 h-10 text-crimson-300" />
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 text-charcoal-900 text-[10px] font-bold shadow-xs">
                        {s.category}
                      </span>
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-charcoal-900 text-sm leading-snug">{s.title}</h3>
                      {s.startingPricePaise ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-extrabold text-xs whitespace-nowrap">
                          {formatINR(s.startingPricePaise)}
                        </span>
                      ) : null}
                    </div>

                    <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
                      {s.description}
                    </p>

                    {featuresList.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        {featuresList.slice(0, 3).map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 text-[11px] text-charcoal-700">
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span className="truncate">{f}</span>
                          </div>
                        ))}
                        {featuresList.length > 3 && (
                          <span className="text-[10px] font-semibold text-crimson-700 block">
                            +{featuresList.length - 3} more highlights
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase tracking-wider">
                    {s.isFeatured ? "★ Featured" : "Standard"}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(s)}
                      className="p-2 rounded-xl bg-white border border-gray-200 text-charcoal-700 hover:bg-crimson-50 hover:text-crimson-700 hover:border-crimson-200 transition"
                      title="Edit Service"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.title)}
                      className="p-2 rounded-xl bg-white border border-gray-200 text-charcoal-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                      title="Delete Service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-crimson-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-charcoal-900">
                {editingService ? "Edit Studio Service" : "Add New Studio Service"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-charcoal-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-charcoal-700 mb-1">
                  Service Title <span className="text-crimson-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cinematic Wedding Film & Pre-Wedding Package"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 font-medium"
                  >
                    {SERVICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">
                    Starting Price in ₹ (Optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 font-medium"
                  />
                </div>
              </div>

              {/* Service Cover Photo Upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-charcoal-700">Cover Photo</label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-crimson-50 text-crimson-700 font-bold hover:bg-crimson-100 transition"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    Upload Photo from Computer
                  </button>
                </div>

                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste photo URL (https://...)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                />

                {imageUrl && (
                  <div className="mt-2.5 relative aspect-video w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive description of package deliverables, days covered, album inclusions..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 resize-none leading-relaxed"
                />
              </div>

              {/* Feature Bullet Points */}
              <div>
                <label className="block font-bold text-charcoal-700 mb-1">
                  Package Key Highlights / Inclusions
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addFeature();
                      }
                    }}
                    placeholder="e.g. 4K Drone Aerial Shoot, 2 Candid Photographers..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                  />
                  <button
                    type="button"
                    onClick={addFeature}
                    className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-charcoal-700 font-bold"
                  >
                    Add
                  </button>
                </div>

                {features.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-gray-50 border border-gray-200">
                    {features.map((f, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-charcoal-800 text-[11px]"
                      >
                        <span>{f}</span>
                        <button
                          type="button"
                          onClick={() => removeFeature(idx)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-charcoal-800">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-crimson-600 focus:ring-crimson-500 w-4 h-4"
                  />
                  <span>Feature on Homepage Spotlight</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl liquid-btn-primary font-bold text-white shadow-xs"
                >
                  {submitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </span>
                  ) : editingService ? (
                    "Save Changes"
                  ) : (
                    "Create Service"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
