import crypto from "node:crypto";
import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { User } from "../models/user.model.js";
import {
  getPesapalCheckoutSettings,
  getPesapalTransactionStatus,
  PesapalApiError,
  PesapalConfigurationError,
  submitPesapalOrder,
} from "../services/pesapal.service.js";
import { normalizePesapalTransaction, cartMatchesOrder } from "../utils/pesapal-payment.js";
import { calculateOrderTotals } from "../utils/order-pricing.js";

function readAddress(input) {
  const fields = ["fullName", "streetAddress", "city", "state", "zipCode", "phoneNumber"];
  if (!input || fields.some((field) => typeof input[field] !== "string" || !input[field].trim())) {
    return null;
  }

  return Object.fromEntries(fields.map((field) => [field, input[field].trim()]));
}

function splitName(fullName) {
  const [firstName, ...lastName] = fullName.split(/\s+/);
  return { firstName, lastName: lastName.join(" ") || firstName };
}

function toPesapalBillingAddress(address, email) {
  const { firstName, lastName } = splitName(address.fullName);
  const billingAddress = {
    email_address: email,
    phone_number: address.phoneNumber.replace(/[^\d+]/g, ""),
    first_name: firstName,
    last_name: lastName,
    line_1: address.streetAddress,
    city: address.city,
  };

  if (address.state.length <= 3) billingAddress.state = address.state;
  if (/^\d+$/.test(address.zipCode)) billingAddress.zip_code = Number(address.zipCode);

  return billingAddress;
}

function readNotification(req) {
  const source = req.method === "GET" ? req.query : req.body || {};
  const value = (pascalCase, camelCase) => source[pascalCase] ?? source[camelCase];

  return {
    type: String(value("OrderNotificationType", "orderNotificationType") || ""),
    trackingId: String(value("OrderTrackingId", "orderTrackingId") || ""),
    merchantReference: String(value("OrderMerchantReference", "orderMerchantReference") || ""),
  };
}

async function updateOrderFromTransaction(orderId, trackingId, transaction) {
  const order = await Order.findById(orderId);
  if (!order || order.paymentResult?.provider !== "pesapal") {
    throw new Error("PesaPal order was not found.");
  }
  if (
    transaction.order_tracking_id &&
    String(transaction.order_tracking_id) !== String(trackingId)
  ) {
    throw new Error("PesaPal transaction tracking ID does not match the order.");
  }

  const paymentStatus = normalizePesapalTransaction(transaction, {
    merchantReference: order.paymentResult.id,
    amountCents: Math.round(order.totalPrice * 100),
    currency: order.paymentResult.currency || "USD",
  });

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const currentOrder = await Order.findById(orderId).session(session);
      if (!currentOrder || currentOrder.paymentResult?.provider !== "pesapal") {
        throw new Error("PesaPal order was not found.");
      }

      const existingTrackingId = currentOrder.paymentResult.orderTrackingId;
      if (existingTrackingId && existingTrackingId !== trackingId) {
        throw new Error("PesaPal tracking ID does not match the order.");
      }

      const currentStatus = currentOrder.paymentResult.status;
      if (currentStatus === "reversed") return;
      if (currentStatus === "succeeded" && paymentStatus !== "reversed") return;
      if (paymentStatus === "pending" && ["failed", "invalid"].includes(currentStatus)) return;

      currentOrder.paymentResult.orderTrackingId = trackingId;
      currentOrder.paymentResult.status = paymentStatus;
      currentOrder.paymentResult.paymentMethod =
        transaction.payment_method || currentOrder.paymentResult.paymentMethod;
      currentOrder.paymentResult.confirmationCode =
        transaction.confirmation_code || currentOrder.paymentResult.confirmationCode;
      currentOrder.paymentResult.paymentAccount =
        transaction.payment_account || currentOrder.paymentResult.paymentAccount;
      currentOrder.paymentResult.description =
        transaction.description || currentOrder.paymentResult.description;

      if (paymentStatus === "succeeded" && !currentOrder.stockDeducted) {
        let inventoryIssue = false;

        for (const item of currentOrder.orderItems) {
          const result = await Product.updateOne(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session }
          );
          if (result.modifiedCount !== 1) inventoryIssue = true;
        }

        currentOrder.stockDeducted = true;
        currentOrder.paymentResult.inventoryIssue = inventoryIssue;

        const cart = await Cart.findOne({ user: currentOrder.user }).session(session);
        if (cart && cartMatchesOrder(cart.items, currentOrder.orderItems)) {
          cart.items = [];
          await cart.save({ session });
        }
      }

      await currentOrder.save({ session });
    });
  } finally {
    await session.endSession();
  }

  return Order.findById(orderId);
}

