import AddressSelectionModal from "@/components/AddressSelectionModal";
import OrderSummary from "@/components/OrderSummary";
import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import { useAddresses } from "@/hooks/useAddressess";
import { useApi } from "@/lib/api";
import { Address } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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

const CartScreen = () => {
  const {
    cart,
    cartItemCount,
    cartTotal,
    isError,
    isLoading,
    isRemoving,
    isUpdating,
    removeFromCart,
    updateQuantity,
  } = useCart();
  const { addresses, isLoading: addressesLoading } = useAddresses();
  const api = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const paymentInFlight = useRef(false);

  const cartItems = cart?.items || [];
  const subtotalCents = Math.round(cartTotal * 100);
  const shippingCents = 1000;
  const taxCents = Math.round((subtotalCents * 8) / 100);
  const totalCents = subtotalCents + shippingCents + taxCents;
  const subtotal = subtotalCents / 100;
  const shipping = shippingCents / 100;
  const tax = taxCents / 100;
  const total = totalCents / 100;

  const showMessage = (title: string, message: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const getErrorMessage = (error: unknown) => {
    if (isAxiosError<{ error?: string }>(error)) {
      return error.response?.data?.error || error.message;
    }
    return error instanceof Error ? error.message : "Please try again.";
  };

  const handleQuantityChange = (productId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    updateQuantity({ productId, quantity: newQuantity });
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      if (window.confirm(`Remove ${productName} from your cart?`)) {
        removeFromCart(productId);
      }
      return;
    }

    Alert.alert("Remove Item", `Remove ${productName} from cart?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => removeFromCart(productId),
      },
    ]);
  };

  const handleCheckout = () => {
    if (cartItems.length === 0 || paymentLoading) return;
    if (addressesLoading) {
      showMessage("Loading addresses", "Please wait a moment and try checkout again.");
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

    let checkout: PesapalCheckoutResponse;
    try {
      const { data } = await api.post<PesapalCheckoutResponse>("/payment/pesapal/checkout", {
        shippingAddress: address,
        expectedTotalCents: totalCents,
      });
      checkout = data;
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        await queryClient.invalidateQueries({ queryKey: ["cart"] });
        await queryClient.invalidateQueries({ queryKey: ["orders"] });
      }
      showMessage("Unable to start payment", getErrorMessage(error));
      setPaymentLoading(false);
      paymentInFlight.current = false;
      return;
    }

    if (checkout.amountCents !== totalCents) {
      showMessage(
        "Cart total changed",
        "The server total differs from the cart display. No payment page was opened; refresh your cart and review it."
      );
      setPaymentLoading(false);
      paymentInFlight.current = false;
      return;
    }

    if (Platform.OS === "web") {
      if (typeof window !== "undefined") {
        window.location.assign(checkout.redirectUrl);
      }
      return;
    }

    try {
      await WebBrowser.openBrowserAsync(checkout.redirectUrl);

      let paymentStatus: PesapalStatusResponse["paymentStatus"] = "pending";
      for (let attempt = 0; attempt < 15; attempt += 1) {
        const { data } = await api.get<PesapalStatusResponse>(
          `/payment/pesapal/status/${encodeURIComponent(checkout.merchantReference)}`
        );
        paymentStatus = data.paymentStatus;

        if (paymentStatus === "succeeded") {
          await queryClient.invalidateQueries({ queryKey: ["cart"] });
          await queryClient.invalidateQueries({ queryKey: ["orders"] });
          showMessage("Payment confirmed", "Your PesaPal payment is confirmed and your order is saved.");
          setPaymentLoading(false);
          return;
        }

        if (["failed", "invalid", "reversed"].includes(paymentStatus)) {
          showMessage(
            "Payment not completed",
            "Your cart has not been cleared. You can check your order history before trying again."
          );
          setPaymentLoading(false);
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, 4000));
      }

      showMessage(
        "Payment is processing",
        `PesaPal has not confirmed this payment yet. Check My Orders before making another payment. Reference: ${checkout.merchantReference}`
      );
    } catch (error) {
      showMessage(
        "Payment status unavailable",
        `Do not pay again until you check My Orders. Reference: ${checkout.merchantReference}. ${getErrorMessage(error)}`
      );
    } finally {
      setPaymentLoading(false);
      paymentInFlight.current = false;
    }
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;
  if (cartItems.length === 0) return <EmptyUI />;

  return (
    <SafeScreen>
      <Text
        className="px-6 pb-5 text-text-primary text-3xl font-bold tracking-tight"
        style={{ width: "100%", maxWidth: 840, alignSelf: "center" }}
      >
        Cart
      </Text>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 240, alignItems: "center" }}
      >
        <View className="px-6 gap-2" style={{ width: "100%", maxWidth: 840 }}>
          {cartItems.map((item) => (
            <View key={item._id} className="bg-surface rounded-3xl overflow-hidden">
              <View className="p-4 flex-row">
                <View className="relative">
                  <Image
                    source={item.product.images[0]}
                    className="bg-background-lighter"
                    contentFit="cover"
                    style={{ width: 112, height: 112, borderRadius: 16 }}
                  />
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
                      disabled={isUpdating}
                      accessibilityRole="button"
                      accessibilityLabel={`Decrease quantity of ${item.product.name}`}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Ionicons name="remove" size={18} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>

                    <View className="mx-4 min-w-[32px] items-center">
                      <Text className="text-text-primary font-bold text-lg">{item.quantity}</Text>
                    </View>

                    <TouchableOpacity
                      className="bg-primary rounded-full w-9 h-9 items-center justify-center"
                      activeOpacity={0.7}
                      onPress={() => handleQuantityChange(item.product._id, item.quantity, 1)}
                      disabled={isUpdating}
                      accessibilityRole="button"
                      accessibilityLabel={`Increase quantity of ${item.product.name}`}
                    >
                      {isUpdating ? (
                        <ActivityIndicator size="small" color="#121212" />
                      ) : (
                        <Ionicons name="add" size={18} color="#121212" />
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="ml-auto bg-red-500/10 rounded-full w-9 h-9 items-center justify-center"
                      activeOpacity={0.7}
                      onPress={() => handleRemoveItem(item.product._id, item.product.name)}
                      disabled={isRemoving}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${item.product.name} from cart`}
                    >
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={{ width: "100%", maxWidth: 840, alignSelf: "center" }}>
          <OrderSummary subtotal={subtotal} shipping={shipping} tax={tax} total={total} />
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t
       border-surface pt-4 pb-32 px-6"
        style={{ width: "100%", maxWidth: 840, alignSelf: "center" }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center">
            <Ionicons name="cart" size={20} color="#1DB954" />
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
        >
          <View className="py-5 flex-row items-center justify-center">
            {paymentLoading ? (
              <ActivityIndicator size="small" color="#121212" />
            ) : (
              <>
                <Text className="text-background font-bold text-lg mr-2">Pay with PesaPal</Text>
                <Ionicons name="arrow-forward" size={20} color="#121212" />
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

function LoadingUI() {
  return (
    <View className="flex-1 bg-background items-center justify-center">
      <ActivityIndicator size="large" color="#00D9FF" />
      <Text className="text-text-secondary mt-4">Loading cart...</Text>
    </View>
  );
}

function ErrorUI() {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
      <Text className="text-text-primary font-semibold text-xl mt-4">Failed to load cart</Text>
      <Text className="text-text-secondary text-center mt-2">
        Please check your connection and try again
      </Text>
    </View>
  );
}

function EmptyUI() {
  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-5">
        <Text className="text-text-primary text-3xl font-bold tracking-tight">Cart</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="cart-outline" size={80} color="#666" />
        <Text className="text-text-primary font-semibold text-xl mt-4">Your cart is empty</Text>
        <Text className="text-text-secondary text-center mt-2">
          Add some products to get started
        </Text>
      </View>
    </View>
  );
}
