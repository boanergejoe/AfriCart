import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/expo";

import BrandLoader from "@/components/BrandLoader";

export default function ProfileRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <BrandLoader label="Checking your session…" />;
  if (!isSignedIn) return <Redirect href="/(auth)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
