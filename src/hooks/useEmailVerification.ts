// Hook for email verification status and protection
'use client';

import { useAuth } from './useAuth';
import { useCallback } from 'react';

export interface EmailVerificationStatus {
  isVerified: boolean;
  isRequired: boolean;
  user: any;
  sendVerification: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for checking email verification status and protecting features
 */
export function useEmailVerification(requireVerification: boolean = false): EmailVerificationStatus {
  const { user, sendEmailVerification, loading, error } = useAuth();

  const sendVerification = useCallback(async () => {
    if (user && !user.emailVerified) {
      await sendEmailVerification();
    }
  }, [user, sendEmailVerification]);

  return {
    isVerified: user?.emailVerified || false,
    isRequired: requireVerification,
    user,
    sendVerification,
    loading,
    error,
  };
}

/**
 * Hook for protecting components that require email verification
 */
export function useRequireEmailVerification() {
  const { user } = useAuth();
  
  const isVerificationRequired = useCallback((showWarning: boolean = true) => {
    if (!user) {
      return false; // Not logged in, so verification not applicable
    }
    
    if (!user.emailVerified) {
      if (showWarning) {
        console.warn('Email verification required for this feature');
      }
      return true;
    }
    
    return false;
  }, [user]);

  const canAccessFeature = useCallback(() => {
    return user?.emailVerified || false;
  }, [user]);

  return {
    isVerificationRequired,
    canAccessFeature,
    user,
    isVerified: user?.emailVerified || false,
  };
}