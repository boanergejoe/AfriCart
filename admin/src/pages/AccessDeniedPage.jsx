import { RotateCcwIcon, ShieldXIcon } from "lucide-react";

import { useAdminAuth } from "../lib/adminAuth.js";

function getAccessMessage(error) {
  const status = error?.response?.status;

  if (status === 503) {
    return {
      title: "Admin login is not configured",
      description:
        "The API is missing its admin credentials. Configure ADMIN_EMAIL, ADMIN_PASSWORD_HASH and ADMIN_SESSION_SECRET, then restart the backend.",
    };
  }
  if (!error?.response) {
    return {
      title: "Cannot reach the server",
      description: "AfriCart Admin could not contact the API. Check your connection and try again.",
    };
  }
  return {
    title: "Access denied",
    description:
      "Your session is no longer valid. Sign in again with the configured admin account to continue.",
  };
}

function AccessDeniedPage({ error, onRetry }) {
  const { signOut } = useAdminAuth();
  const { title, description } = getAccessMessage(error);

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-6">
      <div role="alert" className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-error/10 text-error">
            <ShieldXIcon className="size-7" aria-hidden="true" />
          </div>
          <h1 className="card-title mt-2 text-2xl">{title}</h1>
          <p className="text-sm text-base-content/70">{description}</p>
          <div className="card-actions mt-4 justify-center gap-2">
            {onRetry && (
              <button type="button" className="btn btn-ghost" onClick={onRetry}>
                <RotateCcwIcon className="size-4" aria-hidden="true" />
                Retry
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={signOut}>
              Use another account
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AccessDeniedPage;
