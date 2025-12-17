// Password Reset Component with email input and confirmation
'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../lib/validation';

// Password reset form schema
const passwordResetSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine((email: string) => validateEmail(email).isValid, {
      message: 'Invalid email format'
    }),
});

type PasswordResetFormData = z.infer<typeof passwordResetSchema>;

interface PasswordResetProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function PasswordReset({ 
  onSuccess, 
  onCancel,
  className = '' 
}: PasswordResetProps) {
  const { resetPassword, loading, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setError,
    clearErrors,
    getValues
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(passwordResetSchema),
    mode: 'onChange',
    defaultValues: {
      email: ''
    }
  });

  // Handle form submission
  const onSubmit = useCallback(async (data: PasswordResetFormData) => {
    try {
      setIsSubmitting(true);
      clearErrors();

      await resetPassword(data.email);
      
      // Show success state
      setEmailSent(true);
      setSentEmail(data.email);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      // Error is handled by the auth context, but we can set form-specific errors
      if (error instanceof Error) {
        if (error.message.includes('user-not-found')) {
          setError('email', { 
            type: 'manual', 
            message: 'No account found with this email address' 
          });
        } else if (error.message.includes('invalid-email')) {
          setError('email', { 
            type: 'manual', 
            message: 'Please enter a valid email address' 
          });
        } else if (error.message.includes('too-many-requests')) {
          setError('email', { 
            type: 'manual', 
            message: 'Too many reset attempts. Please try again later.' 
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [resetPassword, onSuccess, setError, clearErrors]);

  // Handle resend email
  const handleResendEmail = useCallback(async () => {
    if (sentEmail) {
      try {
        setIsSubmitting(true);
        await resetPassword(sentEmail);
      } catch (error) {
        console.error('Failed to resend reset email:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [resetPassword, sentEmail]);

  // Handle back to login
  const handleBackToLogin = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      // Default behavior - could navigate to login page
      window.location.href = '/login';
    }
  }, [onCancel]);

  // Success state - email sent confirmation
  if (emailSent) {
    return (
      <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 border-4 border-black rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check Your Email</h2>
            <p className="text-gray-600">
              We've sent a password reset link to{' '}
              <span className="font-medium text-gray-900">{sentEmail}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-blue-800 font-medium">Next Steps:</p>
                  <ul className="text-xs text-blue-700 mt-1 space-y-1">
                    <li>• Check your email inbox for the reset link</li>
                    <li>• Click the link to create a new password</li>
                    <li>• The link will expire in 1 hour for security</li>
                    <li>• Check your spam folder if you don't see the email</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={loading || isSubmitting}
                className={`w-full py-3 px-4 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
                  loading || isSubmitting
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
                    <span>Sending...</span>
                  </div>
                ) : (
                  'Resend Email'
                )}
              </button>

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full py-3 px-4 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all bg-white hover:bg-gray-50 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
              >
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main form state
  return (
    <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              {...register('email')}
              type="email"
              id="email"
              className={`w-full px-4 py-3 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all ${
                errors.email ? 'border-red-500 focus:ring-red-400' : ''
              }`}
              placeholder="your@email.com"
              disabled={loading || isSubmitting}
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || loading || isSubmitting}
            className={`w-full py-3 px-4 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
              !isValid || loading || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-400 hover:bg-blue-500 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
            }`}
          >
            {loading || isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Sending Reset Link...</span>
              </div>
            ) : (
              'Send Reset Link'
            )}
          </button>

          {/* Cancel/Back Button */}
          <button
            type="button"
            onClick={handleBackToLogin}
            className="w-full py-3 px-4 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all bg-white hover:bg-gray-50 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
          >
            Back to Login
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <div>
              <p className="text-sm text-green-800 font-medium">Secure Reset Process</p>
              <p className="text-xs text-green-700 mt-1">
                For your security, password reset links expire after 1 hour and can only be used once. 
                If you don't receive an email, check your spam folder or try again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}