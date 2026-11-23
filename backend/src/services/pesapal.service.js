import { DEPLOYED_API_URL, ENV } from "../config/env.js";

const API_BASE_URLS = {
  sandbox: "https://cybqa.pesapal.com/pesapalv3",
  live: "https://pay.pesapal.com/v3",
};

const REQUEST_TIMEOUT_MS = 15000;

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

  const callbackUrlValue =
    ENV.PESAPAL_CALLBACK_URL?.trim() ||
    `${DEPLOYED_API_URL.replace(/\/$/, "")}/payment/pesapal/callback`;

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

async function requestJson(url, options, allowProviderErrors = false) {
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
  const hasProviderError =
    data?.error != null &&
    (typeof data.error !== "object" ||
      Object.keys(data.error).length > 0 ||
      String(data.error).length > 0);
  if (
    !response.ok ||
    (hasProviderError && !allowProviderErrors) ||
    (!apiStatus && response.status !== 200)
  ) {
    const message = `PesaPal API request failed (HTTP ${response.status}).`;
    throw new PesapalApiError(message, response.status >= 400 ? response.status : 502);
  }

  return data;
}

async function getAccessToken(configuration) {
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
  return tokenResponse.token;
}

async function authenticatedRequest(path, options = {}, allowProviderErrors = false) {
  const configuration = getApiConfiguration();
  const token = await getAccessToken(configuration);

  return requestJson(
    `${configuration.baseUrl}${path}`,
    {
      ...options,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    },
    allowProviderErrors
  );
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
    { method: "GET" },
    true
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
