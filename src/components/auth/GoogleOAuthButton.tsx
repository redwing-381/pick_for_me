// Google OAuth Button Component
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface GoogleOAuthButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  variant?: 'default' | 'outline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  useRedirect?: boolean; // Use redirect instead of popup for mobile compatibility
  className?: string;
}

export function GoogleOAuthButton({
  onSuccess,
  onError,
  redirectTo,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  disabled = false,
  useRedirect = false,
  className = ''
}: GoogleOAuthButtonProps) {
  const { loginWithGoogle, loading } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle Google OAuth sign-in
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      if (useRedirect) {
        // Use redirect method (better for mobile)
        // Note: This would require additional implementation in auth service
        console.log('Redirect method not fully implemented yet');
        return;
      }
      
      await loginWithGoogle();
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Handle redirect if specified
      if (redirectTo) {
        window.location.href = redirectTo;
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed';
      
      // Call error callback if provided
      if (onError) {
        onError(errorMessage);
      }
      
      console.error('Google OAuth error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [loginWithGoogle, onSuccess, onError, redirectTo, useRedirect]);

  // Check for mobile device to suggest redirect method
  const isMobile = useCallback(() => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Effect to handle redirect result (if using redirect method)
  useEffect(() => {
    if (useRedirect) {
      // Handle redirect result
      // This would require additional implementation
    }
  }, [useRedirect]);

  // Button size classes
  const sizeClasses = {
    sm: 'py-2 px-3 text-sm',
    md: 'py-3 px-4 text-base',
    lg: 'py-4 px-6 text-lg'
  };

  // Button variant classes - updated for neo-brutalism consistency
  const variantClasses = {
    default: 'bg-white hover:bg-gray-50 text-black border-black',
    outline: 'bg-transparent hover:bg-gray-50 text-black border-black',
    minimal: 'bg-gray-100 hover:bg-gray-200 text-black border-black'
  };

  const isDisabled = disabled || loading || isProcessing;

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isDisabled}
      className={`
        ${fullWidth ? 'w-full' : 'inline-flex'}
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        font-bold border-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        active:shadow-none active:translate-x-1 active:translate-y-1
        transition-all duration-200
        ${!isDisabled ? 'hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        flex items-center justify-center space-x-3
        ${className}
      `}
      aria-label="Sign in with Google"
    >
      {isProcessing ? (
        <>
          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Signing in...</span>
        </>
      ) : (
        <>
          <GoogleIcon />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}

// Google Icon Component
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

// Standalone Google OAuth component with error handling
interface GoogleOAuthProps {
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  redirectTo?: string;
  showDivider?: boolean;
  className?: string;
}

export function GoogleOAuth({
  title = "Continue with Google",
  subtitle = "Sign in using your Google account",
  onSuccess,
  onError,
  redirectTo,
  showDivider = true,
  className = ''
}: GoogleOAuthProps) {
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback(() => {
    setError(null);
    if (onSuccess) {
      onSuccess();
    }
  }, [onSuccess]);

  const handleError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
  }, [onError]);

  return (
    <div className={`space-y-4 max-w-full overflow-hidden ${className}`}>
      {showDivider && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 font-medium">Or</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg max-w-full overflow-hidden">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-800 font-medium break-words">Google Sign-in Error</p>
              <p className="text-xs text-red-700 mt-1 break-words">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="text-center max-w-full overflow-hidden">
        <h3 className="text-lg font-bold text-gray-900 mb-2 break-words">{title}</h3>
        <p className="text-sm text-gray-600 mb-4 break-words">{subtitle}</p>
        
        <GoogleOAuthButton
          onSuccess={handleSuccess}
          onError={handleError}
          redirectTo={redirectTo}
          fullWidth={true}
          size="lg"
        />
      </div>

      {/* OAuth Benefits */}
      <div className="mt-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg max-w-full overflow-hidden">
        <div className="flex items-start space-x-2">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-blue-800 font-medium break-words">Secure & Convenient</p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1">
              <li className="break-words">• No need to remember another password</li>
              <li className="break-words">• Protected by Google's security</li>
              <li className="break-words">• Quick and easy sign-in</li>
              <li className="break-words">• Your password is never shared</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <details className="mt-4 max-w-full overflow-hidden">
        <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800 break-words">
          Having trouble with Google sign-in?
        </summary>
        <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 max-w-full overflow-hidden">
          <ul className="space-y-1">
            <li className="break-words">• Make sure pop-ups are enabled</li>
            <li className="break-words">• Try signing out and back in</li>
            <li className="break-words">• Clear browser cache and cookies</li>
            <li className="break-words">• Disable blocking extensions</li>
            <li className="break-words">• Try incognito/private mode</li>
          </ul>
        </div>
      </details>
    </div>
  );
}