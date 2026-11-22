import path from "path";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";

import { ENV } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { functions, inngest } from "./config/inngest.js";

import adminRoutes from "./routes/admin.route.js";
import userRoutes from "./routes/user.route.js";
import orderRoutes from "./routes/order.route.js";
import reviewRoutes from "./routes/review.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import paymentRoutes from "./routes/payment.route.js";

const app = express();
app.disable("x-powered-by");

const allowedOrigins = new Set(
  [
    ENV.CLIENT_URL,
    ENV.MOBILE_CLIENT_URL,
    ...(ENV.NODE_ENV === "production"
      ? []
      : ["http://localhost:8081", "http://127.0.0.1:8081", "http://localhost:5173"]),
  ].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
    credentials: true,
  })
);

app.use(clerkMiddleware());

// startServer() handles this locally; Vercel never calls it, so every API request
// must ensure the shared Mongoose connection is ready. connectDB() is idempotent.
app.use(async (_req, _res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api/payment", express.json(), paymentRoutes);

app.use(express.json());

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

app.get("/api/health", (_req, res) => res.status(200).json({ status: "ok" }));

// Unknown API routes must fail as JSON, not as a SPA fallback or HTML error page.
app.use("/api", (_req, res) => res.status(404).json({ message: "API route not found." }));

if (ENV.NODE_ENV === "production" && process.env.VERCEL !== "1") {
  app.use(express.static(path.resolve("../admin/dist")));
  app.get("/{*any}", (_req, res) => res.sendFile(path.resolve("../admin/dist/index.html")));
}

app.use((error, _req, res, _next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "Each image must be 5 MB or smaller." });
  }
  if (error.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ message: "A maximum of 3 images is allowed." });
  }
  if (error.message?.startsWith("Only JPEG")) {
    return res.status(400).json({ message: error.message });
  }

  console.error("Unhandled request error:", error);
  return res.status(500).json({ message: "Internal server error." });
});

const startServer = async () => {
  const missing = [
    "DB_URL",
    "CLERK_SECRET_KEY",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD_HASH",
    "ADMIN_SESSION_SECRET",
  ].filter((key) => !ENV[key]);
  if (missing.length) throw new Error(`Missing required environment variables: ${missing.join(", ")}`);

  await connectDB();
  const port = Number(ENV.PORT) || 3000;
  app.listen(port, () => console.log(`AfriCart API listening on port ${port}`));
};

if (process.env.VERCEL !== "1") {
  startServer().catch((error) => {
    console.error("Unable to start server:", error);
    process.exitCode = 1;
  });
}

export default app;
