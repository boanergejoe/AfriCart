import { createContext, useContext } from "react";

export const ADMIN_TOKEN_KEY = "africart.admin.token";
export const ADMIN_EMAIL_KEY = "africart.admin.email";

export const AdminAuthContext = createContext(null);

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used inside AdminAuthProvider.");
  return context;
}
