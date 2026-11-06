"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
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
  ExternalLink,
  PackageCheck,
  PackageX,
  AlertCircle,
  Tag,
  Star,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";

interface ProductImageItem {
  id?: string;
  url: string;
  key?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  details?: string | null;
  price?: number;
  pricePaise?: number;
  mrpPaise?: number | null;
  discountPercent?: number | null;
  available?: boolean;
  isAvailable?: boolean;
  featured?: boolean;
  isFeatured?: boolean;
  status?: string;
  isPublished?: boolean;
  stock?: number;
  categoryId: string;
  category: { id: string; name: string; slug?: string };
  images: any[];
  variants?: { id?: string; name: string; sku?: string | null; priceDeltaPaise: number }[];
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
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDetails, setFormDetails] = useState("");
  const [formPrice, setFormPrice] = useState(""); // in Rupees
  const [formMrp, setFormMrp] = useState(""); // in Rupees
  const [formDiscount, setFormDiscount] = useState("0");
  const [formCategory, setFormCategory] = useState("");
  const [formImages, setFormImages] = useState<ProductImageItem[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState("");
  const [formVariants, setFormVariants] = useState<{ name: string; priceDelta: string }[]>([]);
  const [variantNameInput, setVariantNameInput] = useState("");
  const [variantDeltaInput, setVariantDeltaInput] = useState("");
  const [formPublished, setFormPublished] = useState(true);
  const [formAvailable, setFormAvailable] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);

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
      if (catData.categories) {
        setCategories(catData.categories);
        if (!formCategory && catData.categories.length > 0) {
          setFormCategory(catData.categories[0].id);
        }
      }
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
    setManualImageUrl("");
    setFormVariants([]);
    setVariantNameInput("");
    setVariantDeltaInput("");
    setFormPublished(true);
    setFormAvailable(true);
    setFormFeatured(false);
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDesc(p.description);
    setFormDetails(p.details || "");
    const numPrice = p.price !== undefined ? Math.round(Number(p.price)) : Math.round((p.pricePaise || 0) / 100);
    setFormPrice(String(numPrice));
    const numMrp = p.mrpPaise ? Math.round(p.mrpPaise / 100) : (p as any).mrp ? Math.round(Number((p as any).mrp)) : null;
    setFormMrp(numMrp ? String(numMrp) : "");
    const computedDiscount = p.discountPercent !== undefined && p.discountPercent !== null
      ? p.discountPercent
      : numMrp && numMrp > numPrice
      ? Math.round(((numMrp - numPrice) / numMrp) * 100)
      : 0;
    setFormDiscount(String(computedDiscount));
    setFormCategory(p.categoryId);

    // Map existing images whether string[] or object[]
    const rawImgs = Array.isArray(p.images) ? p.images : [];
    const mappedImages: ProductImageItem[] = rawImgs.map((img: any, idx: number) => {
      const url = typeof img === "string" ? img : img?.url || "";
      const isPrimary = typeof img === "object" && typeof img.isPrimary === "boolean" ? img.isPrimary : idx === 0;
      return {
        url,
        isPrimary,
        sortOrder: idx,
      };
    });

    if (mappedImages.length > 0 && !mappedImages.some((i) => i.isPrimary)) {
      mappedImages[0].isPrimary = true;
    }

    setFormImages(mappedImages);
    setManualImageUrl("");
    setFormVariants(
      (p.variants || []).map((v) => ({
        name: v.name,
        priceDelta: String(Math.round((v.priceDeltaPaise || 0) / 100)),
      }))
    );
    setVariantNameInput("");
    setVariantDeltaInput("");
    setFormPublished(p.status === "PUBLISHED" || p.isPublished === true);
    setFormAvailable(p.available !== false && p.isAvailable !== false);
    setFormFeatured(Boolean(p.featured || p.isFeatured));
    setError(null);
    setModalOpen(true);
  };

  // Multiple File Upload from computer
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    // Validate size and formats
    for (const f of files) {
      if (!ALLOWED.includes(f.type)) {
        alert(`"${f.name}" is not an accepted format. Only JPG, PNG, WEBP, and GIF are allowed.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        alert(`"${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)}MB) exceeds 5MB limit.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    setUploadingImage(true);
    setUploadProgressText(`Uploading ${files.length} image(s)...`);

    try {
      const data = new FormData();
      files.forEach((file) => {
        data.append("files", file);
      });

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: data,
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");

      const newUrls: string[] = json.urls || (json.url ? [json.url] : []);
      const newFiles: any[] = json.files || [];

      setFormImages((prev) => {
        const startIndex = prev.length;
        const newItems: ProductImageItem[] = newUrls.map((url, i) => ({
          url,
          key: newFiles[i]?.key || null,
          isPrimary: startIndex === 0 && i === 0, // First uploaded image becomes primary if none existed
          sortOrder: startIndex + i,
        }));

        const updated = [...prev, ...newItems];
        // Ensure at least one primary
        if (updated.length > 0 && !updated.some((item) => item.isPrimary)) {
          updated[0].isPrimary = true;
        }
        return updated;
      });

      setSuccess(`Successfully uploaded ${newUrls.length} photo(s)!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      alert(err.message || "Failed to upload images");
    } finally {
      setUploadingImage(false);
      setUploadProgressText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Add manual image URL
  const handleAddManualImage = () => {
    const trimmed = manualImageUrl.trim();
    if (!trimmed) return;

    setFormImages((prev) => {
      const isFirst = prev.length === 0;
      const updated = [
        ...prev,
        {
          url: trimmed,
          isPrimary: isFirst,
          sortOrder: prev.length,
        },
      ];
      return updated;
    });
    setManualImageUrl("");
  };

  // Remove image
  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages((prev) => {
      const wasPrimary = prev[indexToRemove]?.isPrimary;
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);

      // Re-assign primary if the removed image was primary
      if (wasPrimary && filtered.length > 0) {
        filtered[0].isPrimary = true;
      }

      // Reindex sort orders
      return filtered.map((item, idx) => ({ ...item, sortOrder: idx }));
    });
  };

  // Set as Primary Image
  const handleSetPrimary = (indexToPrimary: number) => {
    setFormImages((prev) =>
      prev.map((item, idx) => ({
        ...item,
        isPrimary: idx === indexToPrimary,
      }))
    );
  };

  // Reorder Images (Move Left / Right)
  const handleMoveImage = (index: number, direction: "left" | "right") => {
    setFormImages((prev) => {
      const targetIndex = direction === "left" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const newArr = [...prev];
      const temp = newArr[index];
      newArr[index] = newArr[targetIndex];
      newArr[targetIndex] = temp;

      return newArr.map((item, idx) => ({ ...item, sortOrder: idx }));
    });
  };

  // Add Variant
  const handleAddVariant = () => {
    if (!variantNameInput.trim()) return;
    setFormVariants((prev) => [
      ...prev,
      {
        name: variantNameInput.trim(),
        priceDelta: variantDeltaInput ? String(Number(variantDeltaInput)) : "0",
      },
    ]);
    setVariantNameInput("");
    setVariantDeltaInput("");
  };

  const handleRemoveVariant = (idx: number) => {
    setFormVariants((prev) => prev.filter((_, i) => i !== idx));
  };

  // Quick Toggles
  const handleTogglePublished = async (p: Product) => {
    const currentPub = p.status === "PUBLISHED" || p.isPublished === true;
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublished: !currentPub, status: !currentPub ? "PUBLISHED" : "DRAFT" }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setProducts((prev) =>
        prev.map((item) =>
          item.id === p.id
            ? { ...item, isPublished: !currentPub, status: !currentPub ? "PUBLISHED" : "DRAFT" }
            : item
        )
      );
      setSuccess(`"${p.name}" is now ${!currentPub ? "Published (Live)" : "Draft (Hidden)"}`);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleAvailable = async (p: Product) => {
    const currentAvail = p.available !== false && p.isAvailable !== false;
    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: !currentAvail, available: !currentAvail }),
      });
      if (!res.ok) throw new Error("Failed to update stock");

      setProducts((prev) =>
        prev.map((item) =>
          item.id === p.id
            ? { ...item, isAvailable: !currentAvail, available: !currentAvail }
            : item
        )
      );
      setSuccess(`"${p.name}" marked ${!currentAvail ? "In Stock" : "Sold Out"}`);
      setTimeout(() => setSuccess(null), 2500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Save Product (Create or Edit)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!formPrice || Number(formPrice) <= 0) {
      setError("Selling price must be greater than 0");
      setSubmitting(false);
      return;
    }

    if (formMrp && Number(formMrp) < Number(formPrice)) {
      setError("MRP cannot be less than selling price");
      setSubmitting(false);
      return;
    }

    if (formImages.length === 0) {
      if (!confirm("No images attached to this product. Are you sure you want to save without photos?")) {
        setSubmitting(false);
        return;
      }
    }

    try {
      const sellingPrice = Number(formPrice);
      const mrpVal = formMrp && Number(formMrp) > 0 ? Number(formMrp) : null;
      let discountVal = 0;
      if (formDiscount !== "" && !isNaN(Number(formDiscount))) {
        discountVal = Math.max(0, Math.min(99, Math.round(Number(formDiscount))));
      } else if (mrpVal && mrpVal > sellingPrice) {
        discountVal = Math.round(((mrpVal - sellingPrice) / mrpVal) * 100);
      }

      const payload = {
        name: formName,
        description: formDesc,
        details: formDetails,
        price: sellingPrice,
        pricePaise: Math.round(sellingPrice * 100),
        mrp: mrpVal,
        mrpPaise: mrpVal ? Math.round(mrpVal * 100) : null,
        discountPercent: discountVal,
        categoryId: formCategory,
        status: formPublished ? "PUBLISHED" : "DRAFT",
        isPublished: formPublished,
        available: formAvailable,
        isAvailable: formAvailable,
        featured: formFeatured,
        isFeatured: formFeatured,
        images: formImages.map((img) => img.url),
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
      if (!res.ok) throw new Error(data.error || "Failed to save product");

      setModalOpen(false);
      setSuccess(
        editingProduct ? "Product & photos updated successfully!" : "New product published successfully!"
      );
      setTimeout(() => setSuccess(null), 3000);
      await fetchData();
    } catch (err: any) {
      setError(err.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This will also remove its associated images.`)) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setSuccess(`Deleted product "${name}"`);
      setTimeout(() => setSuccess(null), 3000);
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
            Manage sublimation magic mugs, custom photo frames, t-shirts, stock availability, and image galleries
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl liquid-btn-primary text-xs font-bold text-white shadow-xs self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Notifications */}
      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 liquid-glass-card rounded-2xl p-4 border border-crimson-100/70 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title or description..."
            className="w-full pl-10 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-crimson-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-charcoal-600">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-crimson-600 font-medium"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categories.map((c) => {
              const count = products.filter((p) => p.categoryId === c.id).length;
              return (
                <option key={c.id} value={c.id}>
                  {c.name} ({count})
                </option>
              );
            })}
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
        <div className="py-16 text-center liquid-glass-card rounded-3xl p-8 border border-gray-200">
          <ShoppingBag className="w-12 h-12 text-crimson-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-charcoal-900">No products found</h3>
          <p className="text-xs text-charcoal-500 mt-1">
            Try adjusting your search filters or click "Add Product" to create one.
          </p>
        </div>
      ) : (
        <div className="liquid-glass-card rounded-3xl overflow-hidden border border-crimson-100/70 shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-rose-50/50 border-b border-crimson-100 text-charcoal-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price (₹)</th>
                  <th className="py-3.5 px-4">Images</th>
                  <th className="py-3.5 px-4">Status & Stock</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((prod) => {
                  const primaryImg =
                    prod.images.find((i) => i.isPrimary)?.url || prod.images[0]?.url || "/logo.png";
                  const totalImages = prod.images.length;

                  return (
                    <tr key={prod.id} className="hover:bg-white/80 transition">
                      <td className="py-3.5 px-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 shrink-0 relative">
                          <img
                            src={primaryImg}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";
                            }}
                          />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-charcoal-900 line-clamp-1">{prod.name}</p>
                            <Link
                              href={`/products/${prod.slug}`}
                              target="_blank"
                              className="text-gray-400 hover:text-crimson-600 transition"
                              title="View on public storefront"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                          <p className="text-[11px] text-charcoal-500 line-clamp-1">
                            {prod.description}
                          </p>
                          {prod.isFeatured && (
                            <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              ★ Spotlight Featured
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-md bg-crimson-50 text-crimson-700 font-semibold text-[10px]">
                          {prod.category?.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-charcoal-900 text-sm">
                            {formatINR(prod.pricePaise !== undefined ? prod.pricePaise : Math.round(Number(prod.price || 0) * 100))}
                          </span>
                          {(prod.mrpPaise || (prod as any).mrp) ? (
                            <span className="text-[10px] text-charcoal-400 line-through">
                              {formatINR(prod.mrpPaise !== undefined ? prod.mrpPaise : Math.round(Number((prod as any).mrp) * 100))}
                            </span>
                          ) : null}
                          {(prod.discountPercent && prod.discountPercent > 0) ? (
                            <span className="px-1.5 py-0.5 rounded bg-crimson-50 text-crimson-600 font-bold text-[9px] border border-crimson-200">
                              {prod.discountPercent}% OFF
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Images count badge */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-charcoal-700 font-bold text-[10px]">
                          <ImageIcon className="w-3 h-3 text-crimson-600" />
                          {totalImages} {totalImages === 1 ? "photo" : "photos"}
                        </span>
                      </td>

                      {/* Quick Toggles */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          {/* Published Toggle */}
                          <button
                            onClick={() => handleTogglePublished(prod)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                              (prod.status === "PUBLISHED" || prod.isPublished === true)
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-gray-100 text-charcoal-500 border border-gray-200 hover:bg-gray-200"
                            }`}
                            title={(prod.status === "PUBLISHED" || prod.isPublished === true) ? "Click to set Draft (Hidden)" : "Click to Publish (Live)"}
                          >
                            {(prod.status === "PUBLISHED" || prod.isPublished === true) ? (
                              <Eye className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <EyeOff className="w-3 h-3 text-charcoal-400" />
                            )}
                            {(prod.status === "PUBLISHED" || prod.isPublished === true) ? "Live" : "Draft"}
                          </button>

                          {/* Availability Toggle */}
                          <button
                            onClick={() => handleToggleAvailable(prod)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                              (prod.available !== false && prod.isAvailable !== false)
                                ? "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                            }`}
                            title={(prod.available !== false && prod.isAvailable !== false) ? "Click to set Out of Stock" : "Click to set In Stock"}
                          >
                            {(prod.available !== false && prod.isAvailable !== false) ? (
                              <PackageCheck className="w-3 h-3 text-blue-600" />
                            ) : (
                              <PackageX className="w-3 h-3 text-rose-600" />
                            )}
                            {(prod.available !== false && prod.isAvailable !== false) ? "In Stock" : "Sold Out"}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openEditModal(prod)}
                          className="p-2 rounded-xl bg-gray-50 hover:bg-crimson-50 hover:text-crimson-600 text-charcoal-700 transition"
                          title="Edit Product"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-600 text-charcoal-500 transition"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 max-h-[92vh] overflow-y-auto shadow-2xl border border-crimson-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-black text-charcoal-900">
                  {editingProduct ? "Edit Product & Gallery" : "Add New Product"}
                </h2>
                <p className="text-xs text-charcoal-500">
                  Configure photo gallery, pricing, stock availability, and specs
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-charcoal-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-5 text-xs">
              <div>
                <label className="block font-bold text-charcoal-700 mb-1">
                  Product Name <span className="text-crimson-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Magic Color Changing Mug (Heat Reveal Photo)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600 font-medium"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600 font-medium"
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
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600 font-medium"
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
                  placeholder="Catchy product summary for card and storefront..."
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600 resize-none leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold text-charcoal-700 mb-1">
                  Product Technical Specs / Dimensions / Inclusions
                </label>
                <input
                  type="text"
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  placeholder="e.g. 325ml | Microwave Safe | High Gloss Ceramic Sublimation | Gift Box Included"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-crimson-600"
                />
              </div>

              {/* ======================================================== */}
              {/* ADVANCED MULTI-IMAGE UPLOAD & GALLERY MANAGEMENT SECTION */}
              {/* ======================================================== */}
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/40 border border-crimson-100/90 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-charcoal-900 text-xs flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-crimson-600" />
                      Product Image Gallery ({formImages.length})
                    </h3>
                    <p className="text-[11px] text-charcoal-500">
                      Upload multiple photos directly from computer. Mark one photo as <strong>Primary / Cover</strong>.
                    </p>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                  />

                  <button
                    type="button"
                    disabled={uploadingImage}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-crimson-600 hover:bg-crimson-700 text-white font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-60"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{uploadProgressText || "Uploading..."}</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload Photo from Computer</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Paste External Image URL */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    placeholder="Or paste external photo link (https://...)"
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-crimson-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualImage}
                    className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-100 font-bold text-charcoal-700 text-xs transition"
                  >
                    Add URL
                  </button>
                </div>

                {/* Image Previews & Ordering Grid */}
                {formImages.length === 0 ? (
                  <div className="py-8 text-center bg-white/70 rounded-xl border border-dashed border-gray-300">
                    <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 font-medium text-xs">No product photos added yet</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Click "Upload Photo from Computer" above to select multiple images (JPG, PNG, WEBP, up to 5MB).
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-1">
                    {formImages.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-2xl overflow-hidden border-2 bg-white transition shadow-xs group ${
                          img.isPrimary
                            ? "border-crimson-600 ring-2 ring-crimson-100"
                            : "border-gray-200 hover:border-crimson-300"
                        }`}
                      >
                        {/* Thumbnail View */}
                        <div className="relative aspect-square w-full bg-gray-50 overflow-hidden">
                          <img
                            src={img.url}
                            alt={`Product Photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80";
                            }}
                          />

                          {/* Primary Badge */}
                          {img.isPrimary ? (
                            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-crimson-600 text-white font-extrabold text-[9px] shadow-xs flex items-center gap-1">
                              <Star className="w-2.5 h-2.5 fill-current" /> Cover Image
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSetPrimary(idx)}
                              className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-xs text-charcoal-700 hover:bg-crimson-600 hover:text-white font-bold text-[9px] shadow-xs opacity-0 group-hover:opacity-100 transition"
                              title="Make this the main cover image"
                            >
                              Set as Primary
                            </button>
                          )}

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow-xs"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Order Controls Bar */}
                        <div className="p-2 bg-gray-50 flex items-center justify-between border-t border-gray-100 text-[10px]">
                          <span className="font-mono text-charcoal-500 font-bold">#{idx + 1}</span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => handleMoveImage(idx, "left")}
                              className="p-1 rounded bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                              title="Move left"
                            >
                              <ChevronLeft className="w-3 h-3 text-charcoal-700" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === formImages.length - 1}
                              onClick={() => handleMoveImage(idx, "right")}
                              className="p-1 rounded bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-30 disabled:pointer-events-none"
                              title="Move right"
                            >
                              <ChevronRight className="w-3 h-3 text-charcoal-700" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Variants Section */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <label className="block font-bold text-charcoal-700">
                  Product Options / Color / Size Variants (Optional)
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={variantNameInput}
                    onChange={(e) => setVariantNameInput(e.target.value)}
                    placeholder="e.g. Magic Black or Size XL"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-crimson-600"
                  />
                  <input
                    type="number"
                    value={variantDeltaInput}
                    onChange={(e) => setVariantDeltaInput(e.target.value)}
                    placeholder="+₹ Extra Price"
                    className="w-28 px-3 py-1.5 rounded-xl border border-gray-200 text-xs bg-white focus:outline-none focus:border-crimson-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="px-4 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-900 text-white font-bold text-xs"
                  >
                    Add
                  </button>
                </div>

                {formVariants.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {formVariants.map((v, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-gray-200 text-charcoal-800 text-[11px]"
                      >
                        <span className="font-bold">{v.name}</span>
                        {Number(v.priceDelta) > 0 && (
                          <span className="text-crimson-600 font-mono">(+₹{v.priceDelta})</span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(idx)}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-charcoal-800">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="rounded text-crimson-600 focus:ring-crimson-500 w-4 h-4"
                  />
                  <span>Published on Website (Active)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-charcoal-800">
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="rounded text-crimson-600 focus:ring-crimson-500 w-4 h-4"
                  />
                  <span>In Stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-charcoal-800">
                  <input
                    type="checkbox"
                    checked={formFeatured}
                    onChange={(e) => setFormFeatured(e.target.checked)}
                    className="rounded text-crimson-600 focus:ring-crimson-500 w-4 h-4"
                  />
                  <span>Spotlight Featured Product</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="px-6 py-2.5 rounded-xl liquid-btn-primary font-bold text-white shadow-xs disabled:opacity-60"
                >
                  {submitting ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving Product...
                    </span>
                  ) : editingProduct ? (
                    "Save Changes"
                  ) : (
                    "Publish Product"
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
