import mongoose from "mongoose";

import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Review } from "../models/review.model.js";
import { User } from "../models/user.model.js";
import {
  destroyProductImages,
  uploadProductImages,
} from "../utils/cloudinary-images.js";

const ALLOWED_CATEGORIES = ["Electronics", "Accessories", "Fashion", "Sports", "Books"];
const ALLOWED_ORDER_STATUSES = ["pending", "shipped", "delivered"];

const sendError = (res, status, message) => res.status(status).json({ message });

const paginationFrom = (query) => {
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 12, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const searchTerm = (value) => (value ? { $regex: escapeRegExp(value), $options: "i" } : undefined);

const parseProductFields = ({ name, description, price, stock, category }, partial = false) => {
  const fields = {};

  if (!partial || name !== undefined) {
    if (typeof name !== "string" || !name.trim()) return { error: "A product name is required." };
    fields.name = name.trim();
  }
  if (!partial || description !== undefined) {
    if (typeof description !== "string" || !description.trim()) {
      return { error: "A product description is required." };
    }
    fields.description = description.trim();
  }
  if (!partial || price !== undefined) {
    const parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return { error: "Price must be a positive number." };
    }
    fields.price = parsedPrice;
  }
  if (!partial || stock !== undefined) {
    const parsedStock = Number(stock);
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      return { error: "Stock must be a whole number of 0 or more." };
    }
    fields.stock = parsedStock;
  }
  if (!partial || category !== undefined) {
    if (!ALLOWED_CATEGORIES.includes(category)) {
      return { error: `Category must be one of: ${ALLOWED_CATEGORIES.join(", ")}.` };
    }
    fields.category = category;
  }

  return { fields };
};

const isValidId = (id) => mongoose.isValidObjectId(id);

export async function createProduct(req, res) {
  const { fields, error } = parseProductFields(req.body);
  if (error) return sendError(res, 400, error);
  if (!req.files?.length) return sendError(res, 400, "At least one image is required.");

  let uploadedImages = [];
  try {
    uploadedImages = await uploadProductImages(req.files);
    const product = await Product.create({
      ...fields,
      images: uploadedImages.map((image) => image.url),
    });
    return res.status(201).json(product);
  } catch (err) {
    // Never leave orphaned Cloudinary assets behind if the database write fails.
    if (uploadedImages.length) {
      await destroyProductImages(uploadedImages);
    }
    console.error("Error creating product:", err);
    return sendError(res, 500, "Unable to create the product.");
  }
}

// Public storefront feed. Keeps the bare-array response used by the mobile app.
export async function getAllProducts(req, res) {
  try {
    const filter = {
      ...(req.query.category && { category: req.query.category }),
      ...(req.query.search && { name: searchTerm(req.query.search) }),
    };
    const products = await Product.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    return res.status(200).json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return sendError(res, 500, "Unable to load products.");
  }
}

export async function getAdminProducts(req, res) {
  try {
    const { page, limit, skip } = paginationFrom(req.query);
    const filter = {
      ...(req.query.search && {
        $or: [
          { name: searchTerm(req.query.search) },
          { description: searchTerm(req.query.search) },
          { category: searchTerm(req.query.search) },
        ],
      }),
      ...(req.query.category && { category: req.query.category }),
    };

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter),
    ]);

    return res.status(200).json({ products, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    console.error("Error fetching products:", error);
    return sendError(res, 500, "Unable to load products.");
  }
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) return sendError(res, 400, "Invalid product ID.");

  const { fields, error } = parseProductFields(req.body, true);
  if (error) return sendError(res, 400, error);
  let parsedRemovals = [];
  try {
    parsedRemovals = JSON.parse(req.body.removedImages || "[]");
  } catch {
    return sendError(res, 400, "Invalid image removal list.");
  }
  if (!Array.isArray(parsedRemovals) || parsedRemovals.some((url) => typeof url !== "string")) {
    return sendError(res, 400, "Invalid image removal list.");
  }

  if (Object.keys(fields).length === 0 && !req.files?.length && parsedRemovals.length === 0) {
    return sendError(res, 400, "No changes were provided.");
  }

  let newImages = [];
  try {
    const product = await Product.findById(id);
    if (!product) return sendError(res, 404, "Product not found.");

    const removedImages = product.images.filter((url) => parsedRemovals.includes(url));
    const remainingImages = product.images.filter((url) => !parsedRemovals.includes(url));
    if (remainingImages.length + (req.files?.length || 0) > 3) {
      return sendError(res, 400, "A maximum of 3 images is allowed.");
    }
    if (req.files?.length) {
      newImages = await uploadProductImages(req.files);
    }
    const nextImages = [...remainingImages, ...newImages.map((image) => image.url)];

    if (nextImages.length === 0) return sendError(res, 400, "A product needs at least one image.");
    if (nextImages.length > 3) return sendError(res, 400, "A maximum of 3 images is allowed.");

    Object.assign(product, fields, { images: nextImages });
    await product.save();

    // Only destroy assets that are no longer referenced, after the database write succeeds.
    if (removedImages.length) await destroyProductImages(removedImages);

    return res.status(200).json(product);
  } catch (err) {
    if (newImages.length) await destroyProductImages(newImages);
    console.error("Error updating product:", err);
    return sendError(res, 500, "Unable to update the product.");
  }
}

