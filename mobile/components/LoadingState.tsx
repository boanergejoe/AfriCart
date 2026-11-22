import { ActivityIndicator, Text, View } from "react-native";

import palette from "@/lib/theme";

interface LoadingStateProps {
  message?: string;
  color?: string;
}

const LoadingState = ({ message = "Loading…", color = palette.primary.DEFAULT }: LoadingStateProps) => {
  return (
    <View className="flex-1 bg-background items-center justify-center" accessibilityRole="progressbar">
      <ActivityIndicator size="large" color={color} />
      <Text className="text-text-secondary mt-4">{message}</Text>
    </View>
  );
};

export default LoadingState;
