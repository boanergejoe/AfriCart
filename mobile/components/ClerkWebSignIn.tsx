import { SignIn } from "@clerk/expo/web";
import { Link } from "expo-router";
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
      {/* Clerk's built-in link can be hidden by dashboard settings; always offer a clear way in. */}
      <View className="mt-3 w-full items-center gap-2">
        <Text className="text-text-secondary text-center text-sm">New to AfriCart?</Text>
        <Link
          href="/sign-up"
          className="bg-primary w-full items-center rounded-2xl px-6 py-4"
          accessibilityRole="link"
        >
          <Text className="text-background text-base font-semibold">Create an account</Text>
        </Link>
      </View>
    </View>
  </ScrollView>
);

export default ClerkWebSignIn;
