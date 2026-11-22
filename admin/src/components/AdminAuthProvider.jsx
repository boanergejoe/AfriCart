import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ADMIN_UNAUTHORIZED_EVENT,
  AdminAuthContext,
  clearStoredSession,
  readStoredSession,
  storeSession,
} from "../lib/adminAuth.js";
import axiosInstance from "../lib/axios.js";
import { queryClient } from "../lib/queryClient.js";

function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(readStoredSession);
  const token = session?.token;
  const previousTokenRef = useRef(token);

  const signIn = useCallback(async ({ email, password }) => {
    const { data } = await axiosInstance.post(
      "/admin/login",
      { email, password },
      { skipAuth: true }
    );

    const nextSession = { token: data.token, email: data.email };
    storeSession(nextSession);
    setSession(nextSession);
    return nextSession;
  }, []);

  const signOut = useCallback(() => {
    clearStoredSession();
    setSession(null);
  }, []);

  useEffect(() => {
    // Only clear cached data on an actual sign-in/sign-out transition. Clearing
    // on the initial mount destroys the in-flight /admin/access query and can
    // leave the app spinning forever after a hard refresh.
    if (previousTokenRef.current === token) return;
    previousTokenRef.current = token;
    queryClient.clear();
  }, [token]);

  useEffect(() => {
    const handleUnauthorized = () => setSession(null);
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

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
