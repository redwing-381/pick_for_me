'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Progress } from './progress';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'primary' | 'white';
  className?: string;
  label?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'default',
  className,
  label = 'Loading...'
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const variants = {
    default: 'border-black border-t-transparent',
    primary: 'border-yellow-400 border-t-transparent',
    white: 'border-white border-t-transparent',
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div
        className={cn(
          'border-4 rounded-full animate-spin',
          sizes[size],
          variants[variant]
        )}
        role="status"
        aria-label={label}
      />
      {label && (
        <span className="text-sm font-bold text-black">
          {label}
        </span>
      )}
    </div>
  );
};

export interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  spinnerProps?: Omit<LoadingSpinnerProps, 'className'>;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  className,
  spinnerProps = {}
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center border-4 border-black">
          <LoadingSpinner {...spinnerProps} />
        </div>
      )}
    </div>
  );
};

export interface LoadingCardProps extends LoadingSpinnerProps {
  title?: string;
  description?: string;
}

const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Loading',
  description = 'Please wait while we process your request...',
  size = 'lg',
  variant = 'default',
  className
}) => {
  const [progress, setProgress] = useState(13);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 13; // Reset to start
        return prev + Math.random() * 15;
      });
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={cn(
      'bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 text-center max-w-md mx-auto',
      className
    )}>
      <div className="w-16 h-16 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-4 flex items-center justify-center animate-bounce">
        <span className="text-black font-black text-2xl">🤖</span>
      </div>
      <h3 className="text-xl font-bold text-black mt-4 mb-4">
        {title}
      </h3>
      <Progress value={progress} className="w-full mb-4" />
      <p className="text-gray-600 font-medium">
        {description}
      </p>
    </div>
  );
};

export { LoadingSpinner, LoadingOverlay, LoadingCard };