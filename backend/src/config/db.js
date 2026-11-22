import mongoose from "mongoose";
import { ENV } from "./env.js";

// Serverless functions reuse the process when warm, but can also be cold-started.
// Cache the connection promise globally so concurrent requests never open duplicate pools.
const globalForDb = globalThis;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState !== 2) globalForDb.__afriCartDbPromise = null;
  if (!ENV.DB_URL) throw new Error("DB_URL is not configured.");

  if (!globalForDb.__afriCartDbPromise) {
    globalForDb.__afriCartDbPromise = mongoose
      .connect(ENV.DB_URL)
      .then((connection) => {
        console.log(`✅ Connected to MONGODB: ${connection.connection.host}`);
        return connection;
      })
      .catch((error) => {
        globalForDb.__afriCartDbPromise = null;
        console.error("💥 MONGODB connection error", error);
        throw error;
      });
  }

  return globalForDb.__afriCartDbPromise;
};
