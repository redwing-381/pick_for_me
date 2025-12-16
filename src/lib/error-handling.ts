// Comprehensive error handling system for Pick For Me application

import { ERROR_MESSAGES } from './constants';

// =============================================================================
// ERROR TYPES AND INTERFACES
// =============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  retryable: boolean;
  userMessage: string;
  timestamp: Date;
  context?: Record<string, unknown>;
}

export type ErrorCode = 
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'VALIDATION_ERROR'
  | 'LOCATION_ERROR'
  | 'BOOKING_ERROR'
  | 'TIMEOUT_ERROR'
  | 'RATE_LIMIT_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'NOT_FOUND_ERROR'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export interface ErrorRecoveryOptions {
  retry?: () => Promise<void>;
  fallback?: () => Promise<void>;
  alternative?: string;
  contactSupport?: boolean;
}

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  sessionId?: string;
  location?: string;
  timestamp: Date;
  userAgent?: string;
  additionalData?: Record<string, unknown>;
}

// =============================================================================
// ERROR CLASSIFICATION
// =============================================================================

export class AppErrorHandler {
  private static instance: AppErrorHandler;
  private errorLog: AppError[] = [];
  private maxLogSize = 100;

  static getInstance(): AppErrorHandler {
    if (!AppErrorHandler.instance) {
      AppErrorHandler.instance = new AppErrorHandler();
    }
    return AppErrorHandler.instance;
  }

  // =============================================================================
  // ERROR CREATION AND CLASSIFICATION
  // =============================================================================

