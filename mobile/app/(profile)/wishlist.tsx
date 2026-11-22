import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";

import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { confirmAction, showMessage } from "@/lib/alerts";
import palette from "@/lib/theme";
import { getErrorMessage } from "@/lib/utils";

const WishlistScreen = () => {
  const {
    wishlist,
    isLoading,
    isError,
    removeFromWishlist,
    isProductPending: isWishlistItemPending,
  } = useWishlist();
  const { addToCart, isProductPending: isCartItemPending } = useCart();

  const handleRemoveFromWishlist = async (productId: string, productName: string) => {
    const confirmed = await confirmAction(
      "Remove from wishlist",
      `Remove ${productName} from your wishlist?`,
      { confirmLabel: "Remove", destructive: true }
    );
    if (!confirmed) return;

    removeFromWishlist(productId, {
      onError: (error: unknown) => showMessage("Could not remove item", getErrorMessage(error)),
    });
  };

  const handleAddToCart = (productId: string, productName: string) => {
    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => showMessage("Added to cart", `${productName} is in your cart.`),
        onError: (error: unknown) => showMessage("Could not add to cart", getErrorMessage(error)),
      }
    );
  };

  if (isLoading) {
    return (
      <SafeScreen>
        <LoadingState message="Loading wishlist…" />
      </SafeScreen>
    );
  }

  if (isError) {
    return (
      <SafeScreen>
        <ErrorState title="Failed to load wishlist" />
      </SafeScreen>
    );
  }

  if (wishlist.length === 0) {
    return (
      <SafeScreen>
        <EmptyState
          header="Wishlist"
          icon="heart-outline"
          title="Your wishlist is empty"
          description="Add products you love to see them here."
        />
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View className="px-6 pb-5 border-b border-surface flex-row items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={28} color={palette.text.primary} />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Wishlist</Text>
        <Text className="text-text-secondary text-sm ml-auto">
          {wishlist.length} {wishlist.length === 1 ? "item" : "items"}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, alignItems: "center" }}
      >
        <View className="px-6 py-4" style={{ width: "100%", maxWidth: palette.layout.compactContent }}>
          {wishlist.map((item) => {
            const removing = isWishlistItemPending(item._id);
            const adding = isCartItemPending(item._id);
            const inStock = item.stock > 0;

            return (
              <View key={item._id} className="bg-surface rounded-3xl overflow-hidden mb-3">
                <View className="flex-row p-4">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push(`/product/${item._id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`View ${item.name}`}
                  >
                    {item.images?.[0] ? (
                      <Image
                        source={{ uri: item.images[0] }}
                        className="rounded-2xl bg-background-lighter"
                        style={{ width: 96, height: 96, borderRadius: 8 }}
                        accessibilityLabel={`${item.name} image`}
                      />
                    ) : (
                      <View
                        className="rounded-2xl bg-background-lighter items-center justify-center"
                        style={{ width: 96, height: 96, borderRadius: 8 }}
                      >
                        <Ionicons name="image-outline" size={24} color={palette.text.tertiary} />
                      </View>
                    )}
                  </TouchableOpacity>

                  <View className="flex-1 ml-4">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => router.push(`/product/${item._id}`)}
                      accessibilityRole="button"
                      accessibilityLabel={`View ${item.name}`}
                    >
                      <Text
                        className="text-text-primary font-bold text-base mb-2"
                        numberOfLines={2}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                    <Text className="text-primary font-bold text-xl mb-2">
                      ${item.price.toFixed(2)}
                    </Text>

                    <View className="flex-row items-center">
                      <View
                        className={`w-2 h-2 rounded-full mr-2 ${inStock ? "bg-green-500" : "bg-red-500"}`}
                      />
                      <Text
                        className={`text-sm font-semibold ${inStock ? "text-green-500" : "text-red-500"}`}
                      >
                        {inStock ? `${item.stock} in stock` : "Out of stock"}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    className="self-start bg-red-500/20 p-2 rounded-full"
                    activeOpacity={0.7}
                    onPress={() => handleRemoveFromWishlist(item._id, item.name)}
                    disabled={removing}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${item.name} from wishlist`}
                  >
                    {removing ? (
                      <ActivityIndicatorCompat />
                    ) : (
                      <Ionicons name="trash-outline" size={20} color={palette.accent.danger} />
                    )}
                  </TouchableOpacity>
                </View>

                {inStock && (
                  <View className="px-4 pb-4">
                    <TouchableOpacity
                      className="bg-primary rounded-xl py-3 items-center"
                      activeOpacity={0.8}
                      onPress={() => handleAddToCart(item._id, item.name)}
                      disabled={adding}
                      accessibilityRole="button"
                      accessibilityLabel={`Add ${item.name} to cart`}
                    >
                      {adding ? (
                        <ActivityIndicatorCompat dark />
                      ) : (
                        <Text className="text-background font-bold">Add to cart</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeScreen>
  );
};

const ActivityIndicatorCompat = ({ dark = false }: { dark?: boolean }) => (
  <ActivityIndicator size="small" color={dark ? palette.onPrimary : palette.accent.danger} />
);

export default WishlistScreen;