export async function getAllOrders(req, res) {
  try {
    const { page, limit, skip } = paginationFrom(req.query);
    const filter = {
      ...(req.query.status && { status: req.query.status }),
      ...(req.query.search && { "shippingAddress.fullName": searchTerm(req.query.search) }),
    };

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email")
        .populate("orderItems.product")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.countDocuments(filter),
    ]);

    return res.status(200).json({ orders, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return sendError(res, 500, "Unable to load orders.");
  }
}

export async function updateOrderStatus(req, res) {
  const { orderId } = req.params;
  const { status } = req.body;

  if (!isValidId(orderId)) return sendError(res, 400, "Invalid order ID.");
  if (!ALLOWED_ORDER_STATUSES.includes(status)) return sendError(res, 400, "Invalid status.");

  try {
    const order = await Order.findById(orderId);
    if (!order) return sendError(res, 404, "Order not found.");

    if (status !== "pending" && order.paymentResult?.status !== "succeeded") {
      return sendError(res, 409, "Only confirmed paid orders can be shipped or delivered.");
    }
    if (order.status === "delivered" && status !== "delivered") {
      return sendError(res, 409, "A delivered order cannot be moved back.");
    }

    order.status = status;
    if (status === "shipped" && !order.shippedAt) order.shippedAt = new Date();
    if (status === "delivered" && !order.deliveredAt) order.deliveredAt = new Date();

    await order.save();
    return res.status(200).json({ message: "Order status updated successfully.", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    return sendError(res, 500, "Unable to update the order status.");
  }
}

export async function getAllCustomers(req, res) {
  try {
    const { page, limit, skip } = paginationFrom(req.query);
    const filter = req.query.search
      ? { $or: [{ name: searchTerm(req.query.search) }, { email: searchTerm(req.query.search) }] }
      : {};

    const [customers, total] = await Promise.all([
      User.find(filter)
        .select("name email imageUrl addresses wishlist createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    return res.status(200).json({ customers, total, page, pages: Math.ceil(total / limit) || 1 });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return sendError(res, 500, "Unable to load customers.");
  }
}

export async function getDashboardStats(_req, res) {
  try {
    const [totalOrders, totalCustomers, totalProducts, revenueResult] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Order.aggregate([
        {
          $match: {
            "paymentResult.status": "succeeded",
            "paymentResult.provider": "pesapal",
          },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
    ]);

    return res.status(200).json({
      totalRevenue: revenueResult[0]?.total || 0,
      totalOrders,
      totalCustomers,
      totalProducts,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return sendError(res, 500, "Unable to load dashboard stats.");
  }
}

export async function deleteProduct(req, res) {
  const { id } = req.params;
  if (!isValidId(id)) return sendError(res, 400, "Invalid product ID.");

  try {
    const product = await Product.findById(id);
    if (!product) return sendError(res, 404, "Product not found.");

    await Promise.all([Product.findByIdAndDelete(id), Review.deleteMany({ productId: id })]);
    await destroyProductImages(product.images);

    return res.status(200).json({ message: "Product deleted successfully." });
  } catch (error) {
    console.error("Error deleting product:", error);
    return sendError(res, 500, "Unable to delete the product.");
  }
}
