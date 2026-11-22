import { clerkClient, getAuth, requireAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import { ENV } from "../config/env.js";
import { verifyAdminToken } from "../utils/admin-auth.js";

async function findOrCreateUser(clerkId) {
  const existingUser = await User.findOne({ clerkId });
  if (existingUser) return existingUser;

  const clerkUser = await clerkClient.users.getUser(clerkId);
  const primaryEmail =
    clerkUser.emailAddresses.find((email) => email.id === clerkUser.primaryEmailAddressId) ||
    clerkUser.emailAddresses[0];

  if (!primaryEmail?.emailAddress) return null;

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    clerkUser.username ||
    primaryEmail.emailAddress;

  try {
    return await User.findOneAndUpdate(
      { clerkId },
      {
        $setOnInsert: {
          clerkId,
          email: primaryEmail.emailAddress,
          name,
          imageUrl: clerkUser.imageUrl || "",
          addresses: [],
          wishlist: [],
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );
  } catch (error) {
    if (error?.code === 11000) {
      const userCreatedConcurrently = await User.findOne({ clerkId });
      if (userCreatedConcurrently) return userCreatedConcurrently;
    }

    throw error;
  }
}

export const protectRoute = [
  requireAuth(),
  async (req, res, next) => {
    try {
      const { userId: clerkId } = getAuth(req);
      if (!clerkId) return res.status(401).json({ message: "Unauthorized - invalid token" });

      const user = await findOrCreateUser(clerkId);
      if (!user) {
        return res.status(403).json({ message: "Your Clerk account needs a primary email address." });
      }

      req.user = user;

      next();
    } catch (error) {
      console.error("Error in protectRoute middleware", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
];

export const adminAuth = (req, res, next) => {
  if (!ENV.ADMIN_EMAIL || !ENV.ADMIN_SESSION_SECRET) {
    return res.status(503).json({ message: "Admin login is not configured." });
  }

  const authorization = req.get("authorization") || "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  const tokenEmail = match ? verifyAdminToken(match[1]) : null;
  const configuredEmail = ENV.ADMIN_EMAIL.trim().toLowerCase();

  if (!tokenEmail || tokenEmail !== configuredEmail) {
    return res.status(401).json({ message: "Unauthorized - sign in again" });
  }

  req.admin = { email: tokenEmail };
  next();
};
