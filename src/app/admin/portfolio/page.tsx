"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Film,
  Loader2,
  X,
  Eye,
  Upload,
  Video,
  Check,
  Search,
  ExternalLink,
  AlertCircle,
  Calendar,
} from "lucide-react";

interface PortfolioProject {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  clientName?: string | null;
  videoUrl?: string | null;
  images: { id: string; url: string }[];
  createdAt?: string;
}

const CATEGORIES = [
  "Weddings",
  "Pre-Weddings",
  "Cinematic Films",
  "Birthdays & Anniversaries",
  "Engagements & Rings",
  "Drone Aerial Shoots",
];

export default function AdminPortfolioPage() {
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Weddings");
  const [description, setDescription] = useState("");
  const [clientName, setClientName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageKey, setImageKey] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

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

  const openCreateModal = () => {
    setEditingProject(null);
    setTitle("");
    setCategory("Weddings");
    setDescription("");
    setClientName("");
    setVideoUrl("");
    setVideoKey(null);
    setImageUrl("");
    setImageKey(null);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: PortfolioProject) => {
    setEditingProject(p);
    setTitle(p.title);
    setCategory(p.category || "Weddings");
    setDescription(p.description || "");
    setClientName(p.clientName || "");
    setVideoUrl(p.videoUrl || "");
    setVideoKey((p as any).videoKey || null);
    setImageUrl(p.images[0]?.url || "");
    setImageKey((p.images[0] as any)?.key || null);
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
      data.append("category", "portfolio");

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      setImageUrl(json.url);
      setImageKey(json.key || null);
    } catch (err: any) {
      alert(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["video/mp4", "video/webm", "video/quicktime"];
    if (!allowed.includes(file.type.toLowerCase())) {
      alert("Please select a valid video format (MP4, WebM, or MOV).");
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      alert("Video file size cannot exceed 500 MB.");
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }

    setUploadingVideo(true);
    setVideoProgress(0);

    try {
      // Request presigned URL from server
      const presignRes = await fetch("/api/admin/storage/presigned", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          category: "portfolio-video",
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || "Failed to initiate video upload");
      }

      // Direct client-to-R2 upload with progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", presignData.uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setVideoProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during video upload"));
        xhr.send(file);
      });

      setVideoUrl(presignData.publicUrl);
      setVideoKey(presignData.key);
      setSuccess("Video uploaded successfully to Cloudflare R2!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to upload video to Cloudflare R2");
    } finally {
      setUploadingVideo(false);
      setVideoProgress(null);
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...(editingProject && { id: editingProject.id }),
        title,
        category,
        description,
        clientName,
        videoUrl,
        videoKey,
        images: imageUrl ? [{ url: imageUrl, key: imageKey }] : [],
      };

      const method = editingProject ? "PUT" : "POST";
      const res = await fetch("/api/admin/portfolio", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save portfolio story");

      setModalOpen(false);
      setSuccess(editingProject ? "Portfolio story updated!" : "New story published!");
      setTimeout(() => setSuccess(null), 3000);
      await fetchPortfolio();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!confirm(`Permanently delete "${itemTitle}" from portfolio?`)) return;
    try {
      const res = await fetch(`/api/admin/portfolio?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      setSuccess("Story removed from portfolio.");
      setTimeout(() => setSuccess(null), 3000);
      await fetchPortfolio();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.clientName && p.clientName.toLowerCase().includes(search.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchesTab = activeTab === "ALL" || p.category.toLowerCase() === activeTab.toLowerCase();
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
            Visual Storytelling
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1">
            Portfolio & Wedding Films
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Manage real wedding coverage, couple highlights, teasers, and cinematic film showcases
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Add Portfolio Story
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

      {/* Filter and Search Bar */}
      <div className="liquid-glass-card rounded-2xl p-4 border border-crimson-100/70 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search stories, couples, or rituals..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600 bg-white"
          />
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === "ALL"
                ? "bg-crimson-600 text-white shadow-xs"
                : "bg-white text-charcoal-600 hover:bg-crimson-50 border border-gray-200"
            }`}
          >
            All ({projects.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = projects.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeTab === cat
                    ? "bg-crimson-600 text-white shadow-xs"
                    : "bg-white text-charcoal-600 hover:bg-crimson-50 border border-gray-200"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-crimson-600" />
          <p className="text-xs text-charcoal-400 mt-2">Loading gallery stories...</p>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 p-8">
          <Film className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-charcoal-700">No portfolio stories found</h3>
          <p className="text-xs text-charcoal-400 mt-1">
            {search ? "No stories matched your search term." : "Start by adding your first wedding story."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((p) => {
            const img =
              p.images[0]?.url ||
              "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80";

            return (
              <div
                key={p.id}
                className="liquid-glass-card rounded-2xl overflow-hidden border border-crimson-100 flex flex-col justify-between shadow-xs hover:border-crimson-300 transition group"
              >
                <div>
                  <div className="relative aspect-video w-full bg-gray-100 overflow-hidden">
                    <img
                      src={img}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-xs text-charcoal-900 text-[10px] font-bold shadow-xs">
                      {p.category}
                    </span>

                    {p.videoUrl && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-md bg-crimson-600/90 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <Video className="w-3 h-3" />
                        Film
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-charcoal-900 text-sm leading-snug">{p.title}</h3>
                    {p.clientName && (
                      <p className="text-xs text-crimson-700 font-semibold flex items-center gap-1.5">
                        <span>Couple / Client:</span>
                        <span className="font-bold text-charcoal-800">{p.clientName}</span>
                      </p>
                    )}
                    {p.description && (
                      <p className="text-xs text-charcoal-600 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {p.videoUrl && (
                      <a
                        href={p.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-crimson-600 hover:text-crimson-800"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Watch Video
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-2 rounded-xl bg-white border border-gray-200 text-charcoal-700 hover:bg-crimson-50 hover:text-crimson-700 hover:border-crimson-200 transition"
                      title="Edit Story"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="p-2 rounded-xl bg-white border border-gray-200 text-charcoal-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
                      title="Delete Story"
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

      {/* Add / Edit Portfolio Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-crimson-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-gray-100">
              <h2 className="text-lg font-black text-charcoal-900">
                {editingProject ? "Edit Portfolio Story" : "Add Portfolio Project"}
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
                  Project / Wedding Title <span className="text-crimson-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Royal Rajputana Wedding at Hajipur"
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
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">Client / Couple Name</label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Rahul & Ananya"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 font-medium"
                  />
                </div>
              </div>

              {/* Cover Image Upload & Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-charcoal-700">
                    Cover Photo <span className="text-crimson-600">*</span>
                  </label>
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

                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Or paste image URL (https://...)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                  />
                </div>

                {imageUrl && (
                  <div className="mt-2.5 relative aspect-video w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-charcoal-700">
                    Video Film (Cloudflare R2 or YouTube / Vimeo - Optional)
                  </label>
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoUpload}
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploadingVideo}
                    onClick={() => videoInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-50 text-rose-700 font-bold hover:bg-rose-100 transition"
                  >
                    {uploadingVideo ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {videoProgress !== null ? `${videoProgress}%` : "Uploading..."}
                      </span>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        Upload Video (MP4/WebM)
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Video className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" />
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://... or click Upload Video above"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                  />
                </div>
                {videoUrl && (/\.(mp4|webm|mov)(\?.*)?$/i.test(videoUrl) || videoKey) && (
                  <div className="mt-2.5 rounded-xl overflow-hidden border border-gray-200 bg-black aspect-video max-h-48">
                    <video controls className="w-full h-full object-contain" src={videoUrl} />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Story Summary</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Atmosphere, moments captured, wedding rituals, camera gear used..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 resize-none leading-relaxed"
                />
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
                  ) : editingProject ? (
                    "Save Changes"
                  ) : (
                    "Publish Story"
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
