import { createContext, useContext } from "react";

export const ADMIN_TOKEN_KEY = "africart.admin.token";
export const ADMIN_EMAIL_KEY = "africart.admin.email";
export const ADMIN_UNAUTHORIZED_EVENT = "africart:admin-unauthorized";

export const AdminAuthContext = createContext(null);

export function readStoredSession() {
  try {
    const token = sessionStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token) return null;
    return { token, email: sessionStorage.getItem(ADMIN_EMAIL_KEY) || "" };
  } catch {
    return null;
  }
}

export function storeSession({ token, email }) {
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_EMAIL_KEY, email || "");
  } catch {
    // The in-memory session still works when browser storage is unavailable.
  }
}

export function clearStoredSession() {
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_EMAIL_KEY);
  } catch {
    // Ignore storage errors; clearing React state is enough to end the session.
  }
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  return context;
}
