import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/lib/api";
import { Cart } from "@/types";

type AddToCartInput = { productId: string; quantity?: number };
type UpdateQuantityInput = { productId: string; quantity: number };

const useCart = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const [pendingProductIds, setPendingProductIds] = useState<string[]>([]);

  const trackProduct = (productId: string) => {
    setPendingProductIds((current) =>
      current.includes(productId) ? current : [...current, productId]
    );
  };

  const untrackProduct = (productId: string) => {
    setPendingProductIds((current) => current.filter((id) => id !== productId));
  };

  const {
    data: cart,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const { data } = await api.get<{ cart: Cart }>("/cart");
      return data.cart;
    },
  });

  const invalidateCart = () => queryClient.invalidateQueries({ queryKey: ["cart"] });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: AddToCartInput) => {
      const { data } = await api.post<{ cart: Cart }>("/cart", { productId, quantity });
      return data.cart;
    },
    onMutate: ({ productId }: AddToCartInput) => trackProduct(productId),
    onSuccess: invalidateCart,
    onSettled: (_data, _error, variables: AddToCartInput) => untrackProduct(variables.productId),
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ productId, quantity }: UpdateQuantityInput) => {
      const { data } = await api.put<{ cart: Cart }>(`/cart/${productId}`, { quantity });
      return data.cart;
    },
    onMutate: ({ productId }: UpdateQuantityInput) => trackProduct(productId),
    onSuccess: invalidateCart,
    onSettled: (_data, _error, variables: UpdateQuantityInput) => untrackProduct(variables.productId),
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete<{ cart: Cart }>(`/cart/${productId}`);
      return data.cart;
    },
    onMutate: (productId: string) => trackProduct(productId),
    onSuccess: invalidateCart,
    onSettled: (_data, _error, productId: string) => untrackProduct(productId),
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<{ cart: Cart }>("/cart");
      return data.cart;
    },
    onSuccess: invalidateCart,
  });

  const cartTotal =
    cart?.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) ?? 0;

  const cartItemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  return {
    cart,
    isLoading,
    isError,
    refetch,
    cartTotal,
    cartItemCount,
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isProductPending: (productId: string) => pendingProductIds.includes(productId),
    isAddingToCart: addToCartMutation.isPending,
    isUpdating: updateQuantityMutation.isPending,
    isRemoving: removeFromCartMutation.isPending,
    isClearing: clearCartMutation.isPending,
  };
};

export default useCart;
