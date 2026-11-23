import path from "path";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { serve } from "inngest/express";

import { DEPLOYED_ADMIN_URL, DEPLOYED_STOREFRONT_URL, ENV } from "./config/env.js";
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

// Browsers send only scheme + host + port in Origin, so compare normalized origins.
const normalizeOrigin = (value) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/+$/, "");
  }
};

// Expo Router web serves on 19000/19006, native dev on 8081, and Vite on 5173.
// Include both localhost and 127.0.0.1 so local tooling can't be blocked by a host mismatch.
const DEV_ORIGINS =
  ENV.NODE_ENV === "production"
    ? []
    : ["localhost", "127.0.0.1"].flatMap((host) =>
        [8081, 19000, 19006, 5173].map((port) => `http://${host}:${port}`)
      );

const allowedOrigins = new Set(
  [
    ENV.CLIENT_URL,
    ENV.MOBILE_CLIENT_URL,
    DEPLOYED_ADMIN_URL,
    DEPLOYED_STOREFRONT_URL,
    ...DEV_ORIGINS,
  ]
    .map(normalizeOrigin)
    .filter(Boolean)
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

// PesaPal IPNs may be sent as form data; accept both content types before route validation.
app.use("/api/payment", express.json(), express.urlencoded({ extended: false }), paymentRoutes);

app.use(express.json());

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

// The backend is an API, so visiting its root should explain itself instead of
// returning Express's default "Cannot GET /" HTML page.
app.get("/", (_req, res) =>
  res.status(200).json({
    status: "ok",
    name: "AfriCart API",
    endpoints: { health: "/api/health", products: "/api/products", adminLogin: "/api/admin/login" },
  })
);

app.get("/api", (_req, res) =>
  res.status(200).json({
    status: "ok",
    name: "AfriCart API",
    endpoints: { health: "/api/health", products: "/api/products", adminLogin: "/api/admin/login" },
  })
);

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
    "CLERK_PUBLISHABLE_KEY",
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
