import { Inngest } from "inngest";
import { connectDB } from "./db.js";
import { User } from "../models/user.model.js";

export const inngest = new Inngest({ id: "ecommerce-app" });

const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    await connectDB();
    const {
      id,
      email_addresses,
      primary_email_address_id,
      first_name,
      last_name,
      image_url,
    } = event.data;
    const emailAddresses = email_addresses || [];
    const primaryEmail =
      emailAddresses.find((email) => email.id === primary_email_address_id) || emailAddresses[0];

    if (!primaryEmail?.email_address) {
      throw new Error(`Cannot sync Clerk user ${id} without an email address.`);
    }

    const newUser = {
      clerkId: id,
      email: primaryEmail.email_address,
      name:
        [first_name, last_name].filter(Boolean).join(" ").trim() ||
        primaryEmail.email_address,
      imageUrl: image_url || "",
      addresses: [],
      wishlist: [],
    };

    try {
      await User.findOneAndUpdate(
        { clerkId: id },
        { $setOnInsert: newUser },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
    } catch (error) {
      if (error?.code !== 11000 || !(await User.exists({ clerkId: id }))) {
        throw error;
      }
    }
  }
);

const deleteUserFromDB = inngest.createFunction(
  { id: "delete-user-from-db" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await connectDB();

    const { id } = event.data;
    await User.deleteOne({ clerkId: id });
  }
);

export const functions = [syncUser, deleteUserFromDB];
