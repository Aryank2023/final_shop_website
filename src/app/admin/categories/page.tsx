"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Layers,
  Loader2,
  Check,
  X,
  AlertCircle,
  Tag,
  ShoppingBag,
} from "lucide-react";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit Category state
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [updating, setUpdating] = useState(false);

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
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create category");

      setName("");
      setDescription("");
      setSuccess("Category created successfully!");
      setTimeout(() => setSuccess(null), 3000);
      await fetchCats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditDescription(cat.description || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setUpdating(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editName,
          description: editDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update category");

      setEditingCategory(null);
      setSuccess("Category updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      await fetchCats();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    const count = cat._count?.products || 0;
    if (count > 0) {
      alert(`Cannot delete "${cat.name}" because it contains ${count} product(s). Please reassign or delete those products first.`);
      return;
    }

    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/categories?id=${cat.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");

      setSuccess("Category deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
      await fetchCats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="p-6 sm:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
          Catalog Architecture
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1">
          Product & Gift Categories
        </h1>
        <p className="text-xs text-charcoal-500 mt-0.5">
          Organize customized mugs, premium frames, t-shirts, and sublimation gift collections
        </p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Create Form */}
        <div className="md:col-span-5 liquid-glass-card rounded-3xl p-6 border border-crimson-100/80 shadow-xs">
          <h2 className="text-sm font-bold text-charcoal-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-crimson-600" />
            Add New Category
          </h2>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-charcoal-700 mb-1">
                Category Name <span className="text-crimson-600">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Magic Color Changing Mugs"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 transition"
              />
            </div>

            <div>
              <label className="block font-bold text-charcoal-700 mb-1">Description (Optional)</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief explanation of items in this category..."
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 resize-none transition"
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

        {/* Existing Categories List */}
        <div className="md:col-span-7 liquid-glass-card rounded-3xl p-6 border border-crimson-100/80 shadow-xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-charcoal-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-crimson-600" />
              Existing Categories ({categories.length})
            </h2>
            <span className="text-[11px] text-charcoal-400">Total catalog groups</span>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-crimson-600" />
              <p className="text-xs text-charcoal-400 mt-2">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="py-12 text-center text-charcoal-400 text-xs">
              No categories found. Create your first category on the left.
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((c) => {
                const productCount = c._count?.products || 0;

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-white/90 border border-gray-100/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-crimson-200 transition shadow-xs"
                  >
                    <div className="space-y-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5 text-crimson-600 shrink-0" />
                        <p className="font-bold text-charcoal-900 text-sm">{c.name}</p>
                      </div>
                      <p className="text-[11px] text-charcoal-400 font-mono">slug: {c.slug}</p>
                      {c.description && (
                        <p className="text-xs text-charcoal-600 leading-relaxed">{c.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-crimson-50 text-crimson-700">
                        <ShoppingBag className="w-3 h-3" />
                        {productCount} {productCount === 1 ? "product" : "products"}
                      </span>

                      <button
                        onClick={() => openEdit(c)}
                        className="p-2 rounded-xl bg-gray-50 hover:bg-crimson-50 hover:text-crimson-600 text-charcoal-600 transition"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(c)}
                        className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-600 text-charcoal-500 transition"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-crimson-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <h3 className="text-base font-black text-charcoal-900">Edit Category</h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-charcoal-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:border-crimson-600 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-5 py-2 rounded-xl liquid-btn-primary font-bold text-white shadow-xs"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
