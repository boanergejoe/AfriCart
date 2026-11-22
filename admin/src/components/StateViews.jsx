import { AlertCircleIcon, InboxIcon, LoaderCircleIcon } from "lucide-react";

function LoadingState({ label = "Loading data…", compact = false }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 ${compact ? "py-10" : "min-h-56 py-12"}`}
    >
      <LoaderCircleIcon className="size-8 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm text-base-content/60">{label}</span>
    </div>
  );
}

function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-error/10 text-error">
        <AlertCircleIcon className="size-6" aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold">We couldn&apos;t load this data</p>
        <p className="mt-1 text-sm text-base-content/70">{message}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

function EmptyState({ icon, title, description, action }) {
  const Icon = icon || InboxIcon;

  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-base-200 text-base-content/50">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        {description && <p className="mt-1 text-sm text-base-content/70">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export { LoadingState, ErrorState, EmptyState };
