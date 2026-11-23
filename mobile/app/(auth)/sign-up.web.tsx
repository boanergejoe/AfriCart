import { SignUp } from "@clerk/expo/web";
import { Link } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import BrandLoader from "@/components/BrandLoader";
import { clerkAppearance } from "@/lib/clerkAppearance";

const SignUpWebScreen = () => (
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
      <Text className="text-text-primary text-3xl font-bold">Create your AfriCart account</Text>
      <Text className="text-text-secondary text-center text-base">
        Register to shop, save addresses, and follow your orders.
      </Text>
      <SignUp
        routing="hash"
        fallbackRedirectUrl="/"
        forceRedirectUrl="/"
        signInFallbackRedirectUrl="/"
        signInForceRedirectUrl="/"
        fallback={<BrandLoader label="Preparing secure registration…" />}
        appearance={clerkAppearance}
      />
      <View className="mt-3 w-full items-center gap-2">
        <Text className="text-text-secondary text-center text-sm">Already have an account?</Text>
        <Link
          href="/sign-in"
          className="border-background-lighter w-full items-center rounded-2xl border px-6 py-4"
          accessibilityRole="link"
        >
          <Text className="text-text-primary text-base font-semibold">Sign in</Text>
        </Link>
      </View>
    </View>
  </ScrollView>
);

export default SignUpWebScreen;
