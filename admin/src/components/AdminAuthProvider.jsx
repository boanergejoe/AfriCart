import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ADMIN_EMAIL_KEY,
  ADMIN_TOKEN_KEY,
  AdminAuthContext,
} from "../lib/adminAuth.js";
import axiosInstance from "../lib/axios.js";
import { queryClient } from "../lib/queryClient.js";

function readStoredSession() {
  try {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return null;

    return { token, email: sessionStorage.getItem(ADMIN_EMAIL_KEY) || "" };
  } catch {
    return null;
  }
}

function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);
  const token = session?.token;

  const signIn = useCallback(async ({ email, password }) => {
    const { data } = await axiosInstance.post(
      "/admin/login",
      { email, password },
      { skipAuth: true }
    );

    const nextSession = { token: data.token, email: data.email };
    try {
      sessionStorage.setItem(ADMIN_TOKEN_KEY, nextSession.token);
      sessionStorage.setItem(ADMIN_EMAIL_KEY, nextSession.email);
    } catch {
      // The in-memory session still works if browser storage is unavailable.
    }
    setSession(nextSession);
    return nextSession;
  }, []);

  const signOut = useCallback(() => {
    try {
      sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      sessionStorage.removeItem(ADMIN_EMAIL_KEY);
    } catch {
      // Ignore storage errors; clearing in-memory state is enough to end the session.
    }
    setSession(null);
  }, []);

  useEffect(() => {
    // Never let one admin's cached customer data survive a sign-in switch.
    queryClient.clear();
  }, [token]);

  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use((config) => {
      if (!config.skipAuth && token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401 && !error.config?.skipAuth && token) {
          signOut();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [token, signOut]);

  const value = useMemo(
    () => ({
      email: session?.email || "",
      isAuthenticated: Boolean(session?.token),
      signIn,
      signOut,
    }),
    [session, signIn, signOut]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export default AdminAuthProvider;
