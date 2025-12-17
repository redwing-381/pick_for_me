// Email Verification Component
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile } from '../../types/auth';

interface EmailVerificationProps {
  user: UserProfile;
  onVerificationComplete?: () => void;
  showAsModal?: boolean;
  className?: string;
}

export function EmailVerification({ 
  user,
  onVerificationComplete,
  showAsModal = false,
  className = '' 
}: EmailVerificationProps) {
  const { sendEmailVerification, loading, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);

  // Cooldown timer (60 seconds between resend attempts)
  useEffect(() => {
    if (lastSentTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const timeDiff = 60 - Math.floor((now.getTime() - lastSentTime.getTime()) / 1000);
        
        if (timeDiff <= 0) {
          setCooldownRemaining(0);
          clearInterval(interval);
        } else {
          setCooldownRemaining(timeDiff);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lastSentTime]);

  // Handle sending verification email
  const handleSendVerification = useCallback(async () => {
    try {
      setIsSubmitting(true);
      
      await sendEmailVerification();
      
      setEmailSent(true);
      setLastSentTime(new Date());
      setCooldownRemaining(60);
      
    } catch (error) {
      console.error('Failed to send verification email:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [sendEmailVerification]);

  // Handle manual refresh to check verification status
  const handleRefreshStatus = useCallback(() => {
    // In a real implementation, this would trigger a user reload
    // For now, we'll just show a message
    window.location.reload();
  }, []);

  // If user is already verified, show success state
  if (user.emailVerified) {
    return (
      <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
        <div className="p-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-black mb-2">EMAIL VERIFIED!</h2>
            <p className="text-gray-700 font-bold mb-4">
              Your email address <span className="font-black text-black">{user.email}</span> has been successfully verified.
            </p>
            
            {onVerificationComplete && (
              <button
                type="button"
                onClick={onVerificationComplete}
                className="py-3 px-6 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all bg-green-400 hover:bg-green-500 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
              >
                CONTINUE
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main verification prompt
  return (
    <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      <div className="p-6">
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-black mb-2">VERIFY YOUR EMAIL</h2>
          <p className="text-gray-700 font-bold">
            Please verify your email address to access all features
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-black text-sm font-black">{error}</p>
          </div>
        )}

        {emailSent && (
          <div className="mb-4 p-4 bg-green-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-black text-sm font-black">
              VERIFICATION EMAIL SENT TO {user.email}! Please check your inbox.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 bg-blue-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-black mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-black font-black">EMAIL: {user.email}</p>
                <p className="text-xs text-black font-bold mt-1">
                  We'll send a verification link to this address. Click the link to verify your email.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="button"
              onClick={handleSendVerification}
              disabled={loading || isSubmitting || cooldownRemaining > 0}
              className={`w-full py-3 px-4 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
                loading || isSubmitting || cooldownRemaining > 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
              }`}
            >
              {loading || isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>SENDING...</span>
                </div>
              ) : cooldownRemaining > 0 ? (
                `RESEND IN ${cooldownRemaining}S`
              ) : emailSent ? (
                'RESEND VERIFICATION EMAIL'
              ) : (
                'SEND VERIFICATION EMAIL'
              )}
            </button>

            <button
              type="button"
              onClick={handleRefreshStatus}
              className="w-full py-3 px-4 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all bg-white hover:bg-gray-50 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              I'VE VERIFIED MY EMAIL
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-black font-bold">
              Already verified?{' '}
              <button
                type="button"
                onClick={handleRefreshStatus}
                className="text-blue-600 hover:text-blue-800 font-black underline"
              >
                REFRESH PAGE
              </button>
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-black mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm text-black font-black">INSTRUCTIONS:</p>
              <ul className="text-xs text-black font-bold mt-1 space-y-1">
                <li>• Check your email inbox for the verification link</li>
                <li>• Click the link to verify your email address</li>
                <li>• Return to this page and click "I've Verified My Email"</li>
                <li>• Check your spam folder if you don't see the email</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact verification banner for use in other components
export function EmailVerificationBanner({ 
  user, 
  onDismiss,
  className = '' 
}: { 
  user: UserProfile; 
  onDismiss?: () => void;
  className?: string;
}) {
  const { sendEmailVerification, loading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendVerification = useCallback(async () => {
    try {
      setIsSubmitting(true);
      await sendEmailVerification();
    } catch (error) {
      console.error('Failed to send verification email:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [sendEmailVerification]);

  if (user.emailVerified) {
    return null;
  }

  return (
    <div className={`bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-black text-black">EMAIL VERIFICATION REQUIRED</p>
            <p className="text-xs text-black font-bold">Please verify your email to access all features</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleSendVerification}
            disabled={loading || isSubmitting}
            className={`px-3 py-1 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-0.5 active:translate-y-0.5 transition-all ${
              loading || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-white hover:bg-gray-50 text-black'
            }`}
          >
            {loading || isSubmitting ? 'SENDING...' : 'SEND EMAIL'}
          </button>
          
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="text-black hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}