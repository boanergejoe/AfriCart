import { LoaderCircleIcon } from "lucide-react";

function PageLoader({ compact = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={
        compact
          ? "flex min-h-52 flex-col items-center justify-center gap-2 py-10"
          : "flex min-h-screen flex-col items-center justify-center gap-3 bg-base-200/60"
      }
    >
      <LoaderCircleIcon className={compact ? "size-7 animate-spin text-primary" : "size-10 animate-spin text-primary"} aria-hidden="true" />
      <span className={compact ? "text-sm text-base-content/60" : "text-sm font-medium text-base-content/60"}>
        {compact ? "Loading view…" : "Loading AfriCart Admin…"}
      </span>
    </div>
  );
}

export default PageLoader;
