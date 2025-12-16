'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AppError, createErrorContext, AppErrorHandler } from '@/lib/error-handling';

// =============================================================================
// ERROR BOUNDARY PROPS AND STATE
// =============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: AppError, retry: () => void) => ReactNode;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  component?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
}

// =============================================================================
// ERROR BOUNDARY COMPONENT
// =============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorHandler: AppErrorHandler;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
    this.errorHandler = AppErrorHandler.getInstance();
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const context = createErrorContext(
      this.props.component || 'ErrorBoundary',
      'componentDidCatch',
      {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    );

    const appError = this.errorHandler.createError(
      'UNKNOWN_ERROR',
      error,
      context,
      'Something went wrong. Please try refreshing the page.'
    );

    this.setState({
      error: appError,
      errorInfo
    });

    this.props.onError?.(appError, errorInfo);
  }

  retry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return <DefaultErrorFallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

// =============================================================================
// DEFAULT ERROR FALLBACK COMPONENT
// =============================================================================

interface DefaultErrorFallbackProps {
  error: AppError;
  retry: () => void;
}

function DefaultErrorFallback({ error, retry }: DefaultErrorFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-600">Error Code: {error.code}</p>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-4">{error.userMessage}</p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="bg-gray-50 rounded p-3 text-sm">
              <summary className="cursor-pointer text-gray-600 font-medium">
                Technical Details
              </summary>
              <div className="mt-2 text-gray-500">
                <p><strong>Message:</strong> {error.message}</p>
                <p><strong>Timestamp:</strong> {error.timestamp.toISOString()}</p>
                <p><strong>Component:</strong> {String(error.context?.component || 'Unknown')}</p>
                <p><strong>Action:</strong> {String(error.context?.action || 'Unknown')}</p>
              </div>
            </details>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={retry}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Refresh Page
          </button>
        </div>

        {error.retryable && (
          <p className="text-xs text-gray-500 text-center mt-3">
            This error can be retried. Please try again or refresh the page.
          </p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// SPECIALIZED ERROR BOUNDARIES
// =============================================================================

interface APIErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'fallback'> {
  children: ReactNode;
}

export function APIErrorBoundary({ children, ...props }: APIErrorBoundaryProps) {
  return (
    <ErrorBoundary
      {...props}
      component="APIErrorBoundary"
      fallback={(error, retry) => (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-1">API Error</h4>
              <p className="text-sm text-red-700 mb-3">{error.userMessage}</p>
              <button
                onClick={retry}
                className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

interface LocationErrorBoundaryProps extends Omit<ErrorBoundaryProps, 'fallback'> {
  children: ReactNode;
}

export function LocationErrorBoundary({ children, ...props }: LocationErrorBoundaryProps) {
  return (
    <ErrorBoundary
      {...props}
      component="LocationErrorBoundary"
      fallback={(error, retry) => (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 m-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">Location Error</h4>
              <p className="text-sm text-yellow-700 mb-3">{error.userMessage}</p>
              <div className="flex space-x-2">
                <button
                  onClick={retry}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {/* Navigate to manual location entry */}}
                  className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded hover:bg-yellow-200 transition-colors"
                >
                  Enter Manually
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}