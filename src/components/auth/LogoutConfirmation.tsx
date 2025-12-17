// Logout Confirmation Dialog Component
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

interface LogoutConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  redirectTo?: string;
  title?: string;
  message?: string;
  showUserInfo?: boolean;
}

export function LogoutConfirmation({
  isOpen,
  onClose,
  onConfirm,
  redirectTo = '/',
  title = 'Confirm Sign Out',
  message = 'Are you sure you want to sign out? You\'ll need to sign in again to access your account.',
  showUserInfo = true
}: LogoutConfirmationProps) {
  const { logout, loading, user } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleConfirm = useCallback(async () => {
    try {
      setIsLoggingOut(true);
      
      await logout();
      
      onConfirm?.();
      onClose();
      
      // Redirect after logout
      router.push(redirectTo);
      
    } catch (error) {
      console.error('Logout failed:', error);
      
      // Even if logout fails, close dialog and redirect for security
      onClose();
      router.push(redirectTo);
    } finally {
      setIsLoggingOut(false);
    }
  }, [logout, onConfirm, onClose, router, redirectTo]);

  const handleCancel = useCallback(() => {
    if (!isLoggingOut) {
      onClose();
    }
  }, [onClose, isLoggingOut]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-yellow-100 border-4 border-black rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          
          {showUserInfo && user && (
            <div className="p-3 bg-gray-50 border-2 border-gray-200 rounded-lg mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Signing out:</span> {user.displayName || user.email}
              </p>
              {user.emailVerified && (
                <div className="flex items-center justify-center space-x-1 mt-1">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-xs text-green-600">Verified</span>
                </div>
              )}
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isLoggingOut}
              className={`flex-1 py-3 px-4 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
                isLoggingOut
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || isLoggingOut}
              className={`flex-1 py-3 px-4 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
                loading || isLoggingOut
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-400 hover:bg-red-500 text-white hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
              }`}
            >
              {loading || isLoggingOut ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing Out...</span>
                </div>
              ) : (
                'Sign Out'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for managing logout confirmation dialog
export function useLogoutConfirmation(redirectTo?: string) {
  const [isOpen, setIsOpen] = useState(false);

  const openConfirmation = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeConfirmation = useCallback(() => {
    setIsOpen(false);
  }, []);

  const LogoutConfirmationDialog = useCallback((props: Partial<LogoutConfirmationProps>) => (
    <LogoutConfirmation
      isOpen={isOpen}
      onClose={closeConfirmation}
      redirectTo={redirectTo}
      {...props}
    />
  ), [isOpen, closeConfirmation, redirectTo]);

  return {
    isOpen,
    openConfirmation,
    closeConfirmation,
    LogoutConfirmationDialog,
  };
}