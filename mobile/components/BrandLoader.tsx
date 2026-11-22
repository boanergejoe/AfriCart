import { ActivityIndicator, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import palette from "@/lib/theme";

export default function BrandLoader({ label = "Loading AfriCart…" }: { label?: string }) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background">
      <View className="items-center gap-4">
        <ActivityIndicator size="large" color={palette.primary.DEFAULT} />
        <Text className="text-sm text-text-secondary">{label}</Text>
      </View>
    </SafeAreaView>
  );
}
