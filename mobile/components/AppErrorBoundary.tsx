import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";
import * as Sentry from "@sentry/react-native";

import { ErrorState } from "@/components/ErrorState";
import SafeScreen from "@/components/SafeScreen";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
  resetKey: number;
}

/** Last-resort UI for render/lifecycle errors that screen-level states cannot catch. */
class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null, resetKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<AppErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    Sentry.captureException(error, {
      extra: { componentStack: info.componentStack ?? "unavailable" },
    });
  }

  private handleRetry = () => {
    this.setState(({ resetKey }) => ({ error: null, resetKey: resetKey + 1 }));
  };

  render() {
    if (this.state.error) {
      return (
        <SafeScreen>
          <ErrorState
            title="AfriCart needs a restart"
            description="The screen could not be displayed. Try again; your signed-in session will be kept."
            onRetry={this.handleRetry}
          />
        </SafeScreen>
      );
    }

    return <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>;
  }
}

export default AppErrorBoundary;
