import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { createPaymentIntent, handleWebhook } from "../controllers/payment.controller.js";
import {
  createPesapalCheckout,
  getPesapalPaymentStatus,
  handlePesapalCallback,
  handlePesapalIPN,
} from "../controllers/pesapal.controller.js";

const router = Router();

router.post("/create-intent", protectRoute, createPaymentIntent);
router.post("/pesapal/checkout", protectRoute, createPesapalCheckout);
router.get("/pesapal/status/:merchantReference", protectRoute, getPesapalPaymentStatus);
router.get("/pesapal/callback", handlePesapalCallback);
router.get("/pesapal/ipn", handlePesapalIPN);
router.post("/pesapal/ipn", handlePesapalIPN);

// No auth needed - Stripe validates via signature
router.post("/webhook", handleWebhook);

export default router;
