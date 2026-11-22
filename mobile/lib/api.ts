import axios from "axios";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
if (!configuredApiUrl) {
  throw new Error("Set EXPO_PUBLIC_API_URL before building or starting the AfriCart app.");
}

const api = axios.create({
  baseURL: configuredApiUrl.replace(/\/$/, ""),
  headers: { "Content-Type": "application/json" },
  timeout: 20_000,
});

let tokenProvider: (() => Promise<string | null>) | null = null;
let unauthorizedHandler: (() => void) | null = null;

// Installed once by AuthBridge so every screen shares a single interceptor and token getter.
export const configureApiAuth = (provider: () => Promise<string | null>) => {
  tokenProvider = provider;
};

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

api.interceptors.request.use(async (config) => {
  const token = (await tokenProvider?.()) ?? null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  else delete config.headers.Authorization;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) unauthorizedHandler?.();
    return Promise.reject(error);
  }
);

export const useApi = () => api;

export default api;
