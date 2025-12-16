'use client';

import React from 'react';

// =============================================================================
// LOADING COMPONENT TYPES
// =============================================================================

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'blue' | 'gray' | 'white';
  className?: string;
}

interface LoadingSkeletonProps {
  variant?: 'text' | 'rectangle' | 'circle' | 'restaurant-card';
  width?: string;
  height?: string;
  className?: string;
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  children?: React.ReactNode;
}

// =============================================================================
// LOADING SPINNER
// =============================================================================

export function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    white: 'text-white'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} ${className}`}>
      <svg className="animate-spin" fill="none" viewBox="0 0 24 24">
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

export function LoadingSkeleton({ 
  variant = 'rectangle', 
  width = 'w-full', 
  height = 'h-4', 
  className = '' 
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  if (variant === 'text') {
    return <div className={`${baseClasses} h-4 ${width} ${className}`} />;
  }
  
  if (variant === 'circle') {
    return <div className={`${baseClasses} rounded-full ${width} ${height} ${className}`} />;
  }
  
  if (variant === 'restaurant-card') {
    return (
      <div className={`bg-white rounded-lg shadow-md border p-4 ${className}`}>
        <div className="animate-pulse">
          {/* Image skeleton */}
          <div className="w-full h-32 bg-gray-200 rounded mb-4" />
          
          {/* Title skeleton */}
          <div className="h-6 bg-gray-200 rounded mb-2" />
          
          {/* Rating and price skeleton */}
          <div className="flex items-center space-x-4 mb-2">
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-12 bg-gray-200 rounded" />
          </div>
          
          {/* Category skeleton */}
          <div className="h-4 w-32 bg-gray-200 rounded mb-4" />
          
          {/* Buttons skeleton */}
          <div className="flex space-x-2">
            <div className="h-8 w-20 bg-gray-200 rounded" />
            <div className="h-8 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }
  
  return <div className={`${baseClasses} ${width} ${height} ${className}`} />;
}

// =============================================================================
// LOADING OVERLAY
// =============================================================================

export function LoadingOverlay({ 
  isVisible, 
  message = 'Loading...', 
  children 
}: LoadingOverlayProps) {
  if (!isVisible) return <>{children}</>;
  
  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50 rounded-lg">
        <div className="flex flex-col items-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-gray-600 font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// TYPING INDICATOR
// =============================================================================

export function TypingIndicator({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
      <span className="text-sm text-gray-500 ml-2">AI is thinking...</span>
    </div>
  );
}

// =============================================================================
// PROGRESS BAR
// =============================================================================

interface ProgressBarProps {
  progress: number; // 0-100
  color?: 'blue' | 'green' | 'yellow' | 'red';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ 
  progress, 
  color = 'blue', 
  size = 'md', 
  showLabel = false,
  className = '' 
}: ProgressBarProps) {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600'
  };

  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(clampedProgress)}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]}`}>
        <div 
          className={`${colorClasses[color]} ${sizeClasses[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// PULSE ANIMATION
// =============================================================================

export function PulseAnimation({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {children}
    </div>
  );
}