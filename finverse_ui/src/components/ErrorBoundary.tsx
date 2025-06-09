import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
    
    window.dispatchEvent(new CustomEvent('errorBoundaryRetry', {
      detail: { error: this.state.error, timestamp: Date.now() }
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
              <p className="text-muted-foreground mb-4">
                The dashboard encountered an unexpected error. Click retry to recover without refreshing the page.
              </p>
              {this.state.error && (
                <details className="text-sm text-muted-foreground mb-4">
                  <summary className="cursor-pointer hover:text-foreground">Error Details</summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-left overflow-auto">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
              >
                Force Refresh
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
