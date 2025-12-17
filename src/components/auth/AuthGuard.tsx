// Authentication Guard Component for protecting routes
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  requireEmailVerification?: boolean;
  redirectTo?: string;
  loadingComponent?: React.ComponentType;
  showLoadingState?: boolean;
}

/**
 * AuthGuard component that protects routes requiring authentication
 */
export function AuthGuard({
  children,
  fallback: FallbackComponent,
  requireEmailVerification = false,
  redirectTo = '/login',
  loadingComponent: LoadingComponent,
  showLoadingState = true,
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Handle redirects when authentication state changes
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User is not authenticated, redirect to login
        router.push(redirectTo);
        return;
      }

      if (requireEmailVerification && !user.emailVerified) {
        // User is authenticated but email not verified
        // For now, we'll allow access but could add email verification page later
        // router.push('/email-verification');
        // return;
      }
    }
  }, [user, loading, requireEmailVerification, redirectTo, router]);

  // Show loading state while checking authentication
  if (loading) {
    if (LoadingComponent) {
      return <LoadingComponent />;
    }

    if (showLoadingState) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying authentication...</p>
          </div>
        </div>
      );
    }

    return null;
  }

  // User is not authenticated
  if (!user) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    // Default fallback while redirecting
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated but email verification required
  if (requireEmailVerification && !user.emailVerified) {
    if (FallbackComponent) {
      return <FallbackComponent />;
    }

    // Default fallback while redirecting to email verification
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Email verification required...</p>
        </div>
      </div>
    );
  }

  // User is authenticated and meets all requirements
  return <>{children}</>;
}

/**
 * Simplified AuthGuard for basic authentication protection
 */
export function RequireAuth({
  children,
  redirectTo = '/login',
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  return (
    <AuthGuard redirectTo={redirectTo} showLoadingState={true}>
      {children}
    </AuthGuard>
  );
}

/**
 * AuthGuard that also requires email verification
 */
export function RequireAuthAndVerification({
  children,
  redirectTo = '/login',
}: {
  children: React.ReactNode;
  redirectTo?: string;
}) {
  return (
    <AuthGuard 
      redirectTo={redirectTo} 
      requireEmailVerification={true}
      showLoadingState={true}
    >
      {children}
    </AuthGuard>
  );
}