'use client';

import React, { useState, useEffect } from 'react';
import { AppError } from '@/lib/error-handling';

// =============================================================================
// TOAST TYPES AND INTERFACES
// =============================================================================

export interface ToastNotification {
  id: string;
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  duration?: number;
  retryable?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

interface ErrorToastProps {
  notification: ToastNotification;
  onDismiss: (id: string) => void;
}

// =============================================================================
// INDIVIDUAL TOAST COMPONENT
// =============================================================================

function ErrorToast({ notification, onDismiss }: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
      notification.onDismiss?.();
    }, 300);
  };

  const handleRetry = () => {
    notification.onRetry?.();
    handleDismiss();
  };

  const getToastStyles = () => {
    const baseStyles = `
      transform transition-all duration-300 ease-in-out
      ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `;

    switch (notification.type) {
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case 'info':
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
      default:
        return `${baseStyles} bg-gray-50 border-gray-200 text-gray-800`;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'info':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-sm w-full border rounded-lg shadow-lg p-4 mb-3 ${getToastStyles()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3 mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium mb-1">{notification.title}</h4>
          <p className="text-sm opacity-90">{notification.message}</p>
          
          {(notification.retryable || notification.onRetry) && (
            <div className="mt-3 flex space-x-2">
              <button
                onClick={handleRetry}
                className="text-xs bg-white bg-opacity-20 hover:bg-opacity-30 px-2 py-1 rounded transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// TOAST CONTAINER COMPONENT
// =============================================================================

interface ErrorToastContainerProps {
  notifications: ToastNotification[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ErrorToastContainer({ 
  notifications, 
  onDismiss, 
  position = 'top-right' 
}: ErrorToastContainerProps) {
  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'top-4 right-4';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className={`fixed ${getPositionStyles()} z-50 pointer-events-none`}>
      <div className="pointer-events-auto">
        {notifications.map((notification) => (
          <ErrorToast
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// TOAST MANAGER HOOK
// =============================================================================

export function useToastManager() {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = (notification: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: ToastNotification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  // Helper methods for different types
  const showError = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      duration: 7000, // Longer for errors
      ...options
    });
  };

  const showWarning = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      duration: 5000,
      ...options
    });
  };

  const showSuccess = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      duration: 4000,
      ...options
    });
  };

  const showInfo = (title: string, message: string, options?: Partial<ToastNotification>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      duration: 5000,
      ...options
    });
  };

  const showAppError = (error: AppError, onRetry?: () => void) => {
    return showError(
      'Error',
      error.userMessage,
      {
        retryable: error.retryable,
        onRetry: error.retryable ? onRetry : undefined,
        duration: error.retryable ? 10000 : 7000 // Longer duration for retryable errors
      }
    );
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showError,
    showWarning,
    showSuccess,
    showInfo,
    showAppError
  };
}

// =============================================================================
// GLOBAL TOAST PROVIDER
// =============================================================================

interface ToastProviderProps {
  children: React.ReactNode;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const ToastContext = React.createContext<ReturnType<typeof useToastManager> | null>(null);

export function ToastProvider({ children, position = 'top-right' }: ToastProviderProps) {
  const toastManager = useToastManager();

  // Listen for global error events
  useEffect(() => {
    const handleAppError = (event: CustomEvent) => {
      const { message, retryable, code } = event.detail;
      toastManager.showError(
        'Error',
        message,
        {
          retryable,
          duration: retryable ? 10000 : 7000
        }
      );
    };

    window.addEventListener('app-error', handleAppError as EventListener);
    return () => window.removeEventListener('app-error', handleAppError as EventListener);
  }, [toastManager]);

  return (
    <ToastContext.Provider value={toastManager}>
      {children}
      <ErrorToastContainer
        notifications={toastManager.notifications}
        onDismiss={toastManager.removeNotification}
        position={position}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}