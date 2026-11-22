import { ENV } from "../config/env.js";

const API_BASE_URLS = {
  sandbox: "https://cybqa.pesapal.com/pesapalv3",
  live: "https://pay.pesapal.com/v3",
};

const REQUEST_TIMEOUT_MS = 15000;
let cachedToken;
let cachedTokenExpiresAt = 0;
let cachedTokenBaseUrl;

export class PesapalConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = "PesapalConfigurationError";
  }
}

export class PesapalApiError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = "PesapalApiError";
    this.statusCode = statusCode;
  }
}

function getApiConfiguration() {
  const environment = String(ENV.PESAPAL_ENV || "sandbox").toLowerCase();
  const baseUrl = API_BASE_URLS[environment];
  if (!baseUrl) {
    throw new PesapalConfigurationError("PESAPAL_ENV must be either sandbox or live.");
  }

  const consumerKey = ENV.PESAPAL_CONSUMER_KEY?.trim();
  const consumerSecret = ENV.PESAPAL_CONSUMER_SECRET?.trim();
  if (!consumerKey || !consumerSecret) {
    throw new PesapalConfigurationError("PesaPal consumer credentials are not configured.");
  }

  return { environment, baseUrl, consumerKey, consumerSecret };
}

export function getPesapalCheckoutSettings() {
  const { environment } = getApiConfiguration();
  const notificationId = ENV.PESAPAL_IPN_ID?.trim();
  if (!notificationId) {
    throw new PesapalConfigurationError("PESAPAL_IPN_ID is not configured.");
  }

  const callbackUrlValue = ENV.PESAPAL_CALLBACK_URL?.trim();
  if (!callbackUrlValue) {
    throw new PesapalConfigurationError("PESAPAL_CALLBACK_URL is not configured.");
  }

  let callbackUrl;
  try {
    callbackUrl = new URL(callbackUrlValue);
  } catch {
    throw new PesapalConfigurationError("PESAPAL_CALLBACK_URL must be a valid public URL.");
  }

  if (callbackUrl.protocol !== "https:") {
    throw new PesapalConfigurationError("PESAPAL_CALLBACK_URL must use HTTPS.");
  }

  const currency = String(ENV.PESAPAL_CURRENCY || "USD").toUpperCase();
  if (currency !== "USD") {
    throw new PesapalConfigurationError(
      "AfriCart prices are displayed in USD; set PESAPAL_CURRENCY=USD."
    );
  }

  return {
    environment,
    callbackUrl: callbackUrl.toString(),
    currency,
    notificationId,
  };
}

async function requestJson(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let response;

  try {
    response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    const message = controller.signal.aborted
      ? "PesaPal API request timed out."
      : "Unable to reach the PesaPal API.";
    throw new PesapalApiError(message, 502);
  } finally {
    clearTimeout(timeout);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new PesapalApiError("PesaPal returned an invalid response.", 502);
  }

  const apiStatus = data?.status == null ? "" : String(data.status);
  if (!response.ok || data?.error || (apiStatus && apiStatus !== "200")) {
    const message = `PesaPal API request failed (HTTP ${response.status}).`;
    throw new PesapalApiError(message, response.status >= 400 ? response.status : 502);
  }

  return data;
}

async function getAccessToken(configuration) {
  if (
    cachedToken &&
    cachedTokenBaseUrl === configuration.baseUrl &&
    cachedTokenExpiresAt > Date.now() + 15000
  ) {
    return cachedToken;
  }

  const tokenResponse = await requestJson(`${configuration.baseUrl}/api/Auth/RequestToken`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      consumer_key: configuration.consumerKey,
      consumer_secret: configuration.consumerSecret,
    }),
  });

  if (typeof tokenResponse.token !== "string" || !tokenResponse.token) {
    throw new PesapalApiError("PesaPal did not return an access token.", 502);
  }

  const expiry = Date.parse(tokenResponse.expiryDate);
  cachedToken = tokenResponse.token;
  cachedTokenExpiresAt = Number.isFinite(expiry) ? expiry : Date.now() + 4 * 60 * 1000;
  cachedTokenBaseUrl = configuration.baseUrl;

  return cachedToken;
}

async function authenticatedRequest(path, options = {}) {
  const configuration = getApiConfiguration();
  const token = await getAccessToken(configuration);

  return requestJson(`${configuration.baseUrl}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

export async function submitPesapalOrder(order) {
  return authenticatedRequest("/api/Transactions/SubmitOrderRequest", {
    method: "POST",
    body: JSON.stringify(order),
  });
}

export async function getPesapalTransactionStatus(orderTrackingId) {
  const query = new URLSearchParams({ orderTrackingId });
  return authenticatedRequest(
    `/api/Transactions/GetTransactionStatus?${query.toString()}`,
    { method: "GET" }
  );
}

export async function registerPesapalIPN(url, notificationType = "GET") {
  const notificationUrl = new URL(url);
  if (notificationUrl.protocol !== "https:") {
    throw new PesapalConfigurationError("PESAPAL_IPN_URL must use HTTPS.");
  }

  if (!["GET", "POST"].includes(notificationType)) {
    throw new PesapalConfigurationError("PESAPAL_IPN_NOTIFICATION_TYPE must be GET or POST.");
  }

  return authenticatedRequest("/api/URLSetup/RegisterIPN", {
    method: "POST",
    body: JSON.stringify({
      url: notificationUrl.toString(),
      ipn_notification_type: notificationType,
    }),
  });
}
