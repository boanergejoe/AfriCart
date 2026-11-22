import { ShoppingBagIcon } from "lucide-react";
import { SignIn } from "@clerk/react";

function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-base-100 px-4 py-8">
      <div className="text-center">
        <div className="mx-auto mb-3 size-12 rounded-2xl bg-primary flex items-center justify-center">
          <ShoppingBagIcon className="size-7 text-primary-content" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold">AfriCart</h1>
        <p className="mt-1 text-sm opacity-70">Admin dashboard</p>
      </div>
      <SignIn />
    </div>
  );
}
export default LoginPage;
