import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useApi } from "@/lib/api";
import { Product } from "@/types";

const useWishlist = () => {
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
    data: wishlist,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const { data } = await api.get<{ wishlist: Product[] }>("/users/wishlist");
      return data.wishlist;
    },
  });

  const invalidateWishlist = () => queryClient.invalidateQueries({ queryKey: ["wishlist"] });

  const addToWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.post<{ wishlist: string[] }>("/users/wishlist", { productId });
      return data.wishlist;
    },
    onMutate: (productId: string) => trackProduct(productId),
    onSuccess: invalidateWishlist,
    onSettled: (_data, _error, productId: string) => untrackProduct(productId),
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data } = await api.delete<{ wishlist: string[] }>(`/users/wishlist/${productId}`);
      return data.wishlist;
    },
    onMutate: (productId: string) => trackProduct(productId),
    onSuccess: invalidateWishlist,
    onSettled: (_data, _error, productId: string) => untrackProduct(productId),
  });

  const isInWishlist = (productId: string) => {
    return wishlist?.some((product) => product._id === productId) ?? false;
  };

  const toggleWishlist = (productId: string, callbacks?: MutationCallbacks) => {
    if (isInWishlist(productId)) {
      removeFromWishlistMutation.mutate(productId, callbacks);
    } else {
      addToWishlistMutation.mutate(productId, callbacks);
    }
  };

  return {
    wishlist: wishlist || [],
    isLoading,
    isError,
    wishlistCount: wishlist?.length || 0,
    isInWishlist,
    isProductPending: (productId: string) => pendingProductIds.includes(productId),
    toggleWishlist,
    addToWishlist: addToWishlistMutation.mutate,
    removeFromWishlist: removeFromWishlistMutation.mutate,
    isAddingToWishlist: addToWishlistMutation.isPending,
    isRemovingFromWishlist: removeFromWishlistMutation.isPending,
  };
};

type MutationCallbacks = {
  onSuccess?: () => void;
  onError?: (error: unknown) => void;
};

export default useWishlist;
