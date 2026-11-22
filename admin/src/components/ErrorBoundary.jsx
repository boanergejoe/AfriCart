import { Component } from "react";
import * as Sentry from "@sentry/react";
import { RotateCcwIcon } from "lucide-react";

class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack ?? "unavailable" },
    });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-base-200 p-6">
        <div role="alert" className="card w-full max-w-lg bg-base-100 shadow-xl">
          <div className="card-body items-center text-center">
            <h1 className="card-title text-2xl">Something went wrong</h1>
            <p className="text-sm text-base-content/70">
              The page could not be displayed. Reloading usually resolves this.
            </p>
            <button
              type="button"
              className="btn btn-primary mt-2"
              onClick={() => window.location.reload()}
            >
              <RotateCcwIcon className="size-4" />
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
