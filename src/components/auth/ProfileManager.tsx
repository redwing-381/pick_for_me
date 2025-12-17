// User Profile Management Component
'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail, validatePassword, getPasswordStrength } from '../../lib/validation';
import { UserProfile } from '../../types/auth';

// Profile update form schema
const profileUpdateSchema = z.object({
  displayName: z.string()
    .optional()
    .refine((name) => !name || name.trim().length >= 2, 'Display name must be at least 2 characters'),
  email: z.string()
    .optional()
    .refine((email) => !email || validateEmail(email).isValid, 'Invalid email format'),
  currentPassword: z.string()
    .optional(),
  newPassword: z.string()
    .optional()
    .refine((password) => !password || validatePassword(password).isValid, 'Password does not meet requirements'),
  confirmNewPassword: z.string()
    .optional(),
}).refine((data) => {
  // If new password is provided, current password is required
  if (data.newPassword && !data.currentPassword) {
    return false;
  }
  // If new password is provided, confirmation must match
  if (data.newPassword && data.newPassword !== data.confirmNewPassword) {
    return false;
  }
  return true;
}, {
  message: "Password confirmation is required when changing password",
  path: ["confirmNewPassword"],
});

type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

interface ProfileManagerProps {
  user: UserProfile;
  onUpdate?: (user: UserProfile) => void;
  allowEmailChange?: boolean;
  allowPasswordChange?: boolean;
  className?: string;
}

export function ProfileManager({ 
  user,
  onUpdate,
  allowEmailChange = true,
  allowPasswordChange = true,
  className = '' 
}: ProfileManagerProps) {
  const { updateProfile, updateEmail, updatePassword, loading, error } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid, isDirty },
    setError,
    clearErrors,
    reset
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    mode: 'onChange',
    defaultValues: {
      displayName: user.displayName || '',
      email: user.email || '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    }
  });

  // Watch new password for strength indicator
  const watchedNewPassword = watch('newPassword');
  const passwordStrength = getPasswordStrength(watchedNewPassword || '');

  // Handle form submission
  const onSubmit = useCallback(async (data: ProfileUpdateFormData) => {
    try {
      setIsSubmitting(true);
      setUpdateSuccess(false);
      clearErrors();

      // Prepare update data
      const updateData: { displayName?: string; photoURL?: string } = {};
      
      if (data.displayName && data.displayName !== user.displayName) {
        updateData.displayName = data.displayName.trim();
      }

      // Update profile if there are changes
      if (Object.keys(updateData).length > 0) {
        await updateProfile(updateData);
      }

      // Handle email change
      if (data.email && data.email !== user.email && data.currentPassword) {
        await updateEmail(data.email, data.currentPassword);
      }

      // Handle password change
      if (data.newPassword && data.currentPassword) {
        await updatePassword(data.currentPassword, data.newPassword);
      }

      // Show success message if profile was updated
      if (Object.keys(updateData).length > 0) {
        setUpdateSuccess(true);
        
        // Call update callback if provided
        if (onUpdate) {
          // In a real implementation, we'd get the updated user from the auth context
          onUpdate(user);
        }

        // Reset password fields
        reset({
          displayName: data.displayName,
          email: data.email,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
      }

    } catch (error) {
      // Error is handled by the auth context, but we can set form-specific errors
      if (error instanceof Error) {
        if (error.message.includes('requires-recent-login')) {
          setError('currentPassword', {
            type: 'manual',
            message: 'Please sign out and sign back in before making this change.'
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [updateProfile, user, onUpdate, setError, clearErrors, reset]);

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

    if (!watchedNewPassword) return null;

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
      </div>
    );
  };

  return (
    <div className={`bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Management</h2>
          <p className="text-gray-600">
            Update your account information and security settings
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 border-4 border-black">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 px-4 font-bold transition-all ${
              activeTab === 'profile'
                ? 'bg-blue-400 text-black'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Profile Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 px-4 font-bold transition-all ${
              activeTab === 'security'
                ? 'bg-blue-400 text-black'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Security
          </button>
        </div>

        {/* Success Message */}
        {updateSuccess && (
          <div className="mb-4 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
            <p className="text-green-700 text-sm font-medium">Profile updated successfully!</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Profile Info Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Current Profile Display */}
              <div className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                <h3 className="font-bold text-gray-900 mb-3">Current Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Email:</span>
                    <p className="text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Display Name:</span>
                    <p className="text-gray-900">{user.displayName || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Email Verified:</span>
                    <p className={`font-medium ${user.emailVerified ? 'text-green-600' : 'text-red-600'}`}>
                      {user.emailVerified ? 'Yes' : 'No'}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Account Created:</span>
                    <p className="text-gray-900">{user.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Display Name Field */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-bold text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  {...register('displayName')}
                  type="text"
                  id="displayName"
                  className={`w-full px-4 py-3 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all ${
                    errors.displayName ? 'border-red-500 focus:ring-red-400' : ''
                  }`}
                  placeholder="Your display name"
                  disabled={loading || isSubmitting}
                />
                {errors.displayName && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.displayName.message}</p>
                )}
              </div>

              {/* Email Field */}
              {allowEmailChange && (
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
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600 font-medium">{errors.email.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Changing your email will require verification
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && allowPasswordChange && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <h3 className="font-bold text-blue-900 mb-2">Password Change</h3>
                <p className="text-sm text-blue-800">
                  To change your password, you must first enter your current password for security.
                </p>
              </div>

              {/* Current Password Field */}
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-bold text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    {...register('currentPassword')}
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    className={`w-full px-4 py-3 pr-12 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all ${
                      errors.currentPassword ? 'border-red-500 focus:ring-red-400' : ''
                    }`}
                    placeholder="Enter your current password"
                    disabled={loading || isSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={loading || isSubmitting}
                  >
                    {showCurrentPassword ? (
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
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password Field */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-bold text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    {...register('newPassword')}
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    className={`w-full px-4 py-3 pr-12 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all ${
                      errors.newPassword ? 'border-red-500 focus:ring-red-400' : ''
                    }`}
                    placeholder="Enter your new password"
                    disabled={loading || isSubmitting}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={loading || isSubmitting}
                  >
                    {showNewPassword ? (
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

              {/* Confirm New Password Field */}
              <div>
                <label htmlFor="confirmNewPassword" className="block text-sm font-bold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmNewPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmNewPassword"
                    className={`w-full px-4 py-3 pr-12 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400 transition-all ${
                      errors.confirmNewPassword ? 'border-red-500 focus:ring-red-400' : ''
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
                {errors.confirmNewPassword && (
                  <p className="mt-1 text-sm text-red-600 font-medium">{errors.confirmNewPassword.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isDirty || !isValid || loading || isSubmitting}
            className={`w-full py-3 px-4 font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all ${
              !isDirty || !isValid || loading || isSubmitting
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
                <span>Updating Profile...</span>
              </div>
            ) : (
              'Update Profile'
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm text-yellow-800 font-medium">Security Notice</p>
              <p className="text-xs text-yellow-700 mt-1">
                Email and password changes require additional verification for security. 
                You may be asked to re-authenticate before making sensitive changes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}