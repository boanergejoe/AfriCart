import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from "react-native";

import { useBreakpoints } from "@/hooks/useBreakpoints";
import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { showMessage } from "@/lib/alerts";
import palette from "@/lib/theme";
import { getErrorMessage } from "@/lib/utils";
import { Product } from "@/types";

interface ProductsGridProps {
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  products: Product[];
  hasCatalogProducts: boolean;
  onRetry: () => void;
}

const ProductsGrid = ({
  products,
  isLoading,
  isFetching,
  isError,
  onRetry,
  hasCatalogProducts,
}: ProductsGridProps) => {
  const { columns: numColumns } = useBreakpoints();
  const cardWidth: `${number}%` = `${100 / numColumns - 2}%`;

  const { isInWishlist, toggleWishlist, isProductPending: isWishlistItemPending } = useWishlist();
  const { addToCart, isProductPending: isCartItemPending } = useCart();

  const handleAddToCart = (product: Product) => {
    addToCart(
      { productId: product._id, quantity: 1 },
      {
        onSuccess: () => showMessage("Added to cart", `${product.name} is in your cart.`),
        onError: (error: unknown) => showMessage("Could not add to cart", getErrorMessage(error)),
      }
    );
  };

  const handleToggleWishlist = (product: Product) => {
    toggleWishlist(product._id, {
      onError: (error: unknown) => showMessage("Wishlist update failed", getErrorMessage(error)),
    });
  };

  const renderProduct = ({ item: product }: { item: Product }) => {
    const wishlistPending = isWishlistItemPending(product._id);
    const cartPending = isCartItemPending(product._id);
    const isWishlisted = isInWishlist(product._id);

    return (
      <View className="bg-surface rounded-3xl overflow-hidden mb-3" style={{ width: cardWidth }}>
        <View className="relative" style={{ backgroundColor: palette.surface.DEFAULT }}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push(`/product/${product._id}`)}
            accessibilityRole="button"
            accessibilityLabel={`View ${product.name}`}
          >
            <ProductImage uri={product.images?.[0]} label={`${product.name} product image`} />
          </TouchableOpacity>

          <TouchableOpacity
            className="absolute top-3 right-3 bg-black/30 backdrop-blur-xl p-2 rounded-full"
            activeOpacity={0.7}
            onPress={() => handleToggleWishlist(product)}
            disabled={wishlistPending}
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
                size={18}
                color={isWishlisted ? palette.accent.danger : palette.text.primary}
              />
            )}
          </TouchableOpacity>
        </View>

        <View className="p-3">
          <Text className="text-text-secondary text-xs mb-1">{product.category}</Text>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push(`/product/${product._id}`)}
            accessibilityRole="button"
            accessibilityLabel={`View ${product.name}`}
          >
            <Text className="text-text-primary font-bold text-sm mb-2" numberOfLines={2}>
              {product.name}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center mb-2">
            <Ionicons name="star" size={12} color={palette.accent.warning} />
            <Text className="text-text-primary text-xs font-semibold ml-1">
              {(product.averageRating ?? 0).toFixed(1)}
            </Text>
            <Text className="text-text-secondary text-xs ml-1">
              ({product.totalReviews ?? 0})
            </Text>
          </View>

          <View className="flex-row items-center justify-between">
            <Text className="text-primary font-bold text-lg">${product.price.toFixed(2)}</Text>
            <TouchableOpacity
              className="bg-primary rounded-full w-8 h-8 items-center justify-center"
              activeOpacity={0.7}
              onPress={() => handleAddToCart(product)}
              disabled={cartPending || product.stock === 0}
              accessibilityRole="button"
              accessibilityState={{ disabled: cartPending || product.stock === 0 }}
              accessibilityLabel={`Add ${product.name} to cart`}
            >
              {cartPending ? (
                <ActivityIndicator size="small" color={palette.onPrimary} />
              ) : (
                <Ionicons name="add" size={18} color={palette.onPrimary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading || (isError && isFetching)) {
    return (
      <View className="py-20 items-center justify-center" accessibilityRole="progressbar">
        <ActivityIndicator size="large" color={palette.primary.DEFAULT} />
        <Text className="text-text-secondary mt-4">Loading products…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="py-20 items-center justify-center" accessibilityRole="alert">
        <Ionicons name="alert-circle-outline" size={48} color={palette.accent.danger} />
        <Text className="text-text-primary font-semibold mt-4">Failed to load products</Text>
        <Text className="text-text-secondary text-sm mt-2 text-center px-6">
          Check your connection, then try again.
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-full px-6 py-3 mt-5"
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Retry loading products"
          onPress={onRetry}
        >
          <Text className="text-background font-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      key={`products-${numColumns}`}
      data={products}
      renderItem={renderProduct}
      keyExtractor={(item) => item._id}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? { justifyContent: "space-between" } : undefined}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
      ListEmptyComponent={() => <NoProductsFound hasCatalogProducts={hasCatalogProducts} />}
    />
  );
};

export default ProductsGrid;

function ProductImage({ uri, label }: { uri?: string; label: string }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  if (!uri || hasError) {
    return (
      <View className="w-full items-center justify-center bg-background-lighter" style={{ aspectRatio: 1 }}>
        <Ionicons name="image-outline" size={32} color={palette.text.tertiary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      contentFit="cover"
      transition={180}
      accessibilityLabel={label}
      onError={() => setHasError(true)}
      style={{ width: "100%", aspectRatio: 1, backgroundColor: palette.surface.DEFAULT }}
    />
  );
}

function NoProductsFound({ hasCatalogProducts }: { hasCatalogProducts: boolean }) {
  return (
    <View className="py-20 items-center justify-center">
      <Ionicons
        name={hasCatalogProducts ? "search-outline" : "bag-outline"}
        size={64}
        color={palette.text.tertiary}
      />
      <Text className="text-text-primary font-semibold mt-4">
        {hasCatalogProducts ? "No matching products" : "No products yet"}
      </Text>
      <Text className="text-text-secondary text-sm mt-2 text-center px-6">
        {hasCatalogProducts
          ? "Try another search term or category."
          : "Check back soon for new arrivals."}
      </Text>
    </View>
  );
}
