import useCart from "@/hooks/useCart";
import useWishlist from "@/hooks/useWishlist";
import { Product } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from "react-native";

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
  const { width: windowWidth } = useWindowDimensions();
  const numColumns = windowWidth >= 1200 ? 4 : windowWidth >= 768 ? 3 : 2;
  const cardWidth: `${number}%` = `${100 / numColumns - 2}%`;

  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlist();

  const { isAddingToCart, addToCart } = useCart();

  const handleAddToCart = (productId: string, productName: string) => {
    addToCart(
      { productId, quantity: 1 },
      {
        onSuccess: () => {
          Alert.alert("Success", `${productName} added to cart!`);
        },
        onError: (error: any) => {
          Alert.alert("Error", error?.response?.data?.error || "Failed to add to cart");
        },
      }
    );
  };

  const renderProduct = ({ item: product }: { item: Product }) => (
    <View className="bg-surface rounded-3xl overflow-hidden mb-3" style={{ width: cardWidth }}>
      <View className="relative" style={{ backgroundColor: "#282828" }}>
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
          onPress={() => toggleWishlist(product._id)}
          disabled={isAddingToWishlist || isRemovingFromWishlist}
          accessibilityRole="button"
          accessibilityLabel={`${isInWishlist(product._id) ? "Remove" : "Add"} ${product.name} ${
            isInWishlist(product._id) ? "from" : "to"
          } wishlist`}
        >
          {isAddingToWishlist || isRemovingFromWishlist ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons
              name={isInWishlist(product._id) ? "heart" : "heart-outline"}
              size={18}
              color={isInWishlist(product._id) ? "#FF6B6B" : "#FFFFFF"}
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
          <Ionicons name="star" size={12} color="#FFC107" />
          <Text className="text-text-primary text-xs font-semibold ml-1">
            {product.averageRating.toFixed(1)}
          </Text>
          <Text className="text-text-secondary text-xs ml-1">({product.totalReviews})</Text>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-primary font-bold text-lg">${product.price.toFixed(2)}</Text>

          <TouchableOpacity
            className="bg-primary rounded-full w-8 h-8 items-center justify-center"
            activeOpacity={0.7}
            onPress={() => handleAddToCart(product._id, product.name)}
            disabled={isAddingToCart}
            accessibilityRole="button"
            accessibilityLabel={`Add ${product.name} to cart`}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#121212" />
            ) : (
              <Ionicons name="add" size={18} color="#121212" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (isLoading || (isError && isFetching)) {
    return (
      <View className="py-20 items-center justify-center">
        <ActivityIndicator size="large" color="#00D9FF" />
        <Text className="text-text-secondary mt-4">Loading products...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View className="py-20 items-center justify-center">
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <Text className="text-text-primary font-semibold mt-4">Failed to load products</Text>
        <Text className="text-text-secondary text-sm mt-2 text-center px-6">
          Check that the backend is running, then try again.
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-full px-6 py-3 mt-5"
          activeOpacity={0.8}
          accessibilityRole="button"
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
      <View
        className="w-full items-center justify-center bg-background-lighter"
        style={{
          width: "100%",
          aspectRatio: 1,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="image-outline" size={32} color="#6A6A6A" />
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
      style={{ width: "100%", aspectRatio: 1, backgroundColor: "#282828" }}
    />
  );
}

function NoProductsFound({ hasCatalogProducts }: { hasCatalogProducts: boolean }) {
  return (
    <View className="py-20 items-center justify-center">
      <Ionicons
        name={hasCatalogProducts ? "search-outline" : "bag-outline"}
        size={48}
        color="#666"
      />
      <Text className="text-text-primary font-semibold mt-4">
        {hasCatalogProducts ? "No products match your filters" : "No products are available yet"}
      </Text>
      <Text className="text-text-secondary text-sm mt-2">
        {hasCatalogProducts ? "Try adjusting your filters" : "Check back soon for new products"}
      </Text>
    </View>
  );
}
