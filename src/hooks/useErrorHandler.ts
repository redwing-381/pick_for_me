'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  AppError, 
  ErrorRecoveryOptions, 
  ErrorContext,
  AppErrorHandler,
  createErrorContext,
  getErrorCode
} from '@/lib/error-handling';

// =============================================================================
// ERROR HANDLER HOOK
// =============================================================================

export interface UseErrorHandlerOptions {
  component: string;
  onError?: (error: AppError) => void;
  enableNetworkMonitoring?: boolean;
}

export interface UseErrorHandlerReturn {
  error: AppError | null;
  isOnline: boolean;
  isLoading: boolean;
  handleError: (error: unknown, action: string, additionalData?: Record<string, unknown>) => AppError;
  handleAsyncAction: <T>(
    asyncFn: () => Promise<T>,
    action: string,
    recoveryOptions?: ErrorRecoveryOptions,
    additionalData?: Record<string, unknown>
  ) => Promise<T | null>;
  clearError: () => void;
  retry: () => Promise<void>;
  errorLog: AppError[];
}

export function useErrorHandler(options: UseErrorHandlerOptions): UseErrorHandlerReturn {
  const [error, setError] = useState<AppError | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<(() => Promise<void>) | null>(null);

  const errorHandler = AppErrorHandler.getInstance();

  // Initialize network monitoring
  useEffect(() => {
    if (options.enableNetworkMonitoring !== false) {
      setIsOnline(errorHandler.getNetworkStatus());
      
      const unsubscribe = errorHandler.onNetworkChange((online) => {
        setIsOnline(online);
        if (online && error && error.code === 'NETWORK_ERROR') {
          // Clear network errors when coming back online
          setError(null);
        }
      });

      return unsubscribe;
    }
  }, [options.enableNetworkMonitoring, error]);

  // Handle error creation
  const handleError = useCallback((
    originalError: unknown,
    action: string,
    additionalData?: Record<string, unknown>
  ): AppError => {
    const context = createErrorContext(options.component, action, additionalData);
    const errorCode = getErrorCode(originalError);
    const appError = errorHandler.createError(errorCode, originalError, context);
    
    setError(appError);
    options.onError?.(appError);
    
    return appError;
  }, [options.component, options.onError]);

  // Handle async actions with error recovery
  const handleAsyncAction = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    action: string,
    recoveryOptions?: ErrorRecoveryOptions,
    additionalData?: Record<string, unknown>
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    // Store the action for potential retry
    setLastAction(() => async () => {
      await asyncFn();
    });

    try {
      const result = await asyncFn();
      setIsLoading(false);
      return result;
    } catch (originalError) {
      setIsLoading(false);
      
      const context = createErrorContext(options.component, action, additionalData);
      const errorCode = getErrorCode(originalError);
      const appError = errorHandler.createError(errorCode, originalError, context);
      
      if (recoveryOptions) {
        try {
          await errorHandler.handleErrorWithRecovery(appError, recoveryOptions);
          return null; // Recovery handled the error
        } catch (recoveryError) {
          // Recovery failed, show the original error
          setError(appError);
          options.onError?.(appError);
          return null;
        }
      } else {
        setError(appError);
        options.onError?.(appError);
        return null;
      }
    }
  }, [options.component, options.onError]);

  // Clear current error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Retry last action
  const retry = useCallback(async () => {
    if (lastAction && error?.retryable) {
      setError(null);
      setIsLoading(true);
      
      try {
        await lastAction();
        setIsLoading(false);
      } catch (retryError) {
        setIsLoading(false);
        const context = createErrorContext(options.component, 'retry');
        const errorCode = getErrorCode(retryError);
        const appError = errorHandler.createError(errorCode, retryError, context);
        setError(appError);
        options.onError?.(appError);
      }
    }
  }, [lastAction, error, options.component, options.onError]);

  return {
    error,
    isOnline,
    isLoading,
    handleError,
    handleAsyncAction,
    clearError,
    retry,
    errorLog: errorHandler.getErrorLog()
  };
}

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

export function useAPIErrorHandler(component: string) {
  return useErrorHandler({
    component,
    enableNetworkMonitoring: true,
    onError: (error) => {
      // Log API errors for monitoring
      if (error.code === 'API_ERROR' || error.code === 'RATE_LIMIT_ERROR') {
        console.warn(`API Error in ${component}:`, error);
      }
    }
  });
}

export function useLocationErrorHandler(component: string) {
  return useErrorHandler({
    component,
    enableNetworkMonitoring: false,
    onError: (error) => {
      if (error.code === 'LOCATION_ERROR') {
        console.warn(`Location Error in ${component}:`, error);
      }
    }
  });
}

export function useBookingErrorHandler(component: string) {
  return useErrorHandler({
    component,
    enableNetworkMonitoring: true,
    onError: (error) => {
      if (error.code === 'BOOKING_ERROR') {
        console.warn(`Booking Error in ${component}:`, error);
      }
    }
  });
}