import { SignIn } from "@clerk/clerk-expo/web";
import { ScrollView, Text, View } from "react-native";

import BrandLoader from "@/components/BrandLoader";
import palette from "@/lib/theme";

const clerkAppearance = {
  variables: {
    colorPrimary: palette.brand.DEFAULT,
    colorBackground: palette.light.background,
    colorText: palette.light.text,
    colorTextSecondary: palette.light.muted,
    colorInputBackground: palette.light.background,
    colorInputText: palette.light.text,
    colorNeutral: palette.light.border,
    borderRadius: "0.85rem",
  },
};

const AuthWebScreen = () => (
  <ScrollView
    className="flex-1 bg-background"
    contentContainerStyle={{
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
      paddingVertical: 40,
    }}
  >
    <View className="w-full items-center gap-3" style={{ maxWidth: 420 }}>
      <Text className="text-text-primary text-3xl font-bold">Welcome to AfriCart</Text>
      <Text className="text-text-secondary text-center text-base">
        Sign in or create an account to shop and track your orders.
      </Text>
      <SignIn
        withSignUp
        routing="hash"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
        fallback={<BrandLoader label="Preparing secure sign-in…" />}
        appearance={clerkAppearance}
      />
    </View>
  </ScrollView>
);

export default AuthWebScreen;
