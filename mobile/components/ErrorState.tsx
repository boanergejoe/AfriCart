import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import palette from "@/lib/theme";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "Please check your connection and try again",
  onRetry,
}: ErrorStateProps) {
  return (
    <View className="flex-1 bg-background items-center justify-center px-6" accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={64} color={palette.accent.danger} />
      <Text className="text-text-primary font-semibold text-xl mt-4">{title}</Text>
      <Text className="text-text-secondary text-center mt-2">{description}</Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="mt-4 bg-primary px-6 py-3 rounded-xl"
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text className="text-background font-semibold">Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
