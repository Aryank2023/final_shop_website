"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Layers, Loader2, Check } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchCats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/categories");
      const data = await res.json();
      if (data.categories) setCategories(data.categories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCats();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error("Failed to create");
      setName("");
      setDescription("");
      await fetchCats();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
          Catalog Architecture
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1">
          Product & Gift Categories
        </h1>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Organize products into customized mugs, frames, t-shirts, and sublimation categories
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Create form */}
        <div className="md:col-span-5 liquid-glass-card rounded-3xl p-6 border border-crimson-100">
          <h2 className="text-sm font-bold text-charcoal-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-crimson-600" />
            Add New Category
          </h2>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-charcoal-700 mb-1">Category Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Magic Mugs & Heat Cups"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 mb-1">Description (Optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short explanation of what belongs here..."
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl liquid-btn-primary font-bold text-white shadow-xs"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Create Category
            </button>
          </form>
        </div>

        {/* Existing categories list */}
        <div className="md:col-span-7 liquid-glass-card rounded-3xl p-6 border border-crimson-100">
          <h2 className="text-sm font-bold text-charcoal-900 mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-crimson-600" />
            Existing Categories ({categories.length})
          </h2>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-crimson-600" />
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl bg-white/80 border border-gray-100 flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-charcoal-900 text-xs">{c.name}</p>
                    <p className="text-[11px] text-charcoal-500 font-mono">slug: {c.slug}</p>
                    {c.description && (
                      <p className="text-[11px] text-charcoal-600 mt-0.5">{c.description}</p>
                    )}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-crimson-50 text-crimson-700">
                    {c._count?.products || 0} products
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
