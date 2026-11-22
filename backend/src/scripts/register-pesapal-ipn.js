import { ENV } from "../config/env.js";
import { registerPesapalIPN } from "../services/pesapal.service.js";

async function registerIPN() {
  if (!ENV.PESAPAL_IPN_URL) {
    throw new Error("Set PESAPAL_IPN_URL to the public backend /api/payment/pesapal/ipn URL.");
  }

  const notificationType = process.env.PESAPAL_IPN_NOTIFICATION_TYPE || "GET";
  const response = await registerPesapalIPN(ENV.PESAPAL_IPN_URL, notificationType);
  if (!response.ipn_id) throw new Error("PesaPal did not return an IPN ID.");

  console.log(`PESAPAL_IPN_ID=${response.ipn_id}`);
  console.log("Add this value to the backend .env file, then restart the backend.");
}

registerIPN().catch((error) => {
  console.error("Unable to register PesaPal IPN:", error.message);
  process.exitCode = 1;
});