export async function createPesapalCheckout(req, res) {
  const address = readAddress(req.body?.shippingAddress);
  if (!address) {
    return res.status(400).json({ error: "Select a complete shipping address before checkout." });
  }
  const phoneNumber = address.phoneNumber.replace(/[^\d+]/g, "");
  if (!/^\+?\d{7,15}$/.test(phoneNumber)) {
    return res.status(400).json({ error: "Enter a valid phone number in your shipping address." });
  }

  const expectedTotalCents = Number(req.body?.expectedTotalCents);
  if (!Number.isSafeInteger(expectedTotalCents) || expectedTotalCents <= 0) {
    return res.status(400).json({ error: "The cart total is invalid. Refresh your cart and try again." });
  }

  let settings;
  try {
    settings = getPesapalCheckoutSettings();
  } catch (error) {
    if (error instanceof PesapalConfigurationError) {
      return res.status(503).json({ error: error.message });
    }
    throw error;
  }

  try {
    const user = await User.findById(req.user._id);
    if (!user?.email) {
      return res.status(400).json({ error: "An email address is required for PesaPal checkout." });
    }

    const cart = await Cart.findOne({ clerkId: user.clerkId }).populate("items.product");
    if (!cart?.items?.length) {
      return res.status(400).json({ error: "Your cart is empty." });
    }

    const orderItems = [];
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      if (!product) {
        return res.status(409).json({ error: "A product in your cart is no longer available." });
      }
      if (!product.images?.[0]) {
        return res.status(409).json({ error: `${product.name} is not available for checkout right now.` });
      }
      if (!Number.isInteger(cartItem.quantity) || cartItem.quantity < 1) {
        return res.status(400).json({ error: "Your cart contains an invalid quantity." });
      }
      if (product.stock < cartItem.quantity) {
        return res.status(409).json({ error: `Insufficient stock for ${product.name}.` });
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: cartItem.quantity,
        image: product.images[0],
      });
    }

    const totals = calculateOrderTotals(orderItems);
    if (totals.totalCents !== expectedTotalCents) {
      return res.status(409).json({
        error: "The cart total changed. Refresh your cart and review the updated amount before paying.",
      });
    }

    const activeOrder = await Order.findOne({
      clerkId: user.clerkId,
      "paymentResult.provider": "pesapal",
      "paymentResult.status": { $in: ["initiating", "pending"] },
    }).sort({ createdAt: -1 });

    if (activeOrder) {
      if (!activeOrder.paymentResult.orderTrackingId) {
        return res.status(409).json({
          error: "A PesaPal payment is already being prepared. Check My Orders before trying again.",
        });
      }

      let updatedActiveOrder;
      try {
        const transaction = await getPesapalTransactionStatus(
          activeOrder.paymentResult.orderTrackingId
        );
        updatedActiveOrder = await updateOrderFromTransaction(
          activeOrder._id,
          activeOrder.paymentResult.orderTrackingId,
          transaction
        );
      } catch (error) {
        console.error("Unable to check existing PesaPal payment:", error.message);
        return res.status(502).json({
          error: "An earlier PesaPal payment is still unresolved. Check My Orders before trying again.",
        });
      }

      if (updatedActiveOrder.paymentResult.status === "succeeded") {
        return res.status(409).json({
          error: "This cart already has a confirmed payment. Check My Orders for the completed order.",
        });
      }

      if (["initiating", "pending"].includes(updatedActiveOrder.paymentResult.status)) {
        if (
          !cartMatchesOrder(cart.items, updatedActiveOrder.orderItems) ||
          Math.round(updatedActiveOrder.totalPrice * 100) !== totals.totalCents
        ) {
          return res.status(409).json({
            error: "An earlier payment for a different cart is still unresolved. Check My Orders first.",
          });
        }

        if (!updatedActiveOrder.paymentResult.redirectUrl) {
          return res.status(409).json({
            error: "An earlier PesaPal payment is still pending. Check My Orders before trying again.",
          });
        }

        return res.status(200).json({
          orderId: updatedActiveOrder._id,
          merchantReference: updatedActiveOrder.paymentResult.id,
          redirectUrl: updatedActiveOrder.paymentResult.redirectUrl,
          amountCents: totals.totalCents,
          currency: updatedActiveOrder.paymentResult.currency,
        });
      }
    }

    const merchantReference = `AFRI-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const order = await Order.create({
      user: user._id,
      clerkId: user.clerkId,
      orderItems,
      shippingAddress: address,
      paymentResult: {
        id: merchantReference,
        status: "initiating",
        provider: "pesapal",
        amount: totals.total,
        currency: settings.currency,
      },
      totalPrice: totals.total,
    });

    try {
      const providerOrder = await submitPesapalOrder({
        id: merchantReference,
        currency: settings.currency,
        amount: totals.total,
        description: `AfriCart order ${merchantReference}`,
        callback_url: settings.callbackUrl,
        cancellation_url: settings.callbackUrl,
        redirect_mode: "TOP_WINDOW",
        notification_id: settings.notificationId,
        billing_address: toPesapalBillingAddress(address, user.email),
      });

      const redirectUrl = new URL(providerOrder.redirect_url);
      if (
        redirectUrl.protocol !== "https:" ||
        !redirectUrl.hostname.endsWith(".pesapal.com") ||
        String(providerOrder.merchant_reference) !== merchantReference ||
        !providerOrder.order_tracking_id
      ) {
        throw new PesapalApiError("PesaPal returned an invalid checkout response.");
      }

      await Order.updateOne(
        { _id: order._id, "paymentResult.status": "initiating" },
        {
          $set: {
            "paymentResult.orderTrackingId": String(providerOrder.order_tracking_id),
            "paymentResult.redirectUrl": redirectUrl.toString(),
            "paymentResult.status": "pending",
          },
        }
      );

      return res.status(201).json({
        orderId: order._id,
        merchantReference,
        redirectUrl: redirectUrl.toString(),
        amountCents: totals.totalCents,
        currency: settings.currency,
      });
    } catch (error) {
      await Order.updateOne(
        { _id: order._id, "paymentResult.status": "initiating" },
        { $set: { "paymentResult.status": "failed" } }
      );
      console.error("PesaPal checkout creation failed:", error.message);
      return res.status(502).json({ error: "PesaPal could not start the payment. Please try again." });
    }
  } catch (error) {
    console.error("Error creating PesaPal checkout:", error);
    return res.status(500).json({ error: "Unable to prepare PesaPal checkout." });
  }
}

export async function getPesapalPaymentStatus(req, res) {
  try {
    const { merchantReference } = req.params;
    const order = await Order.findOne({
      clerkId: req.user.clerkId,
      "paymentResult.id": merchantReference,
      "paymentResult.provider": "pesapal",
    });

    if (!order) return res.status(404).json({ error: "Payment order not found." });

    const requestedTrackingId = req.query.orderTrackingId;
    if (
      requestedTrackingId &&
      String(requestedTrackingId) !== String(order.paymentResult.orderTrackingId || "")
    ) {
      return res.status(400).json({ error: "PesaPal tracking ID does not match this order." });
    }

    if (order.paymentResult.orderTrackingId) {
      const transaction = await getPesapalTransactionStatus(order.paymentResult.orderTrackingId);
      const updatedOrder = await updateOrderFromTransaction(
        order._id,
        order.paymentResult.orderTrackingId,
        transaction
      );

      return res.status(200).json({
        merchantReference,
        orderId: updatedOrder._id,
        paymentStatus: updatedOrder.paymentResult.status,
        inventoryIssue: updatedOrder.paymentResult.inventoryIssue || false,
        totalPrice: updatedOrder.totalPrice,
      });
    }

    return res.status(200).json({
      merchantReference,
      orderId: order._id,
      paymentStatus: order.paymentResult.status,
      inventoryIssue: false,
      totalPrice: order.totalPrice,
    });
  } catch (error) {
    console.error("Error checking PesaPal payment status:", error.message);
    const statusCode = error instanceof PesapalConfigurationError ? 503 : 502;
    return res.status(statusCode).json({ error: "Unable to verify payment status with PesaPal." });
  }
}

export async function handlePesapalIPN(req, res) {
  const notification = readNotification(req);
  const response = (status) =>
    res.status(200).json({
      orderNotificationType: notification.type || "IPNCHANGE",
      orderTrackingId: notification.trackingId,
      orderMerchantReference: notification.merchantReference,
      status,
    });

  if (
    notification.type !== "IPNCHANGE" ||
    !notification.trackingId ||
    !notification.merchantReference
  ) {
    return response(500);
  }

  try {
    const order = await Order.findOne({
      "paymentResult.id": notification.merchantReference,
      "paymentResult.provider": "pesapal",
    });
    if (!order) return response(500);

    const savedTrackingId = order.paymentResult.orderTrackingId;
    if (savedTrackingId && savedTrackingId !== notification.trackingId) {
      return response(500);
    }

    const transaction = await getPesapalTransactionStatus(notification.trackingId);
    await updateOrderFromTransaction(order._id, notification.trackingId, transaction);
    return response(200);
  } catch (error) {
    console.error("PesaPal IPN processing failed:", error.message);
    return response(500);
  }
}

function paymentCallbackPage(status) {
  const messages = {
    succeeded: [
      "Payment confirmed",
      "PesaPal confirmed your payment. Your AfriCart order has been updated.",
    ],
    failed: [
      "Payment not completed",
      "PesaPal did not complete this payment. Check My Orders before trying again.",
    ],
    invalid: [
      "Payment is not confirmed",
      "PesaPal has not confirmed this payment. Check My Orders before making another payment.",
    ],
    reversed: [
      "Payment reversed",
      "PesaPal reports that this payment was reversed. Contact AfriCart support if you need help.",
    ],
    pending: [
      "Payment processing",
      "PesaPal is still processing this payment. Do not pay again; check My Orders for updates.",
    ],
    unavailable: [
      "Unable to verify payment",
      "AfriCart could not verify this payment right now. Check My Orders before trying again.",
    ],
  };
  const [title, message] = messages[status] || messages.unavailable;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>${title} | AfriCart</title>
    <style>
      body{margin:0;min-height:100vh;display:grid;place-items:center;background:#101411;color:#f4f7f4;font:16px system-ui,sans-serif}
      main{width:min(90vw,520px);box-sizing:border-box;padding:36px;border:1px solid #29352d;border-radius:20px;background:#171e19;text-align:center}
      h1{margin:0 0 14px;font-size:26px}
      p{margin:0;color:#bdc8bf;line-height:1.6}
      strong{color:#49d17d}
    </style>
  </head>
  <body>
    <main>
      <strong>AfriCart</strong>
      <h1>${title}</h1>
      <p>${message}</p>
      <p style="margin-top:20px">You can return to the AfriCart app now.</p>
    </main>
  </body>
</html>`;
}

export async function handlePesapalCallback(req, res) {
  const callback = readNotification(req);
  const sendPage = (status, httpStatus = 200) =>
    res
      .status(httpStatus)
      .set("Cache-Control", "no-store")
      .set("X-Content-Type-Options", "nosniff")
      .type("html")
      .send(paymentCallbackPage(status));

  if (!callback.trackingId || !callback.merchantReference) {
    return sendPage("unavailable", 400);
  }

  try {
    const order = await Order.findOne({
      "paymentResult.id": callback.merchantReference,
      "paymentResult.provider": "pesapal",
    });
    if (!order) return sendPage("unavailable", 404);

    const savedTrackingId = order.paymentResult.orderTrackingId;
    if (savedTrackingId && savedTrackingId !== callback.trackingId) {
      return sendPage("unavailable", 400);
    }

    const transaction = await getPesapalTransactionStatus(callback.trackingId);
    const updatedOrder = await updateOrderFromTransaction(
      order._id,
      callback.trackingId,
      transaction
    );

    return sendPage(updatedOrder.paymentResult.status);
  } catch (error) {
    console.error("PesaPal browser callback verification failed:", error.message);
    return sendPage("unavailable", 502);
  }
}
