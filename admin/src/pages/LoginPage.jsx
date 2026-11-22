import { useState } from "react";
import {
  EyeIcon,
  EyeOffIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  MailIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { useAdminAuth } from "../lib/adminAuth.js";
import { getErrorMessage } from "../lib/utils.js";
import { useToast } from "../lib/toast.js";

const EMPTY_FORM = { email: "", password: "" };

function LoginPage() {
  const { signIn } = useAdminAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (Array.from(form.password).length < 5) {
      setError("Password must be at least 5 characters.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(form);
      notify("Signed in to AfriCart admin.", "success");
      navigate(location.state?.from || "/dashboard", { replace: true });
    } catch (requestError) {
      const message = getErrorMessage(requestError, "Unable to sign in. Please try again.");
      setError(message);
      notify(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <h2 className="text-xl font-semibold">Sign in</h2>
            <p className="mt-1 text-sm text-base-content/60">Use the configured admin credentials.</p>
          </div>

          {error && (
            <div role="alert" className="alert alert-error text-sm">
              <span>{error}</span>
            </div>
          )}

          <div className="form-control !gap-1">
            <span className="label-text font-medium">Email address</span>
            <div className="input input-bordered flex w-full items-center gap-2">
              <MailIcon className="size-4 text-base-content/50" aria-hidden="true" />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField("email")}
                placeholder="admin@example.com"
                autoComplete="username"
                required
                disabled={isSubmitting}
                className="w-full grow bg-transparent"
              />
            </div>
          </div>

          <div className="form-control !gap-1">
            <span className="label-text font-medium">Password</span>
            <div className="input input-bordered flex w-full items-center gap-2">
              <LockKeyholeIcon className="size-4 text-base-content/50" aria-hidden="true" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={updateField("password")}
                placeholder="At least 5 characters"
                autoComplete="current-password"
                required
                minLength={5}
                disabled={isSubmitting}
                className="w-full grow bg-transparent"
              />
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" aria-hidden="true" />
                ) : (
                  <EyeIcon className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="flex items-center gap-2 text-xs text-base-content/60">
        <ShieldCheckIcon className="size-4" aria-hidden="true" />
        Sessions expire after 12 hours
      </p>
    </main>
  );
}

export default LoginPage;
