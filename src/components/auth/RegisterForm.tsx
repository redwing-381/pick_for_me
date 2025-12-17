// User Registration Form Component with validation
'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, getPasswordStrength } from '../../lib/validation';
import { FormError } from '../ui/FormError';

// Registration form schema with Zod validation
const registerSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine((email: string) => validateEmail(email).isValid, {
      message: 'Invalid email format'
    }),
  password: z.string()
    .min(1, 'Password is required')
    .refine((password: string) => validatePassword(password).isValid, {
      message: 'Password does not meet requirements'
    }),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
  displayName: z.string()
    .optional()
    .refine((name) => !name || name.trim().length >= 2, 'Display name must be at least 2 characters'),
  acceptTerms: z.boolean()
    .refine((accepted) => accepted, 'You must accept the terms and conditions')
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  requireEmailVerification?: boolean;
  className?: string;
}

export function RegisterForm({ 
  onSuccess, 
  redirectTo, 
  requireEmailVerification = true,
  className = '' 
}: RegisterFormProps) {
  const { register: registerUser, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    formState: { errors, isValid, touchedFields },
    setError,
    clearErrors
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      acceptTerms: false
    }
  });

  // Watch password for strength indicator
  const watchedPassword = watch('password');
  const passwordStrength = getPasswordStrength(watchedPassword || '');

  // Handle form submission
  const onSubmit = useCallback(async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      clearErrors();

      await registerUser(data.email, data.password, data.displayName || undefined);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Handle redirect if specified
      if (redirectTo) {
        window.location.href = redirectTo;
      }

    } catch (error) {
      // Error is handled by the auth context, but we can set form-specific errors
      if (error instanceof Error) {
        if (error.message.includes('email-already-in-use')) {
          setError('email', { 
            type: 'manual', 
            message: 'An account with this email already exists' 
          });
        } else if (error.message.includes('weak-password')) {
          setError('password', { 
            type: 'manual', 
            message: 'Password is too weak. Please choose a stronger password.' 
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [registerUser, onSuccess, redirectTo, setError, clearErrors]);

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

  return (
    <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-black text-black mb-2">CREATE ACCOUNT</h2>
          <p className="text-gray-700 font-bold">Join Pick For Me and let AI make your decisions</p>
        </div>

        {error && (
          <FormError 
            error={error} 
            variant="detailed" 
            showRetry={true}
            onRetry={() => {
              clearErrors();
              // Retry the last attempted action
              const formData = getValues();
              if (formData.email && formData.password && formData.acceptTerms) {
                handleSubmit(onSubmit)();
              }
            }}
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-black text-black mb-2">
              EMAIL ADDRESS *
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
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Display Name Field */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-black text-black mb-2">
              DISPLAY NAME (OPTIONAL)
            </label>
            <input
              {...register('displayName')}
              type="text"
              id="displayName"
              className={`w-full px-4 py-3 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all ${
                errors.displayName ? 'border-red-500 focus:ring-red-400' : ''
              }`}
              placeholder="Your Name"
              disabled={loading || isSubmitting}
            />
            {errors.displayName && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.displayName.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-black text-black mb-2">
              PASSWORD *
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`w-full px-4 py-3 pr-12 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all ${
                  errors.password ? 'border-red-500 focus:ring-red-400' : ''
                }`}
                placeholder="Create a strong password"
                disabled={loading || isSubmitting}
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
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.password.message}</p>
            )}
            
            {/* Password Strength Indicator */}
            <PasswordStrengthIndicator strength={passwordStrength} />
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-black text-black mb-2">
              CONFIRM PASSWORD *
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className={`w-full px-4 py-3 pr-12 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all ${
                  errors.confirmPassword ? 'border-red-500 focus:ring-red-400' : ''
                }`}
                placeholder="Confirm your password"
                disabled={loading || isSubmitting}
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

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <input
              {...register('acceptTerms')}
              type="checkbox"
              id="acceptTerms"
              className="mt-1 w-4 h-4 text-blue-600 border-2 border-black rounded focus:ring-2 focus:ring-yellow-400"
              disabled={loading || isSubmitting}
            />
            <label htmlFor="acceptTerms" className="text-sm text-black font-bold">
              I accept the{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-800 font-black underline">
                TERMS AND CONDITIONS
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-800 font-black underline">
                PRIVACY POLICY
              </a>
            </label>
          </div>
          {errors.acceptTerms && (
            <p className="text-sm text-red-600 font-medium">{errors.acceptTerms.message}</p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || loading || isSubmitting}
            className={`w-full py-3 px-4 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
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
                <span>CREATING ACCOUNT...</span>
              </div>
            ) : (
              'CREATE ACCOUNT'
            )}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-black font-bold">
            Already have an account?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-black underline">
              SIGN IN HERE
            </a>
          </p>
        </div>

        {/* Email Verification Notice */}
        {requireEmailVerification && (
          <div className="mt-4 p-4 bg-blue-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-black mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-black font-black">EMAIL VERIFICATION REQUIRED</p>
                <p className="text-xs text-black font-bold mt-1">
                  After registration, please check your email and click the verification link to activate your account.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}