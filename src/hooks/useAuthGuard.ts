// Hook for authentication guard functionality
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export interface AuthGuardOptions {
  requireEmailVerification?: boolean;
  redirectTo?: string;
  onAuthRequired?: () => void;
  onEmailVerificationRequired?: () => void;
  onAccessGranted?: () => void;
}

export interface AuthGuardState {
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  canAccess: boolean;
  user: any;
  redirectToLogin: () => void;
  redirectToVerification: () => void;
}

/**
 * Hook for implementing authentication guards
 */
export function useAuthGuard(options: AuthGuardOptions = {}): AuthGuardState {
  const {
    requireEmailVerification = false,
    redirectTo = '/login-demo',
    onAuthRequired,
    onEmailVerificationRequired,
    onAccessGranted,
  } = options;

  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);

  const isAuthenticated = !!user;
  const isEmailVerified = user?.emailVerified || false;
  const canAccess = isAuthenticated && (!requireEmailVerification || isEmailVerified);

  const redirectToLogin = useCallback(() => {
    router.push(redirectTo);
  }, [router, redirectTo]);

  const redirectToVerification = useCallback(() => {
    router.push('/email-verification-demo');
  }, [router]);

  // Handle access control logic
  useEffect(() => {
    if (!loading && !hasCheckedAccess) {
      setHasCheckedAccess(true);

      if (!isAuthenticated) {
        onAuthRequired?.();
      } else if (requireEmailVerification && !isEmailVerified) {
        onEmailVerificationRequired?.();
      } else if (canAccess) {
        onAccessGranted?.();
      }
    }
  }, [
    loading,
    isAuthenticated,
    isEmailVerified,
    canAccess,
    requireEmailVerification,
    hasCheckedAccess,
    onAuthRequired,
    onEmailVerificationRequired,
    onAccessGranted,
  ]);

  // Reset check when user changes
  useEffect(() => {
    setHasCheckedAccess(false);
  }, [user?.uid]);

  return {
    isAuthenticated,
    isEmailVerified,
    isLoading: loading,
    canAccess,
    user,
    redirectToLogin,
    redirectToVerification,
  };
}

/**
 * Hook for protecting components with authentication
 */
export function useRequireAuth(redirectTo?: string) {
  const authGuard = useAuthGuard({
    redirectTo,
    onAuthRequired: () => {
      // Auto-redirect if not authenticated
      if (redirectTo) {
        authGuard.redirectToLogin();
      }
    },
  });

  return {
    ...authGuard,
    requireAuth: authGuard.redirectToLogin,
  };
}

/**
 * Hook for protecting components with authentication and email verification
 */
export function useRequireAuthAndVerification(redirectTo?: string) {
  const authGuard = useAuthGuard({
    requireEmailVerification: true,
    redirectTo,
    onAuthRequired: () => {
      if (redirectTo) {
        authGuard.redirectToLogin();
      }
    },
    onEmailVerificationRequired: () => {
      authGuard.redirectToVerification();
    },
  });

  return {
    ...authGuard,
    requireAuth: authGuard.redirectToLogin,
    requireVerification: authGuard.redirectToVerification,
  };
}

/**
 * Hook for conditional rendering based on authentication state
 */
export function useAuthState() {
  const { user, loading } = useAuth();

  const isAuthenticated = !!user;
  const isEmailVerified = user?.emailVerified || false;
  const isLoading = loading;

  const canAccess = useCallback((requireEmailVerification: boolean = false) => {
    if (!isAuthenticated) return false;
    if (requireEmailVerification && !isEmailVerified) return false;
    return true;
  }, [isAuthenticated, isEmailVerified]);

  const getAccessLevel = useCallback(() => {
    if (!isAuthenticated) return 'unauthenticated';
    if (!isEmailVerified) return 'unverified';
    return 'full';
  }, [isAuthenticated, isEmailVerified]);

  return {
    user,
    isAuthenticated,
    isEmailVerified,
    isLoading,
    canAccess,
    getAccessLevel,
  };
}

/**
 * Hook for route-level authentication checks
 */
export function useRouteGuard(options: AuthGuardOptions = {}) {
  const authGuard = useAuthGuard(options);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!authGuard.isLoading) {
      if (authGuard.canAccess) {
        setShouldRender(true);
      } else {
        setShouldRender(false);
        
        // Handle redirects
        if (!authGuard.isAuthenticated) {
          authGuard.redirectToLogin();
        } else if (options.requireEmailVerification && !authGuard.isEmailVerified) {
          authGuard.redirectToVerification();
        }
      }
    }
  }, [authGuard, options.requireEmailVerification]);

  return {
    ...authGuard,
    shouldRender,
  };
}