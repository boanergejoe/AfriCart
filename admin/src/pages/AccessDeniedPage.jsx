import { ShieldXIcon } from "lucide-react";

import { useAdminAuth } from "../lib/adminAuth.js";

function AccessDeniedPage() {
  const { signOut } = useAdminAuth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-base-200 p-6">
      <div role="alert" className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-error/10 text-error">
            <ShieldXIcon className="size-7" aria-hidden="true" />
          </div>
          <h1 className="card-title mt-2 text-2xl">Access denied</h1>
          <p className="text-sm text-base-content/70">
            Your session is no longer valid. Sign in again with the configured admin account to
            continue.
          </p>
          <div className="card-actions mt-4 justify-center">
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
