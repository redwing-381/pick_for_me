// Logout Button Component with confirmation and success messaging
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

interface LogoutButtonProps {
  variant?: 'default' | 'danger' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showConfirmation?: boolean;
  redirectTo?: string;
  onLogoutStart?: () => void;
  onLogoutComplete?: () => void;
  onLogoutError?: (error: any) => void;
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({
  variant = 'default',
  size = 'md',
  showConfirmation = true,
  redirectTo = '/',
  onLogoutStart,
  onLogoutComplete,
  onLogoutError,
  className = '',
  children
}: LogoutButtonProps) {
  const { logout, loading, user } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState(false);

  const handleLogoutClick = useCallback(() => {
    if (showConfirmation) {
      setShowConfirmDialog(true);
    } else {
      performLogout();
    }
  }, [showConfirmation]);

  const performLogout = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      setShowConfirmDialog(false);
      
      onLogoutStart?.();
      
      await logout();
      
      setLogoutSuccess(true);
      onLogoutComplete?.();
      
      // Redirect after a brief success message
      setTimeout(() => {
        router.push(redirectTo);
      }, 1500);
      
    } catch (error) {
      console.error('Logout failed:', error);
      onLogoutError?.(error);
      
      // Even if logout fails, redirect anyway for security
      setTimeout(() => {
        router.push(redirectTo);
      }, 1000);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, onLogoutStart, onLogoutComplete, onLogoutError, router, redirectTo]);

  const cancelLogout = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  // Don't show button if user is not authenticated
  if (!user) {
    return null;
  }

  // Success state
  if (logoutSuccess) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium">Logged out successfully</span>
      </div>
    );
  }

  // Get button styles based on variant and size
  const getButtonStyles = () => {
    const baseStyles = 'font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all';
    
    const variantStyles = {
      default: 'bg-gray-200 hover:bg-gray-300 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]',
      danger: 'bg-red-400 hover:bg-red-500 text-white hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]',
      minimal: 'bg-transparent hover:bg-gray-100 text-gray-700 border-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
    };
    
    const sizeStyles = {
      sm: 'px-3 py-1 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };
    
    return `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]}`;
  };

  return (
    <>
      <button
        type="button"
        onClick={handleLogoutClick}
        disabled={loading || isLoggingOut}
        className={`${getButtonStyles()} ${
          loading || isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        {loading || isLoggingOut ? (
          <div className="flex items-center space-x-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Signing Out...</span>
          </div>
        ) : (
          children || (
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </div>
          )
        )}
      </button>

      {/* Confirmation Dialog - Neo-Brutalism Style */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-yellow-400 border-4 border-black flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-black text-black mb-3">CONFIRM SIGN OUT</h3>
              <p className="text-gray-700 font-bold mb-8">
                Are you sure you want to sign out? You'll need to sign in again to access your account.
              </p>
              
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={cancelLogout}
                  className="flex-1 py-3 px-6 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all bg-white hover:bg-gray-50 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={performLogout}
                  disabled={isLoggingOut}
                  className={`flex-1 py-3 px-6 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
                    isLoggingOut
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-400 hover:bg-red-500 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
                  }`}
                >
                  {isLoggingOut ? 'SIGNING OUT...' : 'SIGN OUT'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Simplified logout button without confirmation
export function QuickLogoutButton({ 
  className = '',
  redirectTo = '/' 
}: { 
  className?: string;
  redirectTo?: string;
}) {
  return (
    <LogoutButton
      variant="minimal"
      size="sm"
      showConfirmation={false}
      redirectTo={redirectTo}
      className={className}
    />
  );
}

// Logout button with custom styling for navigation bars
export function NavLogoutButton({ 
  className = '' 
}: { 
  className?: string;
}) {
  return (
    <LogoutButton
      variant="minimal"
      size="sm"
      showConfirmation={true}
      className={className}
    >
      <span>Sign Out</span>
    </LogoutButton>
  );
}