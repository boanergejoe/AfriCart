import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Product } from "../models/product.model.js";

const ADDRESS_FIELDS = ["fullName", "streetAddress", "city", "state", "zipCode", "phoneNumber"];

const isValidPhoneNumber = (value) =>
  /^\+?\d{7,15}$/.test(String(value || "").replace(/[^\d+]/g, ""));

const readAddressInput = (body, partial = false) => {
  const address = {};
  for (const field of ADDRESS_FIELDS) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "string") return { error: `${field} must be text.` };
    const value = body[field].trim();
    if (!partial || value) address[field] = value;
  }
  return { address };
};

export async function addAddress(req, res) {
  try {
    const { label, isDefault } = req.body;
    const { address, error } = readAddressInput(req.body);
    if (error) return res.status(400).json({ message: error });

    const user = req.user;

    if (ADDRESS_FIELDS.some((field) => !address[field])) {
      return res.status(400).json({ message: "Missing required address fields" });
    }
    if (!isValidPhoneNumber(address.phoneNumber)) {
      return res.status(400).json({ message: "Enter a valid phone number for this address." });
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      label: typeof label === "string" ? label.trim() : label,
      ...address,
      isDefault: isDefault || false,
    });

    await user.save();

    res.status(201).json({ message: "Address added successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in addAddress controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getAddresses(req, res) {
  try {
    const user = req.user;

    res.status(200).json({ addresses: user.addresses });
  } catch (error) {
    console.error("Error in getAddresses controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateAddress(req, res) {
  try {
    const { label, isDefault } = req.body;
    const { address: updates, error } = readAddressInput(req.body, true);
    if (error) return res.status(400).json({ message: error });

    const { addressId } = req.params;

    const user = req.user;
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ message: "Address not found" });
    }
    if (updates.phoneNumber && !isValidPhoneNumber(updates.phoneNumber)) {
      return res.status(400).json({ message: "Enter a valid phone number for this address." });
    }

    // if this is set as default, unset all other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    if (label !== undefined) address.label = typeof label === "string" ? label.trim() : label;
    Object.assign(address, updates);
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

    await user.save();

    res.status(200).json({ message: "Address updated successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in updateAddress controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function deleteAddress(req, res) {
  try {
    const { addressId } = req.params;
    const user = req.user;

    user.addresses.pull(addressId);
    await user.save();

    res.status(200).json({ message: "Address deleted successfully", addresses: user.addresses });
  } catch (error) {
    console.error("Error in deleteAddress controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function addToWishlist(req, res) {
  try {
    const { productId } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { wishlist: productId } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Product added to wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in addToWishlist controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function removeFromWishlist(req, res) {
  try {
    const { productId } = req.params;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { wishlist: productId } },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: "Product removed from wishlist", wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in removeFromWishlist controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function getWishlist(req, res) {
  try {
    // we're using populate, bc wishlist is just an array of product ids
    const user = await User.findById(req.user._id).populate("wishlist");

    res.status(200).json({ wishlist: user.wishlist });
  } catch (error) {
    console.error("Error in getWishlist controller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
