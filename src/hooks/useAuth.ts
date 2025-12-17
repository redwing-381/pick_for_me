// Custom authentication hook with additional utilities
'use client';

import { useContext, useCallback, useMemo } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { AuthContextType, UserProfile } from '../types/auth';

/**
 * Enhanced authentication hook with additional utilities
 */
export function useAuth(): AuthContextType & {
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  isLoading: boolean;
  hasError: boolean;
  userDisplayName: string;
  loginWithRememberMe: (email: string, password: string, rememberMe: boolean) => Promise<void>;
} {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  // Enhanced login with explicit rememberMe parameter
  const loginWithRememberMe = useCallback(
    async (email: string, password: string, rememberMe: boolean) => {
      return context.login(email, password, rememberMe);
    },
    [context.login]
  );

  // Computed values
  const isAuthenticated = useMemo(() => context.user !== null, [context.user]);
  const isEmailVerified = useMemo(() => context.user?.emailVerified ?? false, [context.user]);
  const isLoading = useMemo(() => context.loading, [context.loading]);
  const hasError = useMemo(() => context.error !== null, [context.error]);
  const userDisplayName = useMemo(() => {
    if (!context.user) return '';
    return context.user.displayName || context.user.email || 'User';
  }, [context.user]);

  return {
    ...context,
    isAuthenticated,
    isEmailVerified,
    isLoading,
    hasError,
    userDisplayName,
    loginWithRememberMe,
  };
}

/**
 * Hook for authentication guards and route protection
 */
export function useAuthGuard() {
  const { user, loading } = useAuth();
  
  const isAuthenticated = useMemo(() => user !== null, [user]);
  const isReady = useMemo(() => !loading, [loading]);
  const shouldRedirect = useMemo(() => isReady && !isAuthenticated, [isReady, isAuthenticated]);
  
  return {
    user,
    loading,
    isAuthenticated,
    isReady,
    shouldRedirect,
  };
}

/**
 * Hook for form authentication state
 */
export function useAuthForm() {
  const { login, register, loginWithGoogle, resetPassword, loading, error } = useAuth();
  
  const loginWithForm = useCallback(
    async (email: string, password: string, rememberMe: boolean = false) => {
      return login(email, password, rememberMe);
    },
    [login]
  );

  const registerWithForm = useCallback(
    async (email: string, password: string, displayName?: string) => {
      return register(email, password, displayName);
    },
    [register]
  );

  return {
    login: loginWithForm,
    register: registerWithForm,
    loginWithGoogle,
    resetPassword,
    loading,
    error,
    isSubmitting: loading,
  };
}

/**
 * Hook for user profile management
 */
export function useUserProfile() {
  const { user, updateProfile, sendEmailVerification, loading, error } = useAuth();
  
  const canUpdateProfile = useMemo(() => user !== null, [user]);
  const needsEmailVerification = useMemo(() => 
    user !== null && !user.emailVerified, 
    [user]
  );
  
  const updateUserProfile = useCallback(
    async (data: { displayName?: string; photoURL?: string }) => {
      if (!canUpdateProfile) {
        throw new Error('No authenticated user found');
      }
      return updateProfile(data);
    },
    [updateProfile, canUpdateProfile]
  );

  const sendVerificationEmail = useCallback(async () => {
    if (!canUpdateProfile) {
      throw new Error('No authenticated user found');
    }
    return sendEmailVerification();
  }, [sendEmailVerification, canUpdateProfile]);

  return {
    user,
    updateProfile: updateUserProfile,
    sendEmailVerification: sendVerificationEmail,
    loading,
    error,
    canUpdateProfile,
    needsEmailVerification,
  };
}

/**
 * Hook for session management utilities
 */
export function useAuthSession() {
  const { user, logout, loading } = useAuth();
  
  const hasActiveSession = useMemo(() => user !== null, [user]);
  const sessionDuration = useMemo(() => {
    if (!user?.lastLoginAt) return null;
    return Date.now() - user.lastLoginAt.getTime();
  }, [user]);
  
  const logoutAndClear = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      // Logout should always succeed locally even if server call fails
      console.error('Logout error:', error);
    }
  }, [logout]);

  return {
    user,
    logout: logoutAndClear,
    loading,
    hasActiveSession,
    sessionDuration,
  };
}