export type PaymentSheetResult =
  | { type: "success" }
  | {
      type: "error";
      stage: "init" | "present" | "unsupported";
      error: { code: string; message: string };
    };

export type PaymentSheet = {
  isAvailable: boolean;
  processPayment: (clientSecret: string) => Promise<PaymentSheetResult>;
};