  createError(
    code: ErrorCode,
    originalError: unknown,
    context: ErrorContext,
    customMessage?: string
  ): AppError {
    const error: AppError = {
      code,
      message: this.getErrorMessage(originalError),
      details: originalError,
      retryable: this.isRetryable(code, originalError),
      userMessage: customMessage || this.getUserFriendlyMessage(code, originalError),
      timestamp: new Date(),
      context: context as unknown as Record<string, unknown>
    };

    this.logError(error);
    return error;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as any).message);
    }
    return 'Unknown error occurred';
  }

  private getUserFriendlyMessage(code: ErrorCode, error: unknown): string {
    switch (code) {
      case 'NETWORK_ERROR':
        return ERROR_MESSAGES.API_NETWORK_ERROR;
      case 'API_ERROR':
        return this.getAPIErrorMessage(error);
      case 'VALIDATION_ERROR':
        return this.getValidationErrorMessage(error);
      case 'LOCATION_ERROR':
        return this.getLocationErrorMessage(error);
      case 'BOOKING_ERROR':
        return ERROR_MESSAGES.BOOKING_FAILED;
      case 'TIMEOUT_ERROR':
        return ERROR_MESSAGES.API_TIMEOUT;
      case 'RATE_LIMIT_ERROR':
        return ERROR_MESSAGES.API_RATE_LIMIT;
      case 'AUTHENTICATION_ERROR':
        return 'Authentication failed. Please try again.';
      case 'PERMISSION_ERROR':
        return 'Permission denied. Please check your settings.';
      case 'NOT_FOUND_ERROR':
        return 'The requested resource was not found.';
      case 'SERVER_ERROR':
        return ERROR_MESSAGES.API_SERVER_ERROR;
      default:
        return ERROR_MESSAGES.GENERIC_ERROR;
    }
  }

  private getAPIErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const apiError = error as any;
      if (apiError.status === 400) return 'Invalid request. Please check your input.';
      if (apiError.status === 401) return 'Authentication failed. Please try again.';
      if (apiError.status === 403) return 'Access denied. Please check permissions.';
      if (apiError.status === 404) return 'Service not found. Please try again later.';
      if (apiError.status === 429) return ERROR_MESSAGES.API_RATE_LIMIT;
      if (apiError.status >= 500) return ERROR_MESSAGES.API_SERVER_ERROR;
    }
    return ERROR_MESSAGES.API_SERVER_ERROR;
  }

  private getValidationErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const validationError = error as any;
      if (validationError.field) {
        return `Please check your ${validationError.field} and try again.`;
      }
      if (validationError.errors && Array.isArray(validationError.errors)) {
        return validationError.errors.join(', ');
      }
    }
    return 'Please check your input and try again.';
  }

  private getLocationErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      const locationError = error as any;
      if (locationError.code === 1) return ERROR_MESSAGES.LOCATION_PERMISSION_DENIED;
      if (locationError.code === 2) return ERROR_MESSAGES.LOCATION_UNAVAILABLE;
      if (locationError.code === 3) return ERROR_MESSAGES.LOCATION_TIMEOUT;
    }
    return ERROR_MESSAGES.LOCATION_UNAVAILABLE;
  }

  private isRetryable(code: ErrorCode, error: unknown): boolean {
    switch (code) {
      case 'NETWORK_ERROR':
      case 'TIMEOUT_ERROR':
      case 'SERVER_ERROR':
        return true;
      case 'API_ERROR':
        if (error && typeof error === 'object') {
          const apiError = error as any;
          return apiError.status >= 500 || apiError.status === 429;
        }
        return false;
      case 'RATE_LIMIT_ERROR':
        return true;
      case 'VALIDATION_ERROR':
      case 'AUTHENTICATION_ERROR':
      case 'PERMISSION_ERROR':
      case 'NOT_FOUND_ERROR':
        return false;
      case 'LOCATION_ERROR':
        if (error && typeof error === 'object') {
          const locationError = error as any;
          return locationError.code === 2 || locationError.code === 3; // POSITION_UNAVAILABLE or TIMEOUT
        }
        return true;
      case 'BOOKING_ERROR':
        return true;
      default:
        return false;
    }
  }

  // =============================================================================
  // ERROR RECOVERY
  // =============================================================================

  async handleErrorWithRecovery(
    error: AppError,
    recoveryOptions: ErrorRecoveryOptions
  ): Promise<void> {
    console.error('Handling error with recovery:', error);

    if (error.retryable && recoveryOptions.retry) {
      try {
        await this.retryWithBackoff(recoveryOptions.retry, 3);
        return;
      } catch (retryError) {
        console.error('Retry failed:', retryError);
      }
    }

    if (recoveryOptions.fallback) {
      try {
        await recoveryOptions.fallback();
        return;
      } catch (fallbackError) {
        console.error('Fallback failed:', fallbackError);
      }
    }

    // If all recovery options fail, log the error and show user message
    this.notifyUser(error);
  }

  private async retryWithBackoff(
    retryFn: () => Promise<void>,
    maxRetries: number,
    baseDelay: number = 1000
  ): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await retryFn();
        return;
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retry attempt ${attempt} failed, waiting ${delay}ms before next attempt`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private notifyUser(error: AppError): void {
    // This would integrate with your notification system
    console.error('User notification:', error.userMessage);
    
    // In a real implementation, this might dispatch to a toast notification system
    if (typeof window !== 'undefined') {
      // Browser environment - could dispatch custom event
      window.dispatchEvent(new CustomEvent('app-error', { 
        detail: { 
          message: error.userMessage,
          retryable: error.retryable,
          code: error.code
        } 
      }));
    }
  }

  // =============================================================================
  // ERROR LOGGING AND MONITORING
  // =============================================================================

  private logError(error: AppError): void {
    this.errorLog.push(error);
    
    // Keep log size manageable
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('App Error:', {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        retryable: error.retryable,
        context: error.context,
        timestamp: error.timestamp
      });
    }

    // In production, you might send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error);
    }
  }

  private sendToMonitoring(error: AppError): void {
    // Integration with monitoring services like Sentry, LogRocket, etc.
    // This is a placeholder for actual monitoring integration
    console.log('Would send to monitoring service:', error.code);
  }

  getErrorLog(): AppError[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  // =============================================================================
  // NETWORK CONNECTIVITY MONITORING
  // =============================================================================

  private isOnline = true;
  private onlineListeners: Array<(online: boolean) => void> = [];

  initializeNetworkMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyOnlineListeners(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyOnlineListeners(false);
    });
  }

  onNetworkChange(callback: (online: boolean) => void): () => void {
    this.onlineListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.onlineListeners.indexOf(callback);
      if (index > -1) {
        this.onlineListeners.splice(index, 1);
      }
    };
  }

  private notifyOnlineListeners(online: boolean): void {
    this.onlineListeners.forEach(listener => listener(online));
  }

  getNetworkStatus(): boolean {
    return this.isOnline;
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function createErrorContext(
  component: string,
  action: string,
  additionalData?: Record<string, unknown>
): ErrorContext {
  return {
    component,
    action,
    timestamp: new Date(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    additionalData
  };
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'TypeError' && error.message.includes('fetch');
  }
  return false;
}

export function isTimeoutError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.name === 'TimeoutError' || error.name === 'AbortError';
  }
  return false;
}

export function isAPIError(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'status' in error);
}

export function getErrorCode(error: unknown): ErrorCode {
  if (isNetworkError(error)) return 'NETWORK_ERROR';
  if (isTimeoutError(error)) return 'TIMEOUT_ERROR';
  if (isAPIError(error)) {
    const apiError = error as any;
    if (apiError.status === 429) return 'RATE_LIMIT_ERROR';
    if (apiError.status === 401) return 'AUTHENTICATION_ERROR';
    if (apiError.status === 403) return 'PERMISSION_ERROR';
    if (apiError.status === 404) return 'NOT_FOUND_ERROR';
    if (apiError.status >= 500) return 'SERVER_ERROR';
    return 'API_ERROR';
  }
  return 'UNKNOWN_ERROR';
}

// =============================================================================
// REACT HOOKS FOR ERROR HANDLING
// =============================================================================

export interface UseErrorHandlerReturn {
  handleError: (error: unknown, context: Partial<ErrorContext>) => AppError;
  handleAsyncError: (
    asyncFn: () => Promise<void>,
    context: Partial<ErrorContext>,
    recoveryOptions?: ErrorRecoveryOptions
  ) => Promise<void>;
  isOnline: boolean;
  errorLog: AppError[];
  clearErrors: () => void;
}

// This would be implemented as a React hook in a separate file
export function createErrorHandler(component: string): UseErrorHandlerReturn {
  const errorHandler = AppErrorHandler.getInstance();

  return {
    handleError: (error: unknown, context: Partial<ErrorContext>) => {
      const fullContext = createErrorContext(component, context.action || 'unknown', context.additionalData);
      const errorCode = getErrorCode(error);
      return errorHandler.createError(errorCode, error, fullContext);
    },

    handleAsyncError: async (
      asyncFn: () => Promise<void>,
      context: Partial<ErrorContext>,
      recoveryOptions?: ErrorRecoveryOptions
    ) => {
      try {
        await asyncFn();
      } catch (error) {
        const fullContext = createErrorContext(component, context.action || 'unknown', context.additionalData);
        const errorCode = getErrorCode(error);
        const appError = errorHandler.createError(errorCode, error, fullContext);
        
        if (recoveryOptions) {
          await errorHandler.handleErrorWithRecovery(appError, recoveryOptions);
        } else {
          throw appError;
        }
      }
    },

    isOnline: errorHandler.getNetworkStatus(),
    errorLog: errorHandler.getErrorLog(),
    clearErrors: () => errorHandler.clearErrorLog()
  };
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const errorHandler = AppErrorHandler.getInstance();

// Initialize network monitoring when module loads
if (typeof window !== 'undefined') {
  errorHandler.initializeNetworkMonitoring();
}