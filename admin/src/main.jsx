import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/react";
import { BrowserRouter } from "react-router";
import * as Sentry from "@sentry/react";

import "./index.css";
import App from "./App.jsx";
import ClerkAxiosTokenProvider from "./components/ClerkAxiosTokenProvider.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { queryClient } from "./lib/queryClient.js";

const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!publishableKey) throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");

const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,
    integrations: [Sentry.replayIntegration()],
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ClerkProvider
          publishableKey={publishableKey}
          localization={{ signIn: { start: { title: "Sign in to AfriCart" } } }}
        >
          <ClerkAxiosTokenProvider>
            <QueryClientProvider client={queryClient}>
              <ToastProvider>
                <App />
              </ToastProvider>
            </QueryClientProvider>
          </ClerkAxiosTokenProvider>
        </ClerkProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
