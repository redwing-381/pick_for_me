// Password Reset Confirmation Component for handling reset links
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { validatePassword, getPasswordStrength } from '../../lib/validation';

// Password reset confirmation schema
const passwordResetConfirmSchema = z.object({
  newPassword: z.string()
    .min(1, 'Password is required')
    .refine((password: string) => validatePassword(password).isValid, {
      message: 'Password does not meet requirements'
    }),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordResetConfirmFormData = z.infer<typeof passwordResetConfirmSchema>;

interface PasswordResetConfirmProps {
  code: string; // Reset code from URL
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
}

export function PasswordResetConfirm({ 
  code,
  onSuccess, 
  onError,
  className = '' 
}: PasswordResetConfirmProps) {
  const { verifyPasswordResetCode, confirmPasswordReset, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState<string>('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    setError,
    clearErrors
  } = useForm<PasswordResetConfirmFormData>({
    resolver: zodResolver(passwordResetConfirmSchema),
    mode: 'onChange',
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  // Watch password for strength indicator
  const watchedPassword = watch('newPassword');
  const passwordStrength = getPasswordStrength(watchedPassword || '');

  // Verify the reset code on component mount
  useEffect(() => {
    const verifyCode = async () => {
      try {
        const verifiedEmail = await verifyPasswordResetCode(code);
        setEmail(verifiedEmail);
        setCodeVerified(true);
      } catch (error) {
        console.error('Failed to verify reset code:', error);
        if (onError) {
          onError('Invalid or expired password reset link.');
        }
      }
    };

    if (code) {
      verifyCode();
    }
  }, [code, verifyPasswordResetCode, onError]);

  // Handle form submission
  const onSubmit = useCallback(async (data: PasswordResetConfirmFormData) => {
    try {
      setIsSubmitting(true);
      clearErrors();

      await confirmPasswordReset(code, data.newPassword);
      
      setResetComplete(true);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      // Error is handled by the auth context, but we can set form-specific errors
      if (error instanceof Error) {
        if (error.message.includes('weak-password')) {
          setError('newPassword', { 
            type: 'manual', 
            message: 'Password is too weak. Please choose a stronger password.' 
          });
        } else if (error.message.includes('expired-action-code')) {
          if (onError) {
            onError('This password reset link has expired. Please request a new one.');
          }
        } else if (error.message.includes('invalid-action-code')) {
          if (onError) {
            onError('This password reset link is invalid or has already been used.');
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [confirmPasswordReset, code, onSuccess, onError, setError, clearErrors]);

  // Password strength indicator component
  const PasswordStrengthIndicator = ({ strength }: { strength: ReturnType<typeof getPasswordStrength> }) => {
    const getStrengthColor = () => {
      switch (strength.score) {
        case 0:
        case 1:
          return 'bg-red-500';
        case 2:
          return 'bg-yellow-500';
        case 3:
          return 'bg-blue-500';
        case 4:
          return 'bg-green-500';
        default:
          return 'bg-gray-300';
      }
    };

    const getStrengthText = () => {
      switch (strength.score) {
        case 0:
          return 'Very Weak';
        case 1:
          return 'Weak';
        case 2:
          return 'Fair';
        case 3:
          return 'Good';
        case 4:
          return 'Strong';
        default:
          return '';
      }
    };

    if (!watchedPassword) return null;

    return (
      <div className="mt-2">
        <div className="flex items-center space-x-2 mb-1">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`}
              style={{ width: `${(strength.score + 1) * 20}%` }}
            />
          </div>
          <span className={`text-xs font-medium ${
            strength.score >= 3 ? 'text-green-600' : 
            strength.score >= 2 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {getStrengthText()}
          </span>
        </div>
        
        {strength.suggestions.length > 0 && (
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">Suggestions:</p>
            <ul className="space-y-1">
              {strength.suggestions.slice(0, 2).map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-500 mr-1">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Loading state while verifying code
  if (!codeVerified && !error) {
    return (
      <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
        <div className="p-6">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying Reset Link</h2>
            <p className="text-gray-600">Please wait while we verify your password reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // Success state - password reset complete
  if (resetComplete) {
    return (
      <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 border-4 border-black rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Complete</h2>
            <p className="text-gray-600">
              Your password has been successfully reset. For security, you have been signed out of all devices.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-sm text-green-800 font-medium">Security Notice</p>
                  <p className="text-xs text-green-700 mt-1">
                    All existing sessions have been invalidated for your security. Please sign in with your new password.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => window.location.href = '/login'}
              className="w-full py-3 px-4 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all bg-blue-400 hover:bg-blue-500 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]"
            >
              Sign In with New Password
            </button>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h2>
          <p className="text-gray-600">
            Create a new password for{' '}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* New Password Field */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showPassword ? 'text' : 'password'}
                id="newPassword"
                className={`w-full px-4 py-3 pr-12 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all ${
                  errors.newPassword ? 'border-red-500 focus:ring-red-400' : ''
                }`}
                placeholder="Create a strong password"
                disabled={loading || isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={loading || isSubmitting}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.newPassword.message}</p>
            )}
            
            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator strength={passwordStrength} />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className={`w-full px-4 py-3 pr-12 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all ${
                  errors.confirmPassword ? 'border-red-500 focus:ring-red-400' : ''
                }`}
                placeholder="Confirm your new password"
                disabled={loading || isSubmitting}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={loading || isSubmitting}
              >
                {showConfirmPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || loading || isSubmitting}
            className={`w-full py-3 px-4 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
              !isValid || loading || isSubmitting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-400 hover:bg-green-500 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
            }`}
          >
            {loading || isSubmitting ? (
              <div className="flex items-center justify-center space-x-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Updating Password...</span>
              </div>
            ) : (
              'Update Password'
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm text-blue-800 font-medium">Security Notice</p>
              <p className="text-xs text-blue-700 mt-1">
                After updating your password, all existing sessions will be invalidated for your security. 
                You'll need to sign in again with your new password.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}