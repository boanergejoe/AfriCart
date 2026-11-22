import { useState } from "react";
import { PlusIcon, PencilIcon, Trash2Icon, XIcon, ImageIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productApi } from "../lib/api";
import { getStockStatusBadge } from "../lib/utils";

function ProductsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [imageError, setImageError] = useState("");
  const [mutationError, setMutationError] = useState("");

  const queryClient = useQueryClient();

  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["products"],
    queryFn: productApi.getAll,
  });

  const createProductMutation = useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      setMutationError("");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) =>
      setMutationError(error.response?.data?.message || "Unable to create product. Please try again."),
  });

  const updateProductMutation = useMutation({
    mutationFn: productApi.update,
    onSuccess: () => {
      setMutationError("");
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) =>
      setMutationError(error.response?.data?.message || "Unable to update product. Please try again."),
  });

  const deleteProductMutation = useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      setMutationError("");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) =>
      setMutationError(error.response?.data?.message || "Unable to delete product. Please try again."),
  });

  const closeModal = () => {
    imagePreviews.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });
    setMutationError("");
    setShowModal(false);
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "",
      price: "",
      stock: "",
      description: "",
    });
    setImages([]);
    setImagePreviews([]);
    setImageError("");
  };

  const handleEdit = (product) => {
    setMutationError("");
    setImageError("");
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
    });
    setImagePreviews(product.images || []);
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (files.length > 3) {
      setImageError("Choose up to 3 images.");
      e.target.value = "";
      return;
    }

    if (files.some((file) => !allowedTypes.includes(file.type))) {
      setImageError("Images must be JPEG, PNG, or WebP files.");
      e.target.value = "";
      return;
    }

    if (files.some((file) => file.size > 5 * 1024 * 1024)) {
      setImageError("Each image must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    imagePreviews.forEach((url) => {
      if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    });

    setImages(files);
    setImagePreviews(files.map((file) => URL.createObjectURL(file)));
    setImageError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMutationError("");

    if (!editingProduct && imagePreviews.length === 0) {
      setImageError("Upload at least one product image.");
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("price", formData.price);
    formDataToSend.append("stock", formData.stock);
    formDataToSend.append("category", formData.category);

    // only append new images if they were selected
    if (images.length > 0) images.forEach((image) => formDataToSend.append("images", image));

    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct._id, formData: formDataToSend });
    } else {
      createProductMutation.mutate(formDataToSend);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="mt-1 text-base-content/70">Manage your product catalog and inventory.</p>
        </div>
        <button
          onClick={() => {
            setMutationError("");
            setImageError("");
            setShowModal(true);
          }}
          className="btn btn-primary gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Product
        </button>
      </header>

      {mutationError && (
        <div role="alert" className="alert alert-error">
          <span>{mutationError}</span>
          <button className="btn btn-sm btn-ghost" onClick={() => setMutationError("")}>
            Dismiss
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex min-h-64 items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
          <span className="ml-3 text-base-content/70">Loading products...</span>
        </div>
      ) : isError ? (
        <div role="alert" className="alert alert-error">
          <span>Products could not be loaded.</span>
          <button className="btn btn-sm" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 px-6 py-16 text-center">
          <ImageIcon className="mx-auto mb-3 h-10 w-10 text-base-content/40" />
          <h2 className="text-lg font-semibold">Your catalog is empty</h2>
          <p className="mt-1 text-sm text-base-content/70">
            Add a product and its images to start building your catalog.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
          {products.map((product) => {
            const status = getStockStatusBadge(product.stock);

            return (
              <article
                key={product._id}
                className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <figure className="relative aspect-[4/3] bg-base-200">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-base-content/40">
                      <ImageIcon className="h-10 w-10" />
                    </div>
                  )}
                  <span className={`badge absolute right-3 top-3 ${status.class}`}>
                    {status.text}
                  </span>
                </figure>

                <div className="card-body gap-4 p-5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                      {product.category}
                    </p>
                    <h2 className="card-title mt-1 line-clamp-2 min-h-14 text-lg">
                      {product.name}
                    </h2>
                  </div>

                  <div className="flex items-end justify-between border-t border-base-200 pt-4">
                    <div>
                      <p className="text-xs text-base-content/60">Price</p>
                      <p className="text-xl font-bold">
                        ${Number(product.price).toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-base-content/60">Inventory</p>
                      <p className="font-semibold">{product.stock} units</p>
                    </div>
                  </div>

                  <div className="card-actions justify-end border-t border-base-200 pt-3">
                    <button
                      className="btn btn-square btn-ghost"
                      onClick={() => handleEdit(product)}
                      aria-label={`Edit ${product.name}`}
                      title="Edit product"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      className="btn btn-square btn-ghost text-error"
                      onClick={() => {
                        if (window.confirm(`Delete "${product.name}" from the catalog?`)) {
                          setMutationError("");
                          deleteProductMutation.mutate(product._id);
                        }
                      }}
                      disabled={deleteProductMutation.isPending}
                      aria-label={`Delete ${product.name}`}
                      title="Delete product"
                    >
                      {deleteProductMutation.isPending ? (
                        <span className="loading loading-spinner" />
                      ) : (
                        <Trash2Icon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ADD/EDIT PRODUCT MODAL */}

      <input type="checkbox" className="modal-toggle" checked={showModal} readOnly />

      <div className="modal">
        <div className="modal-box max-h-[90vh] w-11/12 max-w-2xl overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-2xl">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h3>

            <button onClick={closeModal} className="btn btn-sm btn-circle btn-ghost">
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {showModal && mutationError && (
            <div role="alert" className="alert alert-error mb-4">
              <span>{mutationError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span>Product Name</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter product name"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span>Category</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Fashion">Fashion</option>
                  <option value="Sports">Sports</option>
                  <option value="Books">Books</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="form-control">
                <label className="label">
                  <span>Price ($)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  className="input input-bordered"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span>Stock</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  className="input input-bordered"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-control flex flex-col gap-2">
              <label className="label">
                <span>Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24 w-full"
                placeholder="Enter product description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text font-semibold text-base flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Product Images
                </span>
                <span className="label-text-alt text-xs opacity-60">Up to 3 images, 5 MB each</span>
              </label>

              <div className="bg-base-200 rounded-xl p-4 border-2 border-dashed border-base-300 hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleImageChange}
                  className="file-input file-input-bordered file-input-primary w-full"
                />

                <p className="mt-2 text-center text-xs text-base-content/60">
                  JPEG, PNG, or WebP. {editingProduct && "Leave empty to keep current images."}
                </p>
              </div>

              {imageError && (
                <p className="mt-2 text-sm text-error" role="alert">
                  {imageError}
                </p>
              )}

              {imagePreviews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <figure
                      key={`${preview}-${index}`}
                      className="aspect-square overflow-hidden rounded-xl border border-base-300 bg-base-200"
                    >
                      <img
                        src={preview}
                        alt={`Product image preview ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </figure>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-action">
              <button
                type="button"
                onClick={closeModal}
                className="btn"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                {createProductMutation.isPending || updateProductMutation.isPending ? (
                  <span className="loading loading-spinner"></span>
                ) : editingProduct ? (
                  "Update Product"
                ) : (
                  "Add Product"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
