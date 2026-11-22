import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import axiosInstance from "../lib/axios";
import { queryClient } from "../lib/queryClient";

function ClerkAxiosTokenProvider({ children }) {
  const { getToken, signOut, userId } = useAuth();

  useEffect(() => {
    // Never let cached admin data (customer names, emails, addresses) survive a sign-in switch.
    queryClient.clear();
  }, [userId]);

  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(async (config) => {
      if (config.skipAuth) return config;

      try {
        const token = await getToken();
        if (token) config.headers.Authorization = `Bearer ${token}`;
      } catch {
        // Let the response from the server decide; a 401 will sign the user out below.
      }

      return config;
    });

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && userId) {
          queryClient.clear();
          await signOut();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [getToken, signOut, userId]);

  return children;
}

export default ClerkAxiosTokenProvider;
