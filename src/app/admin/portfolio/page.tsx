"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Film, Loader2, X, Eye } from "lucide-react";

interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  clientName?: string | null;
  videoUrl?: string | null;
  images: { id: string; url: string }[];
}

export default function AdminPortfolioPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Weddings");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/portfolio");
      const data = await res.json();
      if (data.portfolio) setProjects(data.portfolio);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          description,
          clientName,
          videoUrl,
          images: imageUrl ? [imageUrl] : [],
        }),
      });

      if (!res.ok) throw new Error("Failed to create project");
      setModalOpen(false);
      setTitle("");
      setDescription("");
      setClientName("");
      setVideoUrl("");
      setImageUrl("");
      await fetchPortfolio();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this portfolio item?")) return;
    try {
      await fetch(`/api/admin/portfolio?id=${id}`, { method: "DELETE" });
      await fetchPortfolio();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
            Visual Gallery
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1">
            Portfolio & Wedding Films
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Add wedding stories, pre-wedding couple highlights, and YouTube teaser links
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Portfolio Project
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-crimson-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => {
            const img =
              p.images[0]?.url ||
              "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80";

            return (
              <div
                key={p.id}
                className="liquid-glass-card rounded-2xl overflow-hidden border border-crimson-100 flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                    <img src={img} alt={p.title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 left-3 px-2 py-0.5 rounded-md bg-white/90 text-charcoal-900 text-[10px] font-bold">
                      {p.category}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="font-bold text-charcoal-900 text-sm">{p.title}</h3>
                    {p.clientName && (
                      <p className="text-xs text-crimson-700 font-semibold mt-0.5">
                        Client: {p.clientName}
                      </p>
                    )}
                    {p.description && (
                      <p className="text-xs text-charcoal-600 mt-1 line-clamp-2">{p.description}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-charcoal-500 font-mono text-[10px]">
                    {p.videoUrl ? "Video Linked" : "Photo Gallery"}
                  </span>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg text-charcoal-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-crimson-100">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <h2 className="text-lg font-black text-charcoal-900">Add Portfolio Showcase</h2>
              <button onClick={() => setModalOpen(false)}>
                <X className="w-5 h-5 text-charcoal-400" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Project Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Royal Bihari Wedding of Rahul & Ananya"
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
                    <option value="Weddings">Weddings</option>
                    <option value="Pre-Weddings">Pre-Weddings</option>
                    <option value="Birthdays">Birthdays</option>
                    <option value="Engagements">Engagements</option>
                    <option value="Cinematic Films">Cinematic Films</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Rahul & Ananya"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Cover Image URL</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">
                  Video URL (YouTube / Vimeo - Optional)
                </label>
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Story Summary</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Atmosphere, moments captured, wedding rituals..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 resize-none"
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
                  {submitting ? "Publishing..." : "Add to Portfolio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
