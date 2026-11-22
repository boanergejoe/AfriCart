import { LoaderCircleIcon } from "lucide-react";

function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-base-200/60"
    >
      <LoaderCircleIcon className="size-10 animate-spin text-primary" aria-hidden="true" />
      <span className="sr-only">Loading AfriCart admin</span>
    </div>
  );
}

export default PageLoader;
