import { isAxiosError } from "axios";

import palette from "@/lib/theme";

export const capitalizeFirstLetter = (text: string) => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "delivered":
      return palette.primary.DEFAULT;
    case "shipped":
      return palette.accent.info;
    case "pending":
      return palette.accent.warning;
    default:
      return palette.text.tertiary;
  }
};

/** Extracts a user-facing message from Axios/Error/unknown values. */
export const getErrorMessage = (error: unknown, fallback = "Please try again.") => {
  if (isAxiosError<{ message?: string; error?: string }>(error)) {
    return error.response?.data?.message || error.response?.data?.error || error.message || fallback;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

/** Abortable delay for polling loops, so unmounted screens stop waiting. */
export const delay = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);

    function onAbort() {
      clearTimeout(timer);
      reject(abortError());
    }

    signal?.addEventListener("abort", onAbort, { once: true });
  });

const abortError = () => {
  const error = new Error("Operation cancelled.");
  error.name = "AbortError";
  return error;
};
