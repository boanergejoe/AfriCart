import { useStripe } from "@stripe/stripe-react-native";
import type { PaymentSheet } from "./paymentSheet.types";

export function usePaymentSheet(): PaymentSheet {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  return {
    isAvailable: true,
    processPayment: async (clientSecret) => {
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: "Your Store Name",
      });

      if (initError) {
        return {
          type: "error",
          stage: "init",
          error: { code: initError.code, message: initError.message },
        };
      }

      const { error: presentError } = await presentPaymentSheet();

      if (presentError) {
        return {
          type: "error",
          stage: "present",
          error: { code: presentError.code, message: presentError.message },
        };
      }

      return { type: "success" };
    },
  };
}
