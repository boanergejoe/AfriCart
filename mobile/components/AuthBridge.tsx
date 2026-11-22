import { useEffect, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-expo";
import * as Sentry from "@sentry/react-native";

import { configureApiAuth, setUnauthorizedHandler } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";

/** Connects Clerk to the API client and prevents cached data leaking between users. */
export default function AuthBridge({ children }: { children: ReactNode }) {
  const { getToken, signOut, userId } = useAuth();

  useEffect(() => {
    configureApiAuth(getToken);
  }, [getToken]);

  useEffect(() => {
    queryClient.clear();
    Sentry.setUser(userId ? { id: userId } : null);
  }, [userId]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (userId) {
        queryClient.clear();
        void signOut();
      }
    });
    return () => setUnauthorizedHandler(null);
  }, [userId, signOut]);

  return children;
}
