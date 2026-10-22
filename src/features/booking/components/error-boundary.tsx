'use client';

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class BookingErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🔍 BookingErrorBoundary: Error caught', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🔍 BookingErrorBoundary: Component stack trace', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-danger-soft border border-danger/30 rounded-card p-6">
            <h2 className="text-lg font-semibold text-danger mb-2">
              Something went wrong
            </h2>
            <p className="text-danger mb-4">
              There was an error loading this step of the booking form.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="h-11 rounded-control bg-danger px-4 font-bold text-on-strong hover:opacity-90"
            >
              Try Again
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4">
                <summary className="text-fine text-danger cursor-pointer">
                  Error Details (Dev Mode)
                </summary>
                <pre className="mt-2 text-fine text-danger overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}