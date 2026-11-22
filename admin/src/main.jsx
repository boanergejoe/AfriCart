import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import * as Sentry from "@sentry/react";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./index.css";
import App from "./App.jsx";
import AdminAuthProvider from "./components/AdminAuthProvider.jsx";
import ConfigurationError from "./components/ConfigurationError.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { ToastProvider } from "./components/Toast.jsx";
import { isApiConfigured } from "./lib/axios.js";
import { queryClient } from "./lib/queryClient.js";

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
      {isApiConfigured ? (
        <BrowserRouter>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <AdminAuthProvider>
                <App />
              </AdminAuthProvider>
            </ToastProvider>
          </QueryClientProvider>
        </BrowserRouter>
      ) : (
        <ConfigurationError />
      )}
    </ErrorBoundary>
  </StrictMode>
);
