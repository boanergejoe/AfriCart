import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import SafeScreen from "@/components/SafeScreen";
import { useApi } from "@/lib/api";
import palette from "@/lib/theme";
import { delay } from "@/lib/utils";

type PaymentStatus = "initiating" | "pending" | "succeeded" | "failed" | "invalid" | "reversed";
type CallbackState = PaymentStatus | "checking" | "unavailable" | "unauthorized";

interface PaymentStatusResponse {
  paymentStatus: PaymentStatus;
  inventoryIssue?: boolean;
}

const PAYMENT_STATUSES: PaymentStatus[] = [
  "initiating",
  "pending",
  "succeeded",
  "failed",
  "invalid",
  "reversed",
];

const MAX_STATUS_CHECKS = 15;
const CHECK_INTERVAL_MS = 4000;

const firstValue = (value?: string | string[]) =>
  Array.isArray(value) ? value[0] : value;

const isPaymentStatus = (value?: string): value is PaymentStatus =>
  Boolean(value && PAYMENT_STATUSES.includes(value as PaymentStatus));

const PaymentCallbackScreen = () => {
  const {
    OrderMerchantReference: merchantReferenceParam,
    OrderTrackingId: trackingIdParam,
    status: statusParam,
  } = useLocalSearchParams<{
    OrderMerchantReference?: string | string[];
    OrderTrackingId?: string | string[];
    status?: string | string[];
  }>();
  const merchantReference = firstValue(merchantReferenceParam);
  const trackingId = firstValue(trackingIdParam);
  const statusHint = firstValue(statusParam);
  const api = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [state, setState] = useState<CallbackState>(
    isPaymentStatus(statusHint) ? statusHint : "checking"
  );
  const [inventoryIssue, setInventoryIssue] = useState(false);

  useEffect(() => {
    if (!merchantReference) {
      setState("unavailable");
      return undefined;
    }

    const abortController = new AbortController();

    const checkPayment = async () => {
      try {
        for (let attempt = 0; attempt < MAX_STATUS_CHECKS; attempt += 1) {
          const { data } = await api.get<PaymentStatusResponse>(
            `/payment/pesapal/status/${encodeURIComponent(merchantReference)}`,
            { params: trackingId ? { orderTrackingId: trackingId } : undefined }
          );
          if (abortController.signal.aborted) return;

          setInventoryIssue(Boolean(data.inventoryIssue));
          if (data.paymentStatus === "succeeded") {
            setState("succeeded");
            await queryClient.invalidateQueries({ queryKey: ["cart"] });
            await queryClient.invalidateQueries({ queryKey: ["orders"] });
            return;
          }

          if (["failed", "invalid", "reversed"].includes(data.paymentStatus)) {
            setState(data.paymentStatus);
            return;
          }

          await delay(CHECK_INTERVAL_MS, abortController.signal);
        }

        if (!abortController.signal.aborted) setState("pending");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        if (isAxiosError(error) && error.response?.status === 401) {
          if (!abortController.signal.aborted) setState("unauthorized");
          return;
        }
        console.error("Unable to verify PesaPal payment on the callback screen:", error);
        if (!abortController.signal.aborted) setState("unavailable");
      }
    };

    void checkPayment();
    return () => abortController.abort();
  }, [api, merchantReference, trackingId, queryClient]);

  const messageByState: Record<CallbackState, string> = {
    checking: "Verifying your payment directly with PesaPal…",
    succeeded: "Payment confirmed. Your AfriCart order has been saved.",
    initiating: "AfriCart is still preparing the payment. Check My Orders before trying again.",
    failed: "Payment was not completed. Your cart is still available.",
    invalid: "PesaPal could not find a completed payment. Your cart is still available.",
    reversed: "PesaPal reversed this payment. Contact support with your receipt.",
    pending: "Payment is still processing. Check My Orders before paying again.",
    unavailable: "We could not verify the payment right now. Your cart is still available.",
    unauthorized: "Sign in to view this receipt, then check My Orders for your payment result.",
  };

  const isSuccess = state === "succeeded";
  const showInventoryWarning = isSuccess && inventoryIssue;
  const returnToCart =
    state === "failed" ||
    state === "invalid" ||
    state === "unavailable" ||
    showInventoryWarning;
  const destination = state === "unauthorized" ? "/(auth)" : returnToCart ? "/(tabs)/cart" : "/(profile)/orders";
  const actionLabel =
    state === "unauthorized" ? "Sign in" : returnToCart ? "Return to cart" : "View My Orders";

  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center px-8" accessibilityRole="alert">
        {state === "checking" ? (
          <ActivityIndicator size="large" color={palette.primary.DEFAULT} />
        ) : (
          <Ionicons
            name={isSuccess && !showInventoryWarning ? "checkmark-circle" : "information-circle"}
            size={68}
            color={
              isSuccess && !showInventoryWarning
                ? palette.primary.DEFAULT
                : palette.accent.warning
            }
          />
        )}
        <Text className="text-text-primary text-2xl font-bold text-center mt-5">
          {showInventoryWarning ? "Payment received" : isSuccess ? "Payment confirmed" : "Payment status"}
        </Text>
        <Text className="text-text-secondary text-base text-center leading-6 mt-3">
          {showInventoryWarning
            ? "Payment was confirmed, but an item is out of stock. We will contact you, and your cart is saved for a new attempt."
            : messageByState[state]}
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-2xl px-6 py-4 mt-8"
          activeOpacity={0.8}
          onPress={() => router.replace(destination)}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text className="text-background font-bold">{actionLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
};

export default PaymentCallbackScreen;
