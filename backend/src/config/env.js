import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({
  path: fileURLToPath(new URL("../../.env", import.meta.url)),
  quiet: true,
});

export const ENV = {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DB_URL: process.env.DB_URL,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  CLIENT_URL: process.env.CLIENT_URL,
  MOBILE_CLIENT_URL: process.env.MOBILE_CLIENT_URL,
  PESAPAL_ENV: process.env.PESAPAL_ENV || "sandbox",
  PESAPAL_CONSUMER_KEY: process.env.PESAPAL_CONSUMER_KEY,
  PESAPAL_CONSUMER_SECRET: process.env.PESAPAL_CONSUMER_SECRET,
  PESAPAL_IPN_ID: process.env.PESAPAL_IPN_ID,
  PESAPAL_IPN_URL: process.env.PESAPAL_IPN_URL,
  PESAPAL_CALLBACK_URL: process.env.PESAPAL_CALLBACK_URL,
  PESAPAL_CURRENCY: process.env.PESAPAL_CURRENCY || "USD",
};

// Public deployment origins. They are not secrets; keeping them here means the
// apps still communicate if the corresponding Vercel env vars are not set.
export const DEPLOYED_ADMIN_URL = "https://afri-cart-cfe2.vercel.app";
export const DEPLOYED_STOREFRONT_URL = "https://africart-mobile-five.vercel.app";
export const DEPLOYED_API_URL = "https://afri-cart-two.vercel.app/api";
