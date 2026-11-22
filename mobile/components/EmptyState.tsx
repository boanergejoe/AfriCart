import { Ionicons } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

import palette from "@/lib/theme";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  title: string;
  description?: string;
  header?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "folder-open-outline",
  iconSize = 80,
  title,
  description,
  header,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 bg-background">
      {header && (
        <View className="px-6 pt-16 pb-5">
          <Text className="text-text-primary text-3xl font-bold tracking-tight">{header}</Text>
        </View>
      )}
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name={icon} size={iconSize} color={palette.text.tertiary} />
        <Text className="text-text-primary font-semibold text-xl mt-4 text-center">{title}</Text>
        {description && (
          <Text className="text-text-secondary text-center mt-2">{description}</Text>
        )}
        {onAction && actionLabel && (
          <TouchableOpacity
            className="bg-primary rounded-2xl px-8 py-4 mt-6"
            activeOpacity={0.8}
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text className="text-background font-bold text-base">{actionLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
