import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import * as Sentry from "@sentry/react-native";

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const getStatusCode = (error: unknown): number | undefined =>
  typeof error === "object" && error !== null && "response" in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      Sentry.captureException(error, {
        tags: { type: "react-query-error", queryKey: String(query.queryKey[0] ?? "unknown") },
        extra: { errorMessage: getErrorMessage(error), statusCode: getStatusCode(error) },
      });
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      Sentry.captureException(error, {
        tags: { type: "react-query-mutation-error" },
        extra: { errorMessage: getErrorMessage(error), statusCode: getStatusCode(error) },
      });
    },
  }),
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});
