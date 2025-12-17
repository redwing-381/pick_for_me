import { useCallback, useEffect, useState } from 'react';
import { AuthError, AuthErrorCode, AuthErrorSeverity } from '../lib/errors';
import { useToast } from '../components/ui/Toast';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
  onError?: (error: AuthError) => void;
  component?: string;
}

export interface ErrorState {
  error: AuthError | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
}

const DEFAULT_OPTIONS: ErrorHandlerOptions = {
  showToast: true,
  logError: true,
  retryable: true,
  component: 'Unknown',
};

/**
 * Hook for handling errors in React components
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const { addToast } = useToast();
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: false,
  });

  // Error logging function
  const logError = useCallback((error: AuthError) => {
    if (!config.logError) return;

    const logData = error.toLogObject();
    
    // In development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 AuthError in ${config.component}`);
      console.error('Error Details:', logData);
      console.groupEnd();
    }

    // In production, send to logging service
    // This would typically be sent to a service like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to logging service
      // logToService(logData);
    }
  }, [config.logError, config.component]);

  // Show toast notification
  const showErrorToast = useCallback((error: AuthError) => {
    if (!config.showToast) return;

    const toastType = error.severity === AuthErrorSeverity.CRITICAL ? 'error' :
                     error.severity === AuthErrorSeverity.HIGH ? 'error' :
                     error.severity === AuthErrorSeverity.MEDIUM ? 'warning' : 'info';

    addToast({
      type: toastType,
      title: 'Error',
      message: error.userMessage,
      duration: error.severity === AuthErrorSeverity.CRITICAL ? 0 : 5000, // Critical errors don't auto-dismiss
    });
  }, [config.showToast, addToast]);

  // Handle error function
  const handleError = useCallback((
    error: Error | AuthError,
    context: Record<string, any> = {}
  ) => {
    const authError = error instanceof AuthError 
      ? error 
      : AuthError.fromError(error, { 
          component: config.component,
          ...context 
        });

    // Log the error
    logError(authError);

    // Show toast notification
    showErrorToast(authError);

    // Update error state
    setErrorState(prev => ({
      error: authError,
      isRetrying: false,
      retryCount: prev.error?.code === authError.code ? prev.retryCount : 0,
      canRetry: Boolean(config.retryable && authError.isRetryable()),
    }));

    // Call custom error handler
    if (config.onError) {
      config.onError(authError);
    }

    return authError;
  }, [config, logError, showErrorToast]);

  // Clear error function
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: false,
    });
  }, []);

  // Retry function
  const retry = useCallback(async (retryFn?: () => Promise<void>) => {
    if (!errorState.canRetry || !errorState.error) {
      return;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      if (retryFn) {
        await retryFn();
      }
      clearError();
    } catch (error) {
      handleError(error as Error, { retryAttempt: errorState.retryCount + 1 });
    }
  }, [errorState, handleError, clearError]);

  // Wrap async function with error handling
  const wrapAsync = useCallback(<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: Record<string, any>
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        clearError();
        return await fn(...args);
      } catch (error) {
        handleError(error as Error, context);
        return undefined;
      }
    };
  }, [handleError, clearError]);

  // Wrap sync function with error handling
  const wrapSync = useCallback(<T extends any[], R>(
    fn: (...args: T) => R,
    context?: Record<string, any>
  ) => {
    return (...args: T): R | undefined => {
      try {
        clearError();
        return fn(...args);
      } catch (error) {
        handleError(error as Error, context);
        return undefined;
      }
    };
  }, [handleError, clearError]);

  // Handle form validation errors
  const handleFormError = useCallback((
    fieldErrors: Record<string, string>,
    context: Record<string, any> = {}
  ) => {
    const formError = AuthError.formValidation(fieldErrors, {
      component: config.component,
      ...context,
    });

    return handleError(formError, context);
  }, [handleError, config.component]);

  // Handle validation error
  const handleValidationError = useCallback((
    message: string,
    context: Record<string, any> = {}
  ) => {
    const validationError = AuthError.validation(message, {
      component: config.component,
      ...context,
    });

    return handleError(validationError, context);
  }, [handleError, config.component]);

  // Handle network error
  const handleNetworkError = useCallback((
    context: Record<string, any> = {}
  ) => {
    const networkError = AuthError.network({
      component: config.component,
      ...context,
    });

    return handleError(networkError, context);
  }, [handleError, config.component]);

  return {
    // Error state
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    canRetry: errorState.canRetry,
    hasError: !!errorState.error,

    // Error handling functions
    handleError,
    clearError,
    retry,

    // Wrapper functions
    wrapAsync,
    wrapSync,

    // Specific error handlers
    handleFormError,
    handleValidationError,
    handleNetworkError,
  };
}