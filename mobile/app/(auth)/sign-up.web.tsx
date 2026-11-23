import { SignUp } from "@clerk/expo/web";
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
    </View>
  </ScrollView>
);

export default SignUpWebScreen;
