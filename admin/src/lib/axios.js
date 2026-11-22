import axios from "axios";

import {
  ADMIN_UNAUTHORIZED_EVENT,
  clearStoredSession,
  readStoredSession,
} from "./adminAuth.js";

const configuredBaseURL = import.meta.env.VITE_API_URL?.trim();
export const isApiConfigured = Boolean(configuredBaseURL);

const axiosInstance = axios.create({
  baseURL: configuredBaseURL?.replace(/\/$/, "") || undefined,
  timeout: 20_000,
});

// Token lookup happens per request so the first request after a hard refresh is
// authenticated, even before React effects have run.
axiosInstance.interceptors.request.use((config) => {
  const session = readStoredSession();
  if (!config.skipAuth && session?.token) {
    config.headers.Authorization = `Bearer ${session.token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.skipAuth) {
      clearStoredSession();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT));
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
