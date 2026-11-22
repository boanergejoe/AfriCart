import ProductsGrid from "@/components/ProductsGrid";
import SafeScreen from "@/components/SafeScreen";
import useProducts from "@/hooks/useProducts";

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Pressable,
} from "react-native";

const CATEGORIES = [
  { name: "All", icon: "grid-outline" as const },
  { name: "Electronics", image: require("@/assets/images/electronics.png") },
  { name: "Fashion", image: require("@/assets/images/fashion.png") },
  { name: "Sports", image: require("@/assets/images/sports.png") },
  { name: "Books", image: require("@/assets/images/books.png") },
  { name: "Accessories", icon: "bag-outline" as const },
];

const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "price-low", label: "Price: low to high" },
  { id: "price-high", label: "Price: high to low" },
  { id: "rating", label: "Top rated" },
] as const;

type SortOption = (typeof SORT_OPTIONS)[number]["id"];

const ShopScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState<SortOption>("featured");
  const [showSortOptions, setShowSortOptions] = useState(false);

  const { data: products, isLoading, isFetching, isError, refetch } = useProducts();

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products;

    // filtering by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter((product) => product.category === selectedCategory);
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }

    const sorted = [...filtered];
    if (sortOption === "price-low") sorted.sort((a, b) => a.price - b.price);
    if (sortOption === "price-high") sorted.sort((a, b) => b.price - a.price);
    if (sortOption === "rating") sorted.sort((a, b) => b.averageRating - a.averageRating);

    return sorted;
  }, [products, selectedCategory, searchQuery, sortOption]);

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View
          className="px-6 pb-4 pt-6"
          style={{ width: "100%", maxWidth: 1280, alignSelf: "center" }}
        >
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-text-primary text-3xl font-bold tracking-tight">AfriCart</Text>
              <Text className="text-text-secondary text-sm mt-1">Browse all products</Text>
            </View>

            <TouchableOpacity
              className="bg-surface/50 p-3 rounded-full"
              activeOpacity={0.7}
              onPress={() => setShowSortOptions(true)}
              accessibilityRole="button"
              accessibilityLabel="Sort products"
            >
              <Ionicons name="options-outline" size={22} color={"#fff"} />
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View className="bg-surface flex-row items-center px-5 py-4 rounded-2xl">
            <Ionicons color={"#666"} size={22} name="search" />
            <TextInput
              placeholder="Search for products"
              placeholderTextColor={"#666"}
              className="flex-1 ml-3 text-base text-text-primary"
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search products"
            />
          </View>
        </View>

        {/* CATEGORY FILTER */}
        <View className="mb-6" style={{ width: "100%", maxWidth: 1280, alignSelf: "center" }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategory === category.name;
              return (
                <TouchableOpacity
                  key={category.name}
                  onPress={() => setSelectedCategory(category.name)}
                  className={`mr-3 rounded-2xl size-20 overflow-hidden items-center justify-center ${isSelected ? "bg-primary" : "bg-surface"}`}
                  style={{
                    width: 80,
                    height: 80,
                    marginRight: 12,
                    borderRadius: 16,
                    backgroundColor: isSelected ? "#00D9FF" : "#1C1C1E",
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${category.name}`}
                  accessibilityState={{ selected: isSelected }}
                >
                  {category.icon ? (
                    <Ionicons
                      name={category.icon}
                      size={36}
                      color={isSelected ? "#121212" : "#fff"}
                    />
                  ) : (
                    <Image
                      source={category.image}
                      className="size-12"
                      style={{ width: 48, height: 48 }}
                      resizeMode="contain"
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View
          className="px-6 mb-6"
          style={{ width: "100%", maxWidth: 1280, alignSelf: "center" }}
        >
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-text-primary text-lg font-bold">Products</Text>
            {!isError && (
              <Text className="text-text-secondary text-sm">{filteredProducts.length} items</Text>
            )}
          </View>

          {/* PRODUCTS GRID */}
          <ProductsGrid
            products={filteredProducts}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            hasCatalogProducts={Boolean(products?.length)}
            onRetry={() => {
              void refetch();
            }}
          />
        </View>
      </ScrollView>

      <Modal
        visible={showSortOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortOptions(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
            backgroundColor: "rgba(0,0,0,0.65)",
          }}
        >
          <Pressable
            style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
            onPress={() => setShowSortOptions(false)}
            accessibilityLabel="Close sort options"
          />
          <View
            style={{
              width: "100%",
              maxWidth: 420,
              padding: 24,
              borderRadius: 24,
              backgroundColor: "#1C1C1E",
            }}
          >
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-text-primary text-xl font-bold">Sort products</Text>
              <TouchableOpacity
                onPress={() => setShowSortOptions(false)}
                accessibilityRole="button"
                accessibilityLabel="Close sort options"
              >
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            {SORT_OPTIONS.map((option) => {
              const isSelected = sortOption === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  className="flex-row items-center justify-between rounded-xl px-4 py-4 mb-2"
                  style={{ backgroundColor: isSelected ? "#263238" : "#282828" }}
                  onPress={() => {
                    setSortOption(option.id);
                    setShowSortOptions(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text className="text-text-primary font-medium">{option.label}</Text>
                  <Ionicons
                    name={isSelected ? "radio-button-on" : "radio-button-off"}
                    size={20}
                    color={isSelected ? "#00D9FF" : "#888888"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
};

export default ShopScreen;
