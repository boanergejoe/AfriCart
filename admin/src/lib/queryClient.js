import { QueryClient } from "@tanstack/react-query";

// A single client is shared by the app, the admin auth provider and the sign-out cleanup.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
