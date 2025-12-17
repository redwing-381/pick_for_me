'use client';

import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  variant?: 'default' | 'error' | 'success';
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, variant = 'default', type = 'text', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const baseStyles = 'w-full px-4 py-3 text-base font-medium bg-white border-4 border-black focus:outline-none transition-all duration-200';

    const variants = {
      default: 'focus:ring-4 focus:ring-yellow-400 focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
      error: 'border-red-500 focus:ring-4 focus:ring-red-400 focus:shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]',
      success: 'border-green-500 focus:ring-4 focus:ring-green-400 focus:shadow-[4px_4px_0px_0px_rgba(34,197,94,1)]',
    };

    const currentVariant = error ? 'error' : variant;

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-bold text-black">
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          className={cn(
            baseStyles,
            variants[currentVariant],
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-sm font-medium text-red-600 bg-red-50 border-2 border-red-200 px-3 py-2">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-600 font-medium">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };