// Email/Password Login Form Component
'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../lib/validation';
import { FormError } from '../ui/FormError';

// Login form schema with Zod validation
const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .refine((email: string) => validateEmail(email).isValid, {
      message: 'Invalid email format'
    }),
  password: z.string()
    .min(1, 'Password is required'),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  showGoogleAuth?: boolean;
  className?: string;
}

export function LoginForm({ 
  onSuccess, 
  redirectTo, 
  showGoogleAuth = true,
  className = '' 
}: LoginFormProps) {
  const { login, loginWithGoogle, loading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isValid },
    setError,
    clearErrors
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  // Handle form submission
  const onSubmit = useCallback(async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      clearErrors();

      await login(data.email, data.password, data.rememberMe || false);
      
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
        if (error.message.includes('user-not-found') || error.message.includes('wrong-password') || error.message.includes('invalid-credential')) {
          setError('email', { 
            type: 'manual', 
            message: 'Invalid email or password' 
          });
          setError('password', { 
            type: 'manual', 
            message: 'Invalid email or password' 
          });
        } else if (error.message.includes('user-disabled')) {
          setError('email', { 
            type: 'manual', 
            message: 'This account has been disabled' 
          });
        } else if (error.message.includes('too-many-requests')) {
          setError('email', { 
            type: 'manual', 
            message: 'Too many failed attempts. Please try again later.' 
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [login, onSuccess, redirectTo, setError, clearErrors]);

  // Handle Google OAuth login
  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsSubmitting(true);
      clearErrors();

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
      // Error is handled by the auth context
      console.error('Google login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [loginWithGoogle, onSuccess, redirectTo, clearErrors]);

  return (
    <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-3xl font-black text-black mb-2">WELCOME BACK</h2>
          <p className="text-gray-700 font-bold">Sign in to your Pick For Me account</p>
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
              if (formData.email && formData.password) {
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
              EMAIL ADDRESS
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
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-black text-black mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className={`w-full px-4 py-3 pr-12 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all ${
                  errors.password ? 'border-red-500 focus:ring-red-400' : ''
                }`}
                placeholder="Enter your password"
                disabled={loading || isSubmitting}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                disabled={loading || isSubmitting}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
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
          </div>

          {/* Remember Me and Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <input
                {...register('rememberMe')}
                type="checkbox"
                id="rememberMe"
                className="w-4 h-4 text-blue-600 border-2 border-black focus:ring-2 focus:ring-yellow-400"
                disabled={loading || isSubmitting}
              />
              <label htmlFor="rememberMe" className="text-sm text-black font-bold">
                Remember me
              </label>
            </div>
            
            <a 
              href="/reset-password" 
              className="text-sm text-blue-600 hover:text-blue-800 font-black underline"
            >
              FORGOT PASSWORD?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isValid || loading || isSubmitting}
            className={`w-full py-3 px-4 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
              !isValid || loading || isSubmitting
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
                <span>SIGNING IN...</span>
              </div>
            ) : (
              'SIGN IN'
            )}
          </button>
        </form>

        {/* Google OAuth Button */}
        {showGoogleAuth && (
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-black font-black">OR CONTINUE WITH</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading || isSubmitting}
              className={`mt-4 w-full py-3 px-4 font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
                loading || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px]'
              }`}
            >
              {loading || isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing In...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>CONTINUE WITH GOOGLE</span>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Registration Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-black font-bold">
            Don't have an account?{' '}
            <a href="/register" className="text-blue-600 hover:text-blue-800 font-black underline">
              CREATE ONE HERE
            </a>
          </p>
        </div>

        {/* Security Notice */}
        <div className="mt-4 p-4 bg-blue-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-black mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm text-black font-black">SECURE LOGIN</p>
              <p className="text-xs text-black font-bold mt-1">
                Your login is protected with industry-standard encryption and security measures.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}