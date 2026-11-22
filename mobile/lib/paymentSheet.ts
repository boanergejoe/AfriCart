import type { PaymentSheet } from "./paymentSheet.types";

export function usePaymentSheet(): PaymentSheet {
  return {
    isAvailable: false,
    processPayment: async () => ({
      type: "error",
      stage: "unsupported",
      error: {
        code: "web_unsupported",
        message: "Stripe checkout is only available in the iOS and Android apps.",
      },
    }),
  };
}
