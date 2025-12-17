// Hook for logout functionality with enhanced features
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export interface LogoutOptions {
  redirectTo?: string;
  showConfirmation?: boolean;
  clearLocalData?: boolean;
  onLogoutStart?: () => void;
  onLogoutComplete?: () => void;
  onLogoutError?: (error: any) => void;
}

export interface LogoutState {
  isLoggingOut: boolean;
  logoutError: string | null;
  logoutSuccess: boolean;
}

export interface LogoutActions {
  logout: (options?: LogoutOptions) => Promise<void>;
  quickLogout: () => Promise<void>;
  confirmLogout: () => Promise<void>;
  resetLogoutState: () => void;
}

/**
 * Hook for managing logout functionality with enhanced features
 */
export function useLogout(defaultOptions: LogoutOptions = {}): LogoutState & LogoutActions {
  const { logout: authLogout, user } = useAuth();
  const router = useRouter();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [logoutSuccess, setLogoutSuccess] = useState(false);

  const resetLogoutState = useCallback(() => {
    setIsLoggingOut(false);
    setLogoutError(null);
    setLogoutSuccess(false);
  }, []);

  const performLogout = useCallback(async (options: LogoutOptions = {}) => {
    const {
      redirectTo = defaultOptions.redirectTo || '/',
      clearLocalData = defaultOptions.clearLocalData ?? true,
      onLogoutStart = defaultOptions.onLogoutStart,
      onLogoutComplete = defaultOptions.onLogoutComplete,
      onLogoutError = defaultOptions.onLogoutError,
    } = { ...defaultOptions, ...options };

    try {
      setIsLoggingOut(true);
      setLogoutError(null);
      setLogoutSuccess(false);

      onLogoutStart?.();

      // Perform the actual logout
      await authLogout();

      // Clear additional local data if requested
      if (clearLocalData) {
        // Clear any additional app-specific data
        localStorage.removeItem('app-preferences');
        localStorage.removeItem('temp-data');
        // Add other cleanup as needed
      }

      setLogoutSuccess(true);
      onLogoutComplete?.();

      // Redirect after a brief delay to show success message
      setTimeout(() => {
        router.push(redirectTo);
      }, 1000);

    } catch (error) {
      console.error('Logout failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setLogoutError(errorMessage);
      onLogoutError?.(error);

      // Even if logout fails, redirect for security
      setTimeout(() => {
        router.push(redirectTo);
      }, 1500);
    } finally {
      setIsLoggingOut(false);
    }
  }, [authLogout, router, defaultOptions]);

  const logout = useCallback(async (options: LogoutOptions = {}) => {
    await performLogout(options);
  }, [performLogout]);

  const quickLogout = useCallback(async () => {
    await performLogout({
      showConfirmation: false,
      redirectTo: '/',
    });
  }, [performLogout]);

  const confirmLogout = useCallback(async () => {
    await performLogout({
      showConfirmation: true,
    });
  }, [performLogout]);

  return {
    isLoggingOut,
    logoutError,
    logoutSuccess,
    logout,
    quickLogout,
    confirmLogout,
    resetLogoutState,
  };
}

/**
 * Hook for logout with automatic cleanup
 */
export function useLogoutWithCleanup(cleanupFunctions: (() => void)[] = []) {
  const logoutHook = useLogout({
    onLogoutStart: () => {
      // Run cleanup functions before logout
      cleanupFunctions.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Cleanup function failed:', error);
        }
      });
    },
  });

  return logoutHook;
}

/**
 * Hook for logout with session monitoring
 */
export function useSecureLogout() {
  const logoutHook = useLogout({
    clearLocalData: true,
    onLogoutComplete: () => {
      // Additional security measures
      if (typeof window !== 'undefined') {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear any cached data
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
      }
    },
  });

  return logoutHook;
}

/**
 * Hook for logout with network failure handling
 */
export function useRobustLogout() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const forceLogout = useCallback(async (redirectTo: string = '/') => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      // Try normal logout first
      const { logout: authLogout } = useAuth();
      await authLogout();
    } catch (error) {
      console.warn('Normal logout failed, forcing local logout:', error);
      setLogoutError('Network error during logout');
    }

    // Always clear local data regardless of network status
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }

    // Always redirect for security
    router.push(redirectTo);
    setIsLoggingOut(false);
  }, [router]);

  return {
    isLoggingOut,
    logoutError,
    forceLogout,
    canForceLogout: !!user,
  };
}