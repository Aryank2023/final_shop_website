"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { formatINR } from "@/lib/utils";
import {
  Plus,
  Search,
  Upload,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Check,
  X,
  Loader2,
  Sparkles,
  ShoppingBag,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  details?: string | null;
  pricePaise: number;
  mrpPaise?: number | null;
  discountPercent?: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  categoryId: string;
  category: { id: string; name: string };
  images: { id: string; url: string; isPrimary: boolean }[];
  variants: { id?: string; name: string; sku?: string | null; priceDeltaPaise: number }[];
}

interface Category {
  id: string;
  name: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDetails, setFormDetails] = useState("");
  const [formPrice, setFormPrice] = useState(""); // in Rupees
  const [formMrp, setFormMrp] = useState(""); // in Rupees
  const [formDiscount, setFormDiscount] = useState("0");
  const [formCategory, setFormCategory] = useState("");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formVariants, setFormVariants] = useState<{ name: string; priceDelta: string }[]>([]);
  const [formPublished, setFormPublished] = useState(true);
  const [formAvailable, setFormAvailable] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch products & categories
  const fetchData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);

      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (prodData.products) setProducts(prodData.products);
      if (catData.categories) setCategories(catData.categories);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormDesc("");
    setFormDetails("");
    setFormPrice("");
    setFormMrp("");
    setFormDiscount("0");
    setFormCategory(categories[0]?.id || "");
    setFormImages([]);
    setFormVariants([]);
    setFormPublished(true);
    setFormAvailable(true);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDesc(p.description);
    setFormDetails(p.details || "");
    setFormPrice(String(Math.round(p.pricePaise / 100)));
    setFormMrp(p.mrpPaise ? String(Math.round(p.mrpPaise / 100)) : "");
    setFormDiscount(String(p.discountPercent || 0));
    setFormCategory(p.categoryId);
    setFormImages(p.images.map((img) => img.url));
    setFormVariants(
      p.variants.map((v) => ({
        name: v.name,
        priceDelta: String(Math.round(v.priceDeltaPaise / 100)),
      }))
    );
    setFormPublished(p.isPublished);
    setFormAvailable(p.isAvailable);
    setModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      setFormImages((prev) => [...prev, json.url]);
    } catch (err: any) {
      alert(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: formName,
        description: formDesc,
        details: formDetails,
        pricePaise: Math.round(Number(formPrice) * 100),
        mrpPaise: formMrp ? Math.round(Number(formMrp) * 100) : null,
        discountPercent: Number(formDiscount) || 0,
        categoryId: formCategory,
        isPublished: formPublished,
        isAvailable: formAvailable,
        images: formImages.map((url) => ({ url })),
        variants: formVariants.map((v) => ({
          name: v.name,
          priceDeltaPaise: Math.round(Number(v.priceDelta || 0) * 100),
        })),
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : "/api/admin/products";

      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setModalOpen(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 sm:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-crimson-600">
            Catalog Administration
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 mt-1">
            Products & Customized Gifts
          </h1>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Manage sublimation mugs, frames, t-shirts, prices, and photo uploads
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 liquid-glass-card rounded-2xl p-4 border border-crimson-100/70">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title or description..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white/90 border border-gray-200 rounded-xl focus:outline-none focus:border-crimson-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-charcoal-600">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-crimson-600"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-crimson-600" />
          <p className="text-xs text-charcoal-500 mt-2">Loading products from database...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center liquid-glass-card rounded-3xl p-8">
          <ShoppingBag className="w-12 h-12 text-crimson-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-charcoal-900">No products found</h3>
          <p className="text-xs text-charcoal-500 mt-1">
            Try adjusting your search filters or click "Add Product" to create one.
          </p>
        </div>
      ) : (
        <div className="liquid-glass-card rounded-3xl overflow-hidden border border-crimson-100/70 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-rose-50/50 border-b border-crimson-100 text-charcoal-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price (₹)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((prod) => {
                  const img = prod.images[0]?.url || "/logo.png";

                  return (
                    <tr key={prod.id} className="hover:bg-white/80 transition">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shrink-0 relative">
                          <img src={img} alt={prod.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-charcoal-900 line-clamp-1">{prod.name}</p>
                          <p className="text-[11px] text-charcoal-500 line-clamp-1">
                            {prod.description}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-crimson-50 text-crimson-700 font-semibold text-[10px]">
                          {prod.category?.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-charcoal-900">
                          {formatINR(prod.pricePaise)}
                        </span>
                        {prod.mrpPaise && (
                          <span className="text-[10px] text-charcoal-400 line-through ml-1.5">
                            {formatINR(prod.mrpPaise)}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            prod.isPublished
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-charcoal-500"
                          }`}
                        >
                          {prod.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-crimson-50 hover:text-crimson-600 transition"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 hover:text-red-600 transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-crimson-100">
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
              <h2 className="text-xl font-black text-charcoal-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-charcoal-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-charcoal-700 mb-1">
                  Product Name <span className="text-crimson-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Magic Color Changing Mug"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">
                    Category <span className="text-crimson-600">*</span>
                  </label>
                  <select
                    required
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">
                    Selling Price in ₹ <span className="text-crimson-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="e.g. 349"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">
                    Optional MRP in ₹ (Crossed Out)
                  </label>
                  <input
                    type="number"
                    value={formMrp}
                    onChange={(e) => setFormMrp(e.target.value)}
                    placeholder="e.g. 499"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-charcoal-700 mb-1">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(e.target.value)}
                    placeholder="30"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Catchy product summary for card..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">
                  Product Technical Specs / Dimensions
                </label>
                <input
                  type="text"
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  placeholder="e.g. 325ml | Microwave Safe | High Gloss Ceramic"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600"
                />
              </div>

              {/* Image Uploading & Preview Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-bold text-charcoal-700">Product Images</label>
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
                    Upload Photo
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-200 min-h-[70px]">
                  {formImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-300 group"
                    >
                      <img src={imgUrl} alt="Upload" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormImages(formImages.filter((_, i) => i !== idx))}
                        className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {formImages.length === 0 && (
                    <p className="text-gray-400 self-center text-[11px]">
                      No images uploaded yet. Click "Upload Photo" above.
                    </p>
                  )}
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-charcoal-800">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="rounded text-crimson-600 focus:ring-crimson-500 w-4 h-4"
                  />
                  <span>Published on Website</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-charcoal-800">
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="rounded text-crimson-600 focus:ring-crimson-500 w-4 h-4"
                  />
                  <span>Currently In Stock</span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold text-charcoal-700 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl liquid-btn-primary font-bold text-white shadow-xs disabled:opacity-60"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Save Product to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
