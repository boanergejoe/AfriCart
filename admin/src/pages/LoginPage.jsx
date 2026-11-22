import { ShoppingBagIcon, ShieldCheckIcon } from "lucide-react";
import { SignIn } from "@clerk/react";

function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-base-200 px-4 py-10">
      <div className="text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-content">
          <ShoppingBagIcon className="size-7" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">AfriCart</h1>
        <p className="muted mt-1 text-sm">Admin console · Authorized staff only</p>
      </div>

      <div className="surface w-full max-w-md p-4 sm:p-6">
        <SignIn forceRedirectUrl="/dashboard" />
      </div>

      <p className="flex items-center gap-2 text-xs text-base-content/60">
        <ShieldCheckIcon className="size-4" aria-hidden="true" />
        Protected by Clerk secure authentication
      </p>
    </main>
  );
}

export default LoginPage;
