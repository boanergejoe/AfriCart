import mongoose from "mongoose";

import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

const normalizeProductId = (value) => {
  if (!mongoose.isValidObjectId(value)) return null;
  return new mongoose.Types.ObjectId(value).toString();
};

export async function getCart(req, res) {
  try {
    const cart = await Cart.findOne({ clerkId: req.user.clerkId }).populate("items.product");

    if (!cart) {
      return res.status(200).json({
        cart: await Cart.create({
          user: req.user._id,
          clerkId: req.user.clerkId,
          items: [],
        }),
      });
    }

    return res.status(200).json({ cart });
  } catch (error) {
    console.error("Error in getCart controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function addToCart(req, res) {
  try {
    const productId = normalizeProductId(req.body?.productId);
    const { quantity = 1 } = req.body;

    if (!productId) return res.status(400).json({ message: "Invalid product." });
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be a positive whole number" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.stock < quantity) return res.status(400).json({ message: "Insufficient stock" });

    let cart = await Cart.findOne({ clerkId: req.user.clerkId });
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        clerkId: req.user.clerkId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        return res.status(400).json({ message: "Insufficient stock" });
      }
      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    return res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    console.error("Error in addToCart controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateCartItem(req, res) {
  try {
    const productId = normalizeProductId(req.params.productId);
    const { quantity } = req.body;

    if (!productId) return res.status(400).json({ message: "Invalid product." });
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ message: "Quantity must be a positive whole number" });
    }

    const cart = await Cart.findOne({ clerkId: req.user.clerkId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ message: "Item not found in cart" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.stock < quantity) return res.status(400).json({ message: "Insufficient stock" });

    cart.items[itemIndex].quantity = quantity;
    await cart.save();
    return res.status(200).json({ message: "Cart updated successfully", cart });
  } catch (error) {
    console.error("Error in updateCartItem controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export async function removeFromCart(req, res) {
  try {
    const productId = normalizeProductId(req.params.productId);
    if (!productId) return res.status(400).json({ message: "Invalid product." });

    const cart = await Cart.findOne({ clerkId: req.user.clerkId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((item) => item.product.toString() !== productId);
    await cart.save();
    return res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error("Error in removeFromCart controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ clerkId: req.user.clerkId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();
    return res.status(200).json({ message: "Cart cleared", cart });
  } catch (error) {
    console.error("Error in clearCart controller:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
