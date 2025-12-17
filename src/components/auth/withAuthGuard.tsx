// Higher-Order Component for authentication guard
'use client';

import React from 'react';
import { AuthGuard } from './AuthGuard';

export interface WithAuthGuardOptions {
  requireEmailVerification?: boolean;
  redirectTo?: string;
  loadingComponent?: React.ComponentType;
  fallbackComponent?: React.ComponentType;
  showLoadingState?: boolean;
}

/**
 * Higher-Order Component that wraps a component with authentication guard
 */
export function withAuthGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthGuardOptions = {}
) {
  const {
    requireEmailVerification = false,
    redirectTo = '/login',
    loadingComponent,
    fallbackComponent,
    showLoadingState = true,
  } = options;

  const AuthGuardedComponent = (props: P) => {
    return (
      <AuthGuard
        requireEmailVerification={requireEmailVerification}
        redirectTo={redirectTo}
        loadingComponent={loadingComponent}
        fallback={fallbackComponent}
        showLoadingState={showLoadingState}
      >
        <WrappedComponent {...props} />
      </AuthGuard>
    );
  };

  // Set display name for debugging
  AuthGuardedComponent.displayName = `withAuthGuard(${WrappedComponent.displayName || WrappedComponent.name})`;

  return AuthGuardedComponent;
}

/**
 * HOC that requires only authentication
 */
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  redirectTo?: string
) {
  return withAuthGuard(WrappedComponent, {
    requireEmailVerification: false,
    redirectTo,
  });
}

/**
 * HOC that requires authentication and email verification
 */
export function withAuthAndVerification<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  redirectTo?: string
) {
  return withAuthGuard(WrappedComponent, {
    requireEmailVerification: true,
    redirectTo,
  });
}

/**
 * HOC with custom loading component
 */
export function withAuthGuardAndLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  LoadingComponent: React.ComponentType,
  options: Omit<WithAuthGuardOptions, 'loadingComponent'> = {}
) {
  return withAuthGuard(WrappedComponent, {
    ...options,
    loadingComponent: LoadingComponent,
  });
}

// Example usage components for demonstration

/**
 * Custom loading component for auth guard
 */
export function AuthLoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="absolute inset-2 border-2 border-blue-500 animate-spin">
              <div className="w-full h-full bg-blue-500 opacity-25"></div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-lg font-black text-black">CHECKING AUTHENTICATION...</p>
        <p className="text-sm text-gray-700 font-bold">Please wait while we verify your access</p>
      </div>
    </div>
  );
}

/**
 * Custom fallback component for unauthenticated users
 */
export function AuthRequiredFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
          <div className="text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-2xl font-black text-black mb-2">ACCESS DENIED</h2>
            <p className="text-gray-700 font-bold mb-6">
              You need to be authenticated to access this content.
            </p>
            
            <div className="space-y-3">
              <a 
                href="/login"
                className="block w-full py-3 px-4 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all bg-yellow-400 hover:bg-yellow-500 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] text-center"
              >
                SIGN IN
              </a>
              <a 
                href="/register"
                className="block w-full py-3 px-4 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all bg-green-400 hover:bg-green-500 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] text-center"
              >
                CREATE ACCOUNT
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}