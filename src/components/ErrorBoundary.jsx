import React from "react";
import Icon from "./AppIcon";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center p-8 max-w-md">
            <div className="flex justify-center items-center mb-4">
              <Icon name="AlertTriangle" size={48} className="text-destructive" />
            </div>
            <div className="flex flex-col gap-1 text-center">
              <h1 className="text-2xl font-bold text-neutral-800">Something went wrong</h1>
              <p className="text-neutral-600 text-base w-8/12 mx-auto">
                We encountered an unexpected error. Please try refreshing the page.
              </p>
            </div>
            <div className="flex justify-center items-center mt-6">
              <button
                onClick={() => window.location.reload()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded flex items-center gap-2 transition-colors duration-200 shadow-sm"
              >
                <Icon name="RefreshCw" size={18} />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;