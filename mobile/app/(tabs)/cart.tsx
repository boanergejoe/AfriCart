import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AddressSelectionModal from "@/components/AddressSelectionModal";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import OrderSummary from "@/components/OrderSummary";
import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import { useAddresses } from "@/hooks/useAddressess";
import { useApi } from "@/lib/api";
import palette from "@/lib/theme";
import { delay, getErrorMessage } from "@/lib/utils";
import { Address } from "@/types";

interface PesapalCheckoutResponse {
  orderId: string;
  merchantReference: string;
  redirectUrl: string;
  amountCents: number;
  currency: string;
}

interface PesapalStatusResponse {
  paymentStatus: "pending" | "initiating" | "succeeded" | "failed" | "invalid" | "reversed";
}

const SHIPPING_CENTS = 1000;
const TAX_PERCENT = 8;
const MAX_STATUS_CHECKS = 15;
const CHECK_INTERVAL_MS = 4000;

const CartScreen = () => {
  const {
    cart,
    cartItemCount,
    cartTotal,
    isError,
    isLoading,
    isProductPending,
    refetch,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const { addresses, isLoading: addressesLoading, isError: addressesError } = useAddresses();
  const api = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const paymentInFlight = useRef(false);
  const pollingAbort = useRef<AbortController | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      pollingAbort.current?.abort();
    };
  }, []);

  const cartItems = cart?.items || [];
  const subtotalCents = Math.round(cartTotal * 100);
  const shippingCents = SHIPPING_CENTS;
  const taxCents = Math.round((subtotalCents * TAX_PERCENT) / 100);
  const totalCents = subtotalCents + shippingCents + taxCents;
  const subtotal = subtotalCents / 100;
  const shipping = shippingCents / 100;
  const tax = taxCents / 100;
  const total = totalCents / 100;

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
      return;
    }
    Alert.alert(title, message);
  };

  const handleQuantityChange = (productId: string, currentQuantity: number, change: number) => {
    const quantity = currentQuantity + change;
    if (quantity < 1) return;

    updateQuantity(
      { productId, quantity },
      { onError: (error: unknown) => showMessage("Cart update failed", getErrorMessage(error)) }
    );
  };

  const removeItem = (productId: string) => {
    removeFromCart(productId, {
      onError: (error: unknown) => showMessage("Could not remove item", getErrorMessage(error)),
    });
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(`Remove ${productName} from your cart?`)) removeItem(productId);
      return;
    }

    Alert.alert("Remove item", `Remove ${productName} from your cart?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeItem(productId) },
    ]);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0 || paymentLoading) return;
    if (addressesLoading || addressesError) {
      showMessage("Addresses unavailable", "Please refresh and try checkout again.");
      return;
    }
    if (addresses.length === 0) {
      showMessage("Shipping address required", "Add a shipping address before checking out.");
      router.push("/(profile)/addresses");
      return;
    }

    setAddressModalVisible(true);
  };

  const handleProceedWithPayment = async (address: Address) => {
    if (paymentInFlight.current) return;
    paymentInFlight.current = true;
    setAddressModalVisible(false);
    setPaymentLoading(true);

    const abortController = new AbortController();
    pollingAbort.current = abortController;

    try {
      const { data: checkout } = await api.post<PesapalCheckoutResponse>(
        "/payment/pesapal/checkout",
        { shippingAddress: address, expectedTotalCents: totalCents }
      );

      if (checkout.amountCents !== totalCents) {
        showMessage(
          "Cart total changed",
          "The server total differs from the cart display. No payment page was opened; review your cart and try again."
        );
        return;
      }

      if (Platform.OS === "web") {
        if (typeof window !== "undefined") window.location.assign(checkout.redirectUrl);
        return;
      }

      await WebBrowser.openBrowserAsync(checkout.redirectUrl);

      for (let attempt = 0; attempt < MAX_STATUS_CHECKS; attempt += 1) {
        const { data } = await api.get<PesapalStatusResponse>(
          `/payment/pesapal/status/${encodeURIComponent(checkout.merchantReference)}`
        );
        const paymentStatus = data.paymentStatus;

        if (paymentStatus === "succeeded") {
          await queryClient.invalidateQueries({ queryKey: ["cart"] });
          await queryClient.invalidateQueries({ queryKey: ["orders"] });
          if (isMounted.current) {
            showMessage("Payment confirmed", "Your PesaPal payment is confirmed and your order is saved.");
          }
          return;
        }

        if (["failed", "invalid", "reversed"].includes(paymentStatus)) {
          await queryClient.invalidateQueries({ queryKey: ["orders"] });
          if (isMounted.current) {
            showMessage(
              "Payment not completed",
              "Your cart has not been cleared. Check My Orders before trying again."
            );
          }
          return;
        }

        await delay(CHECK_INTERVAL_MS, abortController.signal);
      }

      if (isMounted.current) {
        showMessage(
          "Payment is processing",
          `PesaPal has not confirmed this payment yet. Check My Orders before paying again. Reference: ${checkout.merchantReference}`
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;

      if (isMounted.current) {
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
        showMessage(
          "Payment status unavailable",
          `Do not pay again until you check My Orders. ${getErrorMessage(error)}`
        );
      }
    } finally {
      abortController.abort();
      if (pollingAbort.current === abortController) pollingAbort.current = null;
      if (isMounted.current) setPaymentLoading(false);
      paymentInFlight.current = false;
    }
  };

  if (isLoading) {
    return (
      <SafeScreen>
        <LoadingState message="Loading cart…" />
      </SafeScreen>
    );
  }

  if (isError) {
    return (
      <SafeScreen>
        <ErrorState title="Failed to load cart" onRetry={() => void refetch()} />
      </SafeScreen>
    );
  }

  if (cartItems.length === 0) {
    return (
      <SafeScreen>
        <EmptyState
          header="Cart"
          icon="cart-outline"
          title="Your cart is empty"
          description="Add some products to get started."
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <Text
        className="px-6 pb-5 text-text-primary text-3xl font-bold tracking-tight"
        style={{ width: "100%", maxWidth: palette.layout.compactContent, alignSelf: "center" }}
      >
        Cart
      </Text>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 240, alignItems: "center" }}
      >
        <View className="px-6 gap-2" style={{ width: "100%", maxWidth: palette.layout.compactContent }}>
          {cartItems.map((item) => {
            const itemPending = isProductPending(item.product._id);
            const thumbnail = item.product.images?.[0];

            return (
              <View key={item._id} className="bg-surface rounded-3xl overflow-hidden">
                <View className="p-4 flex-row">
                  <View className="relative">
                    {thumbnail ? (
                      <Image
                        source={{ uri: thumbnail }}
                        className="bg-background-lighter"
                        contentFit="cover"
                        style={{ width: 112, height: 112, borderRadius: 16 }}
                        accessibilityLabel={`${item.product.name} image`}
                      />
                    ) : (
                      <View
                        className="bg-background-lighter items-center justify-center"
                        style={{ width: 112, height: 112, borderRadius: 16 }}
                      >
                        <Ionicons name="image-outline" size={28} color={palette.text.tertiary} />
                      </View>
                    )}
                    <View className="absolute top-2 right-2 bg-primary rounded-full px-2 py-0.5">
                      <Text className="text-background text-xs font-bold">×{item.quantity}</Text>
                    </View>
                  </View>

                  <View className="flex-1 ml-4 justify-between">
                    <View>
                      <Text
                        className="text-text-primary font-bold text-lg leading-tight"
                        numberOfLines={2}
                      >
                        {item.product.name}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <Text className="text-primary font-bold text-2xl">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </Text>
                        <Text className="text-text-secondary text-sm ml-2">
                          ${item.product.price.toFixed(2)} each
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center mt-3">
                      <TouchableOpacity
                        className="bg-background-lighter rounded-full w-9 h-9 items-center justify-center"
                        activeOpacity={0.7}
                        onPress={() => handleQuantityChange(item.product._id, item.quantity, -1)}
                        disabled={itemPending}
                        accessibilityRole="button"
                        accessibilityLabel={`Decrease quantity of ${item.product.name}`}
                      >
                        {itemPending ? (
                          <ActivityIndicator size="small" color={palette.text.primary} />
                        ) : (
                          <Ionicons name="remove" size={18} color={palette.text.primary} />
                        )}
                      </TouchableOpacity>

                      <View className="mx-4 min-w-[32px] items-center">
                        <Text className="text-text-primary font-bold text-lg">{item.quantity}</Text>
                      </View>

                      <TouchableOpacity
                        className="bg-primary rounded-full w-9 h-9 items-center justify-center"
                        activeOpacity={0.7}
                        onPress={() => handleQuantityChange(item.product._id, item.quantity, 1)}
                        disabled={itemPending}
                        accessibilityRole="button"
                        accessibilityLabel={`Increase quantity of ${item.product.name}`}
                      >
                        {itemPending ? (
                          <ActivityIndicator size="small" color={palette.onPrimary} />
                        ) : (
                          <Ionicons name="add" size={18} color={palette.onPrimary} />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        className="ml-auto bg-red-500/10 rounded-full w-9 h-9 items-center justify-center"
                        activeOpacity={0.7}
                        onPress={() => handleRemoveItem(item.product._id, item.product.name)}
                        disabled={itemPending}
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${item.product.name} from cart`}
                      >
                        <Ionicons name="trash-outline" size={18} color={palette.accent.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ width: "100%", maxWidth: palette.layout.compactContent, alignSelf: "center" }}>
          <OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-surface pt-4 pb-32 px-6"
        style={{ width: "100%", maxWidth: palette.layout.compactContent, alignSelf: "center" }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Ionicons name="cart" size={20} color={palette.primary.DEFAULT} />
            <Text className="text-text-secondary ml-2">
              {cartItemCount} {cartItemCount === 1 ? "item" : "items"}
            </Text>
          </View>
          <Text className="text-text-primary font-bold text-xl">${total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          className={`bg-primary rounded-2xl overflow-hidden ${paymentLoading ? "opacity-60" : ""}`}
          activeOpacity={0.9}
          onPress={handleCheckout}
          disabled={paymentLoading}
          accessibilityRole="button"
          accessibilityLabel="Continue to secure PesaPal payment"
          accessibilityState={{ disabled: paymentLoading }}
        >
          <View className="py-5 flex-row items-center justify-center">
            {paymentLoading ? (
              <ActivityIndicator size="small" color={palette.onPrimary} />
            ) : (
              <>
                <Text className="text-background font-bold text-lg mr-2">Pay with PesaPal</Text>
                <Ionicons name="arrow-forward" size={20} color={palette.onPrimary} />
              </>
            )}
          </View>
        </TouchableOpacity>
      </View>

      <AddressSelectionModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onProceed={handleProceedWithPayment}
        isProcessing={paymentLoading}
      />
    </SafeScreen>
  );
};

export default CartScreen;
