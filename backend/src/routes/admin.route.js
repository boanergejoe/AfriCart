import { Router } from "express";
import {
  createProduct,
  getAllCustomers,
  getAllOrders,
  getAdminProducts,
  getDashboardStats,
  updateOrderStatus,
  updateProduct,
  deleteProduct,
} from "../controllers/admin.controller.js";
import { loginAdmin } from "../controllers/admin-auth.controller.js";
import { adminAuth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.post("/login", loginAdmin);

// Every route below requires the admin dashboard's signed session token.
router.use(adminAuth);

// Lets the dashboard verify access explicitly instead of rendering an empty shell on 403.
router.get("/access", (_req, res) => res.status(200).json({ allowed: true }));

router.post("/products", upload.array("images", 3), createProduct);
router.get("/products", getAdminProducts);
router.put("/products/:id", upload.array("images", 3), updateProduct);
router.delete("/products/:id", deleteProduct);

router.get("/orders", getAllOrders);
router.patch("/orders/:orderId/status", updateOrderStatus);

router.get("/customers", getAllCustomers);

router.get("/stats", getDashboardStats);

// PUT: Used for full resource replacement, updating the entire resource
// PATCH: Used for partial resource updates, updating a specific part of the resource

export default router;
