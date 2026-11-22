import { useEffect, type ReactNode } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import Head from "expo-router/head";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClientProvider } from "@tanstack/react-query";
import * as Sentry from "@sentry/react-native";

import AppErrorBoundary from "@/components/AppErrorBoundary";
import AuthBridge from "@/components/AuthBridge";
import BrandLoader from "@/components/BrandLoader";
import { queryClient } from "@/lib/queryClient";
import palette from "@/lib/theme";
import "../global.css";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) {
  throw new Error("Add EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY to mobile/.env before building the app.");
}

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    sendDefaultPii: false,
    enableLogs: false,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    integrations: [Sentry.mobileReplayIntegration()],
  });
}

function AuthGuard({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === "(auth)";
    if (!isSignedIn && !inAuthGroup) router.replace("/(auth)");
    else if (isSignedIn && inAuthGroup) router.replace("/(tabs)");
  }, [isLoaded, isSignedIn, segments, router]);

  if (!isLoaded) return <BrandLoader />;
  return children;
}

export default Sentry.wrap(function RootLayout() {
  return (
    <AppErrorBoundary>
      <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
        <AuthBridge>
          <QueryClientProvider client={queryClient}>
            <AuthGuard>
              <Head>
                <title>AfriCart</title>
                <meta name="description" content="Shop quality products with AfriCart." />
                <meta name="theme-color" content={palette.brand.DEFAULT} />
              </Head>
              <Stack screenOptions={{ headerShown: false }} />
            </AuthGuard>
          </QueryClientProvider>
        </AuthBridge>
      </ClerkProvider>
    </AppErrorBoundary>
  );
});
