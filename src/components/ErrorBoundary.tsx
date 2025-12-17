'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AuthError, AuthErrorCode, AuthErrorSeverity } from '../lib/errors';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error
    this.logError(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const authError = error instanceof AuthError 
      ? error 
      : new AuthError(
          AuthErrorCode.UNKNOWN_ERROR,
          'An unexpected error occurred in the application.',
          error.message,
          AuthErrorSeverity.CRITICAL,
          {
            component: 'ErrorBoundary',
            action: 'componentDidCatch',
            additionalData: {
              componentStack: errorInfo.componentStack,
              errorBoundary: true,
            },
          },
          error
        );

    // Log error details
    const logData = authError.toLogObject();
    
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Auth Error:', logData);
      console.groupEnd();
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service
      // logToService(logData);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI with neo-brutalism styling
      return (
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">⚠️</span>
                <h1 className="text-3xl font-black text-black">SOMETHING WENT WRONG</h1>
              </div>
              <div className="h-1 w-full bg-red-400 border-2 border-black"></div>
            </div>
            
            {/* Content */}
            <div className="space-y-6">
              <div className="bg-red-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                <p className="text-black font-bold text-lg">
                  We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
                </p>
              </div>

              <div className="bg-blue-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div>
                    <p className="text-black font-black mb-2">WHAT YOU CAN DO:</p>
                    <ul className="space-y-1 text-black font-bold text-sm">
                      <li>• Try refreshing the page</li>
                      <li>• Clear your browser cache</li>
                      <li>• Try again in a few minutes</li>
                      <li>• Contact support if the problem persists</li>
                    </ul>
                  </div>
                </div>
              </div>
                
              {this.props.showDetails && this.state.error && (
                <details className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
                  <summary className="font-black cursor-pointer text-sm text-black">
                    🔧 TECHNICAL DETAILS (ERROR ID: {this.state.errorId})
                  </summary>
                  <div className="mt-4 space-y-3 text-sm font-mono">
                    <div className="bg-gray-100 border-2 border-black p-3">
                      <strong className="font-black">Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div className="bg-gray-100 border-2 border-black p-3">
                        <strong className="font-black">Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-2 bg-white p-2 border-2 border-black overflow-auto max-h-48">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div className="bg-gray-100 border-2 border-black p-3">
                        <strong className="font-black">Component Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-2 bg-white p-2 border-2 border-black overflow-auto max-h-48">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
            
            {/* Actions */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={this.handleRetry}
                className="flex-1 py-3 px-4 font-black border-4 border-black bg-yellow-400 hover:bg-yellow-500 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
              >
                TRY AGAIN
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 font-black border-4 border-black bg-white hover:bg-gray-50 text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
              >
                RELOAD PAGE
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}