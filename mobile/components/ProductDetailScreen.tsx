import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { ErrorState } from "@/components/ErrorState";
import LoadingState from "@/components/LoadingState";
import SafeScreen from "@/components/SafeScreen";
import { useBreakpoints } from "@/hooks/useBreakpoints";
import useCart from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProduct";
import useWishlist from "@/hooks/useWishlist";
import { showMessage } from "@/lib/alerts";
import palette from "@/lib/theme";
import { getErrorMessage } from "@/lib/utils";

const ProductDetailScreen = () => {
  const { width } = useBreakpoints();
  const galleryWidth = Math.min(width, palette.layout.detailContent);
  const galleryHeight = Math.min(galleryWidth * 0.95, 460);
  const { id: idParam } = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam ?? "";
  const { data: product, isError, isLoading, refetch } = useProduct(id);
  const { addToCart, isProductPending: isCartItemPending } = useCart();
  const {
    isInWishlist,
    toggleWishlist,
    isProductPending: isWishlistItemPending,
  } = useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <SafeScreen>
        <LoadingState message="Loading product…" />
      </SafeScreen>
    );
  }

  if (isError || !product) {
    return (
      <SafeScreen>
        <ErrorState
          title="Product unavailable"
          description="This product may have been removed or does not exist."
          onRetry={() => void refetch()}
        />
      </SafeScreen>
    );
  }

  const inStock = product.stock > 0;
  const images = product.images || [];
  const isWishlisted = isInWishlist(product._id);
  const wishlistPending = isWishlistItemPending(product._id);
  const cartPending = isCartItemPending(product._id);

  const handleAddToCart = () => {
    if (!product) return;

    addToCart(
      { productId: product._id, quantity },
      {
        onSuccess: () => showMessage("Added to cart", `${product.name} is in your cart.`),
        onError: (error: unknown) => showMessage("Could not add to cart", getErrorMessage(error)),
      }
    );
  };

  return (
    <SafeScreen>
      <View className="absolute top-0 left-0 right-0 z-10 px-6 pt-20 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="bg-black/50 backdrop-blur-xl w-12 h-12 rounded-full items-center justify-center"
          onPress={() => {
            // A product URL can be opened directly on the web with no app history.
            if (Platform.OS === "web") router.replace("/(tabs)");
            else router.back();
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color={palette.text.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          className={`w-12 h-12 rounded-full items-center justify-center ${
            isWishlisted ? "bg-primary" : "bg-black/50 backdrop-blur-xl"
          }`}
          onPress={() =>
            toggleWishlist(product._id, {
              onError: (error: unknown) =>
                showMessage("Wishlist update failed", getErrorMessage(error)),
            })
          }
          disabled={wishlistPending}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityState={{ selected: isWishlisted, disabled: wishlistPending }}
          accessibilityLabel={`${isWishlisted ? "Remove" : "Add"} ${product.name} ${
            isWishlisted ? "from" : "to"
          } wishlist`}
        >
          {wishlistPending ? (
            <ActivityIndicator size="small" color={palette.text.primary} />
          ) : (
            <Ionicons
              name={isWishlisted ? "heart" : "heart-outline"}
              size={24}
              color={isWishlisted ? palette.onPrimary : palette.text.primary}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <View style={{ width: "100%", maxWidth: palette.layout.detailContent, alignSelf: "center" }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.x / galleryWidth);
              setSelectedImageIndex(Math.max(0, Math.min(index, images.length - 1)));
            }}
          >
            {images.length > 0 ? (
              images.map((image, index) => (
                <View key={`${image}-${index}`} style={{ width: galleryWidth }}>
                  <Image
                    source={{ uri: image }}
                    style={{ width: galleryWidth, height: galleryHeight, backgroundColor: palette.background.light }}
                    contentFit="contain"
                    transition={180}
                    accessibilityLabel={`${product.name}, image ${index + 1}`}
                  />
                </View>
              ))
            ) : (
              <View
                style={{
                  width: galleryWidth,
                  height: galleryHeight,
                  backgroundColor: palette.background.light,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="image-outline" size={48} color={palette.text.tertiary} />
              </View>
            )}
          </ScrollView>

          {images.length > 1 && (
            <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
              {images.map((_, index) => (
                <View
                  key={index}
                  className={`h-2 rounded-full ${
                    index === selectedImageIndex ? "bg-primary w-6" : "bg-white/50 w-2"
                  }`}
                />
              ))}
            </View>
          )}
        </View>

        <View className="p-6" style={{ width: "100%", maxWidth: palette.layout.detailContent, alignSelf: "center" }}>
          <View className="flex-row items-center mb-3">
            <View className="bg-primary/20 px-3 py-1 rounded-full">
              <Text className="text-primary text-xs font-bold">{product.category}</Text>
            </View>
          </View>

          <Text className="text-text-primary text-3xl font-bold mb-3">{product.name}</Text>

          <View className="flex-row items-center mb-4">
            <View className="flex-row items-center bg-surface px-3 py-2 rounded-full">
              <Ionicons name="star" size={16} color={palette.accent.warning} />
              <Text className="text-text-primary font-bold ml-1 mr-2">
                {(product.averageRating ?? 0).toFixed(1)}
              </Text>
              <Text className="text-text-secondary text-sm">
                ({product.totalReviews ?? 0} reviews)
              </Text>
            </View>
            <View className="ml-3 flex-row items-center">
              <View
                className={`w-2 h-2 rounded-full mr-2 ${inStock ? "bg-green-500" : "bg-red-500"}`}
              />
              <Text
                className={`font-semibold text-sm ${inStock ? "text-green-500" : "text-red-500"}`}
              >
                {inStock ? `${product.stock} in stock` : "Out of stock"}
              </Text>
            </View>
          </View>

          <Text className="text-primary text-4xl font-bold mb-6">
            ${product.price.toFixed(2)}
          </Text>

          <View className="mb-6">
            <Text className="text-text-primary text-lg font-bold mb-3">Quantity</Text>
            <View className="flex-row items-center">
              <TouchableOpacity
                className="bg-surface rounded-full w-12 h-12 items-center justify-center"
                onPress={() => setQuantity((current) => Math.max(1, current - 1))}
                activeOpacity={0.7}
                disabled={!inStock || cartPending}
                accessibilityRole="button"
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons
                  name="remove"
                  size={24}
                  color={!inStock ? palette.text.tertiary : palette.text.primary}
                />
              </TouchableOpacity>

              <Text className="text-text-primary text-xl font-bold mx-6">{quantity}</Text>

              <TouchableOpacity
                className="bg-primary rounded-full w-12 h-12 items-center justify-center"
                onPress={() => setQuantity((current) => Math.min(product.stock, current + 1))}
                activeOpacity={0.7}
                disabled={!inStock || quantity >= product.stock || cartPending}
                accessibilityRole="button"
                accessibilityLabel="Increase quantity"
              >
                <Ionicons
                  name="add"
                  size={24}
                  color={
                    !inStock || quantity >= product.stock
                      ? palette.text.tertiary
                      : palette.onPrimary
                  }
                />
              </TouchableOpacity>
            </View>

            {inStock && quantity >= product.stock && (
              <Text className="text-accent-warning text-sm mt-2">Maximum stock reached</Text>
            )}
          </View>

          <View className="mb-8">
            <Text className="text-text-primary text-lg font-bold mb-3">Description</Text>
            <Text className="text-text-secondary text-base leading-6">{product.description}</Text>
          </View>
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-surface px-6 py-4 pb-8"
        style={{ maxWidth: palette.layout.detailContent, alignSelf: "center", width: "100%" }}
      >
        <View className="flex-row items-center gap-3">
          <View className="flex-1">
            <Text className="text-text-secondary text-sm mb-1">Total price</Text>
            <Text className="text-primary text-2xl font-bold">
              ${(product.price * quantity).toFixed(2)}
            </Text>
          </View>
          <TouchableOpacity
            className={`rounded-2xl px-8 py-4 flex-row items-center ${
              !inStock ? "bg-surface" : "bg-primary"
            }`}
            activeOpacity={0.8}
            onPress={handleAddToCart}
            disabled={!inStock || cartPending}
            accessibilityRole="button"
            accessibilityState={{ disabled: !inStock || cartPending }}
            accessibilityLabel={inStock ? "Add to cart" : "Out of stock"}
          >
            {cartPending ? (
              <ActivityIndicator size="small" color={palette.onPrimary} />
            ) : (
              <>
                <Ionicons
                  name="cart"
                  size={24}
                  color={!inStock ? palette.text.tertiary : palette.onPrimary}
                />
                <Text
                  className={`font-bold text-lg ml-2 ${
                    !inStock ? "text-text-secondary" : "text-background"
                  }`}
                >
                  {!inStock ? "Out of stock" : "Add to cart"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeScreen>
  );
};

export default ProductDetailScreen;
