import { SignIn } from "@clerk/expo/web";
import { ScrollView, Text, View } from "react-native";

import BrandLoader from "@/components/BrandLoader";
import { clerkAppearance } from "@/lib/clerkAppearance";

/** Shared Clerk sign-in UI for the web routes. */
const ClerkWebSignIn = () => (
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
        signUpUrl="/sign-up"
        signUpFallbackRedirectUrl="/"
        signUpForceRedirectUrl="/"
        fallback={<BrandLoader label="Preparing secure sign-in…" />}
        appearance={clerkAppearance}
      />
    </View>
  </ScrollView>
);

export default ClerkWebSignIn;
