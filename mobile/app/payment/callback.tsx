import SafeScreen from "@/components/SafeScreen";
import { useApi } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type PaymentStatus = "initiating" | "pending" | "succeeded" | "failed" | "invalid" | "reversed";
type CallbackState = PaymentStatus | "checking" | "unavailable";

interface PaymentStatusResponse {
  paymentStatus: PaymentStatus;
}

const PaymentCallbackScreen = () => {
  const {
    OrderMerchantReference: merchantReferenceParam,
    OrderTrackingId: trackingIdParam,
  } = useLocalSearchParams<{
    OrderMerchantReference?: string | string[];
    OrderTrackingId?: string | string[];
  }>();
  const merchantReference = Array.isArray(merchantReferenceParam)
    ? merchantReferenceParam[0]
    : merchantReferenceParam;
  const trackingId = Array.isArray(trackingIdParam) ? trackingIdParam[0] : trackingIdParam;
  const api = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [state, setState] = useState<CallbackState>("checking");

  useEffect(() => {
    let cancelled = false;

    const checkPayment = async () => {
      if (!merchantReference) {
        setState("unavailable");
        return;
      }

      try {
        for (let attempt = 0; attempt < 15; attempt += 1) {
          const { data } = await api.get<PaymentStatusResponse>(
            `/payment/pesapal/status/${encodeURIComponent(merchantReference)}`,
            { params: trackingId ? { orderTrackingId: trackingId } : undefined }
          );
          if (cancelled) return;

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

          await new Promise((resolve) => setTimeout(resolve, 4000));
        }

        if (!cancelled) setState("pending");
      } catch (error) {
        console.error("Unable to verify PesaPal payment on the callback screen:", error);
        if (!cancelled) setState("unavailable");
      }
    };

    void checkPayment();
    return () => {
      cancelled = true;
    };
  }, [api, merchantReference, trackingId, queryClient]);

  const messageByState: Record<CallbackState, string> = {
    checking: "Verifying your payment directly with PesaPal...",
    succeeded: "Payment confirmed. Your AfriCart order has been saved.",
    initiating: "AfriCart is still preparing the payment. Check My Orders before trying again.",
    failed: "Payment was not completed. Your cart is still available.",
    invalid: "PesaPal could not find a completed payment. Your cart is still available.",
    reversed: "PesaPal reversed this payment. Contact support with your receipt.",
    pending: "Payment is still processing. Check My Orders before trying to pay again.",
    unavailable:
      "We could not verify the payment right now. The server will continue checking PesaPal; check My Orders before making another payment.",
  };

  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center px-8">
        {state === "checking" ? (
          <ActivityIndicator size="large" color="#1DB954" />
        ) : (
          <Ionicons
            name={state === "succeeded" ? "checkmark-circle" : "information-circle"}
            size={68}
            color={state === "succeeded" ? "#1DB954" : "#F5B942"}
          />
        )}
        <Text className="text-text-primary text-2xl font-bold text-center mt-5">
          {state === "succeeded" ? "Payment confirmed" : "Payment status"}
        </Text>
        <Text className="text-text-secondary text-base text-center leading-6 mt-3">
          {messageByState[state]}
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-2xl px-6 py-4 mt-8"
          activeOpacity={0.8}
          onPress={() => router.replace(state === "failed" ? "/(tabs)/cart" : "/(profile)/orders")}
          accessibilityRole="button"
          accessibilityLabel={state === "failed" ? "Return to cart" : "View my orders"}
        >
          <Text className="text-background font-bold">
            {state === "failed" ? "Return to cart" : "View My Orders"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
};

export default PaymentCallbackScreen;
