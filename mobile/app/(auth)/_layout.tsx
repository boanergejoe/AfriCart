import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

import BrandLoader from "@/components/BrandLoader";

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <BrandLoader label="Checking your session…" />;
  if (isSignedIn) return <Redirect href="/(tabs)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
