import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createPesapalCheckout,
  getPesapalPaymentStatus,
  handlePesapalCallback,
  handlePesapalIPN,
} from "../controllers/pesapal.controller.js";

const router = Router();

router.use((_req, res, next) => {
  res.set("Cache-Control", "no-store, max-age=0");
  res.set("Pragma", "no-cache");
  next();
});

router.post("/pesapal/checkout", protectRoute, createPesapalCheckout);
router.get("/pesapal/status/:merchantReference", protectRoute, getPesapalPaymentStatus);
router.get("/pesapal/callback", handlePesapalCallback);
router.get("/pesapal/ipn", handlePesapalIPN);
router.post("/pesapal/ipn", handlePesapalIPN);

export default router;
