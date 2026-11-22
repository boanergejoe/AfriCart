import { StripeProvider as NativeStripeProvider } from "@stripe/stripe-react-native";
import type { ReactElement } from "react";

export default function StripeProvider({ children }: { children: ReactElement }) {
  return (
    <NativeStripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY!}>
      {children}
    </NativeStripeProvider>
  );
}
