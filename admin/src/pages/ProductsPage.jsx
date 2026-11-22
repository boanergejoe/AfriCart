import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ImageIcon,
  PackagePlusIcon,
  PencilIcon,
  SearchIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import ConfirmDialog from "../components/ConfirmDialog.jsx";
import { EmptyState, ErrorState, LoadingState } from "../components/StateViews.jsx";
import ImageWithFallback from "../components/ImageWithFallback.jsx";
import { productApi } from "../lib/api.js";
import { useToast } from "../lib/toast.js";
import { formatCurrency, getErrorMessage, getStockStatusBadge } from "../lib/utils.js";

const EMPTY_FORM = { name: "", category: "", price: "", stock: "", description: "" };
const CATEGORIES = ["Electronics", "Accessories", "Fashion", "Sports", "Books"];
const PAGE_SIZE = 9;

function ProductsPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();
  const nameInputRef = useRef(null);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previews, setPreviews] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [imageError, setImageError] = useState("");
  const [productToDelete, setProductToDelete] = useState(null);

  const queryParams = useMemo(
    () => ({ search: search.trim() || undefined, category: category || undefined, page, limit: PAGE_SIZE }),
    [search, category, page]
  );

  const productsQuery = useQuery({
    queryKey: ["products", queryParams],
    queryFn: () => productApi.getAll(queryParams),
  });

  const invalidateProducts = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingProduct ? productApi.update(payload) : productApi.create(payload.formData),
    onSuccess: () => {
      notify(editingProduct ? "Product updated." : "Product added to the catalog.", "success");
      closeModal();
      invalidateProducts();
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
    onError: (error) => notify(getErrorMessage(error, "Unable to save the product."), "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      notify("Product deleted.", "success");
      setProductToDelete(null);
      invalidateProducts();
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
    },
    onError: (error) => notify(getErrorMessage(error, "Unable to delete the product."), "error"),
  });

  const closeModal = useCallback(() => {
    setPreviews((current) => {
      current.forEach((preview) => {
        if (preview.isBlob) URL.revokeObjectURL(preview.url);
      });
      return [];
    });
    setShowModal(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setRemovedImages([]);
    setImageError("");
  }, []);

  const openCreateModal = () => {
    setForm(EMPTY_FORM);
    setPreviews([]);
    setRemovedImages([]);
    setImageError("");
    setEditingProduct(null);
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      category: product.category || "",
      price: String(product.price ?? ""),
      stock: String(product.stock ?? ""),
      description: product.description || "",
    });
    setPreviews((product.images || []).map((url) => ({ url, isBlob: false })));
    setRemovedImages([]);
    setImageError("");
    setShowModal(true);
  };

  useEffect(() => {
    if (!showModal) return undefined;
    nameInputRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !saveMutation.isPending) closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showModal, saveMutation.isPending, closeModal]);

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (files.some((file) => !allowed.includes(file.type))) {
      setImageError("Only JPEG, PNG, and WebP images are supported.");
      return;
    }
    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setImageError("Each image must be 5 MB or smaller.");
      return;
    }
    if (previews.length - removedImages.length + files.length > 3) {
      setImageError("A product can have at most 3 images.");
      return;
    }

    previews.filter((preview) => preview.isBlob).forEach((preview) => URL.revokeObjectURL(preview.url));
    setPreviews((current) => [
      ...current.filter((preview) => !preview.isBlob),
      ...files.map((file) => ({ url: URL.createObjectURL(file), isBlob: true, file })),
    ]);
    setImageError("");
  };

  const removePreview = (index) => {
    const preview = previews[index];
    if (preview.isBlob) URL.revokeObjectURL(preview.url);
    else setRemovedImages((current) => [...current, preview.url]);
    setPreviews((current) => current.filter((_, i) => i !== index));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!editingProduct && previews.length === 0) {
      setImageError("Add at least one product image.");
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value.trim()));
    previews.filter((preview) => preview.file).forEach((preview) => formData.append("images", preview.file));

    if (editingProduct) {
      formData.append("removedImages", JSON.stringify(removedImages));
      saveMutation.mutate({ id: editingProduct._id, formData });
    } else {
      saveMutation.mutate({ formData });
    }
  };

  const { products = [], total = 0, pages = 1 } = productsQuery.data || {};

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Products</h1>
          <p className="muted mt-1 text-sm">Manage your catalog, pricing and inventory.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          <PackagePlusIcon className="size-5" />
          Add product
        </button>
      </header>

      <section className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <label className="input input-bordered flex flex-1 items-center gap-2">
          <SearchIcon className="size-4 text-base-content/50" aria-hidden="true" />
          <span className="sr-only">Search products</span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name, category or description…"
          />
        </label>
        <select
          className="select select-bordered w-full sm:w-52"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by category"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <span className="text-sm text-base-content/70">{total} product(s)</span>
      </section>

      {productsQuery.isLoading ? (
        <div className="surface">
          <LoadingState label="Loading products…" />
        </div>
      ) : productsQuery.isError ? (
        <div className="surface">
          <ErrorState
            message={getErrorMessage(productsQuery.error, "Unable to load the catalog.")}
            onRetry={productsQuery.refetch}
          />
        </div>
      ) : products.length === 0 ? (
        <div className="surface">
          <EmptyState
            icon={ImageIcon}
            title="No products found"
            description={search || category ? "Try adjusting your search or filter." : "Add your first product to start selling."}
            action={
              !search && !category ? (
                <button type="button" className="btn btn-primary btn-sm" onClick={openCreateModal}>
                  Add product
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setSearch("");
                    setCategory("");
                  }}
                >
                  Clear filters
                </button>
              )
            }
          />
        </div>
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => {
            const stock = getStockStatusBadge(product.stock);
            return (
              <article key={product._id} className="surface overflow-hidden transition hover:shadow-md">
                <figure className="aspect-[4/3] overflow-hidden bg-base-200">
                  <ImageWithFallback
                    src={product.images?.[0]}
                    alt={product.name}
                    className="size-full object-cover"
                  />
                </figure>
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                        {product.category}
                      </p>
                      <h2 className="mt-1 line-clamp-2 font-semibold">{product.name}</h2>
                    </div>
                    <span className={`badge badge-sm ${stock.class}`}>{stock.text}</span>
                  </div>
                  <p className="line-clamp-2 min-h-10 text-sm muted">{product.description}</p>
                  <div className="flex items-end justify-between border-t border-base-200 pt-3">
                    <div>
                      <p className="text-xs muted">Price</p>
                      <p className="text-lg font-bold tabular-nums">{formatCurrency(product.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs muted">Stock</p>
                      <p className="font-semibold tabular-nums">{product.stock} units</p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-1 border-t border-base-200 pt-2">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => openEditModal(product)}
                      aria-label={`Edit ${product.name}`}
                    >
                      <PencilIcon className="size-4" /> Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm text-error"
                      onClick={() => setProductToDelete(product)}
                      aria-label={`Delete ${product.name}`}
                    >
                      <Trash2Icon className="size-4" /> Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="btn btn-sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => current - 1)}
          >
            Previous
          </button>
          <span className="text-sm muted">
            Page {page} of {pages}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            disabled={page >= pages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal modal-open">
          <div
            className="modal-box max-h-[90vh] w-11/12 max-w-2xl overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 id="product-modal-title" className="text-xl font-bold">
                {editingProduct ? "Edit product" : "Add a new product"}
              </h2>
              <button
                type="button"
                className="btn btn-circle btn-ghost btn-sm"
                onClick={closeModal}
                aria-label="Close product form"
              >
                <XIcon className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="form-control">
                  <label className="label" htmlFor="product-name">
                    <span className="label-text font-medium">Product name</span>
                  </label>
                  <input
                    id="product-name"
                    ref={nameInputRef}
                    className="input input-bordered w-full"
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    maxLength={120}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label" htmlFor="product-category">
                    <span className="label-text font-medium">Category</span>
                  </label>
                  <select
                    id="product-category"
                    className="select select-bordered w-full"
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    required
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="form-control">
                  <label className="label" htmlFor="product-price">
                    <span className="label-text font-medium">Price (USD)</span>
                  </label>
                  <input
                    id="product-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="input input-bordered w-full"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    required
                  />
                </div>
                <div className="form-control">
                  <label className="label" htmlFor="product-stock">
                    <span className="label-text font-medium">Stock</span>
                  </label>
                  <input
                    id="product-stock"
                    type="number"
                    min="0"
                    step="1"
                    className="input input-bordered w-full"
                    value={form.stock}
                    onChange={(event) => setForm({ ...form, stock: event.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label" htmlFor="product-description">
                  <span className="label-text font-medium">Description</span>
                </label>
                <textarea
                  id="product-description"
                  className="textarea textarea-bordered h-24 w-full"
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  maxLength={1000}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label" htmlFor="product-images">
                  <span className="label-text font-medium">Images</span>
                  <span className="label-text-alt">JPEG, PNG or WebP · up to 3 · 5 MB each</span>
                </label>
                <input
                  id="product-images"
                  type="file"
                  className="file-input file-input-bordered w-full"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                />
                {imageError && (
                  <p role="alert" className="mt-2 text-sm text-error">
                    {imageError}
                  </p>
                )}
                {previews.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    {previews.map((preview, index) => (
                      <div key={`${preview.url}-${index}`} className="relative aspect-square">
                        <img
                          src={preview.url}
                          alt={`Product preview ${index + 1}`}
                          className="size-full rounded-xl object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePreview(index)}
                          className="btn btn-circle btn-error btn-xs absolute -right-2 -top-2"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <XIcon className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={closeModal}
                  disabled={saveMutation.isPending}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
                  {saveMutation.isPending && <span className="loading loading-spinner loading-xs" />}
                  {editingProduct ? "Save changes" : "Add product"}
                </button>
              </div>
            </form>
          </div>
          <button type="button" className="modal-backdrop" onClick={closeModal} aria-label="Close dialog" />
        </div>
      )}

      <ConfirmDialog
        open={Boolean(productToDelete)}
        title="Delete product?"
        description={`“${productToDelete?.name || ""}” will be removed from the catalog and its images deleted.`}
        confirmLabel="Delete"
        tone="error"
        busy={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate(productToDelete._id)}
        onCancel={() => setProductToDelete(null)}
      />
    </div>
  );
}

export default ProductsPage;
