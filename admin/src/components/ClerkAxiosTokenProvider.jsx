import { useEffect } from "react";
import { useAuth } from "@clerk/react";
import axiosInstance from "../lib/axios";

function ClerkAxiosTokenProvider({ children }) {
  const { getToken } = useAuth();

  useEffect(() => {
    const interceptor = axiosInstance.interceptors.request.use(async (config) => {
      const token = await getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    return () => {
      axiosInstance.interceptors.request.eject(interceptor);
    };
  }, [getToken]);

  return children;
}

export default ClerkAxiosTokenProvider;
