import { AuthError, AuthErrorCode } from './errors';

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: Error) => boolean;
}

export interface NetworkStatus {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
}

/**
 * Default retry options for network operations
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryCondition: (error: Error) => {
    if (error instanceof AuthError) {
      return error.isRetryable();
    }
    // Retry on network errors
    return error.message.toLowerCase().includes('network') ||
           error.message.toLowerCase().includes('timeout') ||
           error.message.toLowerCase().includes('connection');
  },
};

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  if (typeof navigator === 'undefined') {
    return true; // Assume online in server environment
  }
  return navigator.onLine;
}

/**
 * Get network status information
 */
export function getNetworkStatus(): NetworkStatus {
  if (typeof navigator === 'undefined') {
    return { isOnline: true };
  }

  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;

  return {
    isOnline: navigator.onLine,
    connectionType: connection?.type,
    effectiveType: connection?.effectiveType,
  };
}

/**
 * Wait for network to come back online
 */
export function waitForOnline(timeout: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isOnline()) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onOnline);
      reject(new AuthError(
        AuthErrorCode.NETWORK_REQUEST_FAILED,
        'Network connection timeout. Please check your internet connection.',
        'Timeout waiting for network connection',
      ));
    }, timeout);

    const onOnline = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', onOnline);
      resolve();
    };

    window.addEventListener('online', onOnline);
  });
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const delay = options.baseDelay * Math.pow(options.backoffFactor, attempt - 1);
  return Math.min(delay, options.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      // Wait for network if offline
      if (!isOnline()) {
        await waitForOnline();
      }

      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's the last attempt
      if (attempt === config.maxAttempts) {
        break;
      }

      // Check if we should retry this error
      if (config.retryCondition && !config.retryCondition(lastError)) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, config);
      await sleep(delay);
    }
  }

  // If we get here, all attempts failed
  throw AuthError.fromError(
    lastError!,
    { 
      component: 'NetworkUtils',
      action: 'retryWithBackoff',
      additionalData: { 
        attempts: config.maxAttempts,
        lastAttempt: true 
      }
    },
    'Operation failed after multiple attempts. Please try again.'
  );
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: Error): boolean {
  if (error instanceof AuthError) {
    return error.code === AuthErrorCode.NETWORK_REQUEST_FAILED;
  }

  const message = error.message.toLowerCase();
  return message.includes('network') ||
         message.includes('timeout') ||
         message.includes('connection') ||
         message.includes('fetch') ||
         message.includes('cors');
}

/**
 * Network-aware function wrapper
 */
export function withNetworkRetry<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: Partial<RetryOptions> = {}
) {
  return async (...args: T): Promise<R> => {
    return retryWithBackoff(() => fn(...args), options);
  };
}

/**
 * Monitor network status changes
 */
export class NetworkMonitor {
  private listeners: Array<(status: NetworkStatus) => void> = [];
  private currentStatus: NetworkStatus;

  constructor() {
    this.currentStatus = getNetworkStatus();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', this.handleStatusChange);
    window.addEventListener('offline', this.handleStatusChange);

    // Listen for connection changes if supported
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', this.handleStatusChange);
    }
  }

  private handleStatusChange = () => {
    const newStatus = getNetworkStatus();
    const statusChanged = newStatus.isOnline !== this.currentStatus.isOnline ||
                         newStatus.connectionType !== this.currentStatus.connectionType;

    if (statusChanged) {
      this.currentStatus = newStatus;
      this.notifyListeners(newStatus);
    }
  };

  private notifyListeners(status: NetworkStatus) {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    });
  }

  public addListener(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  public isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  public destroy() {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('online', this.handleStatusChange);
    window.removeEventListener('offline', this.handleStatusChange);

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.removeEventListener('change', this.handleStatusChange);
    }

    this.listeners = [];
  }
}

// Global network monitor instance
export const networkMonitor = new NetworkMonitor();