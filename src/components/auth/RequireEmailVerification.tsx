// Higher-order component for protecting features that require email verification
'use client';

import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { EmailVerification } from './EmailVerification';

interface RequireEmailVerificationProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ user: any }>;
  showVerificationPrompt?: boolean;
  message?: string;
}

/**
 * Component that requires email verification to access its children
 */
export function RequireEmailVerification({
  children,
  fallback: FallbackComponent,
  showVerificationPrompt = true,
  message = "This feature requires email verification."
}: RequireEmailVerificationProps) {
  const { user, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h3 className="text-lg font-black text-black mb-2">AUTHENTICATION REQUIRED</h3>
          <p className="text-gray-700 font-bold">Please sign in to access this feature.</p>
        </div>
      </div>
    );
  }

  // Email is verified - show children
  if (user.emailVerified) {
    return <>{children}</>;
  }

  // Email not verified - show fallback or verification prompt
  if (FallbackComponent) {
    return <FallbackComponent user={user} />;
  }

  if (showVerificationPrompt) {
    return <EmailVerification user={user} />;
  }

  // Default fallback
  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6">
      <div className="text-center">
        <svg className="w-12 h-12 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <h3 className="text-lg font-black text-black mb-2">EMAIL VERIFICATION REQUIRED</h3>
        <p className="text-gray-700 font-bold mb-4">{message}</p>
        <p className="text-sm text-gray-600 font-bold">
          Please verify your email address to continue.
        </p>
      </div>
    </div>
  );
}

/**
 * Hook-based version for conditional rendering
 */
export function useRequireEmailVerification() {
  const { user } = useAuth();
  
  const canAccess = user?.emailVerified || false;
  const needsVerification = user && !user.emailVerified;
  const needsAuth = !user;

  return {
    canAccess,
    needsVerification,
    needsAuth,
    user,
  };
}