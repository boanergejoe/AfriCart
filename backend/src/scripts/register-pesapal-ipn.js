import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ENV } from "../config/env.js";
import { registerPesapalIPN } from "../services/pesapal.service.js";

const envFilePath = fileURLToPath(new URL("../../.env", import.meta.url));

async function saveEnvValue(name, value) {
  let contents = await readFile(envFilePath, "utf8");
  const entry = new RegExp(`^\\s*${name}\\s*=.*$`, "m");
  const line = `${name}=${value}`;

  if (entry.test(contents)) {
    contents = contents.replace(entry, line);
  } else {
    contents = `${contents}${contents.endsWith("\n") ? "" : "\n"}${line}\n`;
  }

  await writeFile(envFilePath, contents, "utf8");
}

async function registerIPN() {
  if (!ENV.PESAPAL_IPN_URL) {
    throw new Error("Set PESAPAL_IPN_URL to the public backend /api/payment/pesapal/ipn URL.");
  }
  if (ENV.PESAPAL_IPN_ID) {
    console.log("PESAPAL_IPN_ID is already configured; no additional IPN was registered.");
    return;
  }

  const notificationType = process.env.PESAPAL_IPN_NOTIFICATION_TYPE || "GET";
  const response = await registerPesapalIPN(ENV.PESAPAL_IPN_URL, notificationType);
  if (!response.ipn_id) throw new Error("PesaPal did not return an IPN ID.");

  await saveEnvValue("PESAPAL_IPN_ID", response.ipn_id);
  console.log("PesaPal IPN registered and its ID saved in backend/.env. Restart the backend.");
}

registerIPN().catch((error) => {
  console.error("Unable to register PesaPal IPN:", error.message);
  process.exitCode = 1;
});
