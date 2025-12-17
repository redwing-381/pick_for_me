'use client';

import React from 'react';
import { cn } from '../../lib/utils';
import { AuthError, AuthErrorCode } from '../../lib/errors';

export interface FormErrorProps {
  error?: AuthError | string | null;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  showRetry?: boolean;
  onRetry?: () => void;
}

export function FormError({ 
  error, 
  className, 
  showIcon = true, 
  variant = 'default',
  showRetry = false,
  onRetry
}: FormErrorProps) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' ? error : error.userMessage;
  const isAuthError = error instanceof AuthError;
  
  // Neo-brutalism styling for errors
  const baseStyles = 'text-black bg-red-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold';
  
  const variants = {
    default: 'p-4',
    compact: 'px-4 py-3',
    detailed: 'p-6',
  };

  const iconMap = {
    [AuthErrorCode.VALIDATION_ERROR]: '⚠️',
    [AuthErrorCode.FORM_VALIDATION_ERROR]: '📝',
    [AuthErrorCode.NETWORK_REQUEST_FAILED]: '🌐',
    [AuthErrorCode.INVALID_EMAIL]: '📧',
    [AuthErrorCode.WRONG_PASSWORD]: '🔒',
    [AuthErrorCode.USER_NOT_FOUND]: '👤',
    [AuthErrorCode.EMAIL_ALREADY_IN_USE]: '📧',
    [AuthErrorCode.WEAK_PASSWORD]: '🔒',
    [AuthErrorCode.TOO_MANY_REQUESTS]: '⏰',
    [AuthErrorCode.USER_DISABLED]: '🚫',
    [AuthErrorCode.SESSION_EXPIRED]: '⏰',
    [AuthErrorCode.PERMISSION_DENIED]: '🚫',
  };

  const getIcon = () => {
    if (!showIcon) return null;
    
    if (isAuthError && error.code) {
      const icon = iconMap[error.code as keyof typeof iconMap];
      if (icon) return icon;
    }
    
    return '❌'; // Default error icon
  };

  const getRecoveryAction = () => {
    if (!isAuthError || !error.code) return null;

    switch (error.code) {
      case AuthErrorCode.NETWORK_REQUEST_FAILED:
        return 'Check your internet connection and try again.';
      case AuthErrorCode.TOO_MANY_REQUESTS:
        return 'Please wait a few minutes before trying again.';
      case AuthErrorCode.INVALID_EMAIL:
      case AuthErrorCode.USER_NOT_FOUND:
        return 'Double-check your email address or create a new account.';
      case AuthErrorCode.WRONG_PASSWORD:
        return 'Try again or reset your password if you forgot it.';
      case AuthErrorCode.EMAIL_ALREADY_IN_USE:
        return 'Try signing in instead, or use a different email address.';
      case AuthErrorCode.WEAK_PASSWORD:
        return 'Use a stronger password with uppercase, lowercase, numbers, and symbols.';
      case AuthErrorCode.SESSION_EXPIRED:
        return 'Please sign in again to continue.';
      default:
        return null;
    }
  };

  const renderDefault = () => {
    const recoveryAction = getRecoveryAction();
    
    return (
      <div className={cn(baseStyles, variants[variant], className)}>
        <div className="flex items-start gap-3">
          {showIcon && (
            <span className="flex-shrink-0 text-lg">
              {getIcon()}
            </span>
          )}
          <div className="flex-1 space-y-2">
            <div className="font-black text-black">
              {errorMessage}
            </div>
            
            {recoveryAction && (
              <div className="text-sm font-bold text-black opacity-90">
                💡 {recoveryAction}
              </div>
            )}
            
            {showRetry && onRetry && isAuthError && error.retryable && (
              <button
                onClick={onRetry}
                className="mt-2 px-3 py-1 bg-white text-black border-2 border-black font-black text-sm hover:bg-gray-100 transition-colors"
              >
                TRY AGAIN
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderDetailed = () => {
    if (!isAuthError) {
      return renderDefault();
    }

    const recoveryAction = getRecoveryAction();

    return (
      <div className={cn(baseStyles, variants[variant], className)}>
        <div className="flex items-start gap-4">
          {showIcon && (
            <span className="flex-shrink-0 text-xl">
              {getIcon()}
            </span>
          )}
          <div className="flex-1 space-y-3">
            <div className="font-black text-black text-lg">
              {errorMessage}
            </div>
            
            {recoveryAction && (
              <div className="text-sm font-bold text-black bg-white border-2 border-black p-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                💡 <strong>WHAT TO DO:</strong> {recoveryAction}
              </div>
            )}
            
            {error.retryable && (
              <div className="text-sm font-bold text-black bg-yellow-400 border-2 border-black p-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                🔄 This error can be retried. Please try again.
              </div>
            )}

            {showRetry && onRetry && error.retryable && (
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-white text-black border-4 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
              >
                TRY AGAIN
              </button>
            )}
            
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs">
                <summary className="cursor-pointer text-black font-black">
                  🔧 DEBUG INFO
                </summary>
                <div className="mt-2 p-3 bg-white border-2 border-black font-mono text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <div><strong>Code:</strong> {error.code}</div>
                  <div><strong>Severity:</strong> {error.severity}</div>
                  <div><strong>Retryable:</strong> {error.retryable ? 'Yes' : 'No'}</div>
                  <div><strong>Technical:</strong> {error.technicalMessage}</div>
                  {error.context.component && (
                    <div><strong>Component:</strong> {error.context.component}</div>
                  )}
                  {error.context.action && (
                    <div><strong>Action:</strong> {error.context.action}</div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (variant === 'detailed') {
    return renderDetailed();
  }

  return renderDefault();
}

export interface FieldErrorProps {
  error?: string | null;
  className?: string;
}

export function FieldError({ error, className }: FieldErrorProps) {
  if (!error) return null;

  return (
    <div className={cn(
      'text-sm font-bold text-red-600 mt-2 flex items-center gap-2',
      className
    )}>
      <span className="text-red-500">⚠️</span>
      <span>{error}</span>
    </div>
  );
}

export interface FormErrorListProps {
  errors: Record<string, string>;
  className?: string;
  title?: string;
}

export function FormErrorList({ 
  errors, 
  className, 
  title = 'PLEASE CORRECT THE FOLLOWING ERRORS:' 
}: FormErrorListProps) {
  const errorEntries = Object.entries(errors).filter(([, message]) => message);
  
  if (errorEntries.length === 0) return null;

  return (
    <div className={cn(
      'text-black bg-red-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4',
      className
    )}>
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 text-xl">📝</span>
        <div className="flex-1">
          <div className="font-black mb-3 text-lg">{title}</div>
          <ul className="space-y-2">
            {errorEntries.map(([field, message]) => (
              <li key={field} className="text-sm font-bold flex items-start gap-2">
                <span className="text-black mt-0.5">•</span>
                <div>
                  <strong className="uppercase">{field}:</strong> {message}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}