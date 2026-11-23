interface ClerkApiError {
  longMessage?: string;
  message?: string;
}

/** Pulls the most useful Clerk API error message out of an unknown thrown value. */
export function getClerkErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
) {
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (error as { errors?: ClerkApiError[] }).errors;
    const firstError = errors?.find((item) => item.longMessage || item.message);
    if (firstError) return firstError.longMessage || firstError.message || fallback;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
