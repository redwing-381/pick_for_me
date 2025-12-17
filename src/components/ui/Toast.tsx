'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newToast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4 max-w-md">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: Toast;
}

function ToastItem({ toast }: ToastItemProps) {
  const { removeToast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => removeToast(toast.id), 200);
  };

  const typeStyles = {
    success: 'bg-green-400 text-black',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-400 text-black',
    info: 'bg-blue-400 text-black',
  };

  const typeIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 pr-12 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[300px] max-w-md relative transition-all duration-200',
        typeStyles[toast.type],
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
    >
      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center font-bold text-lg">
        {typeIcons[toast.type]}
      </div>
      
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-bold text-sm mb-1">
            {toast.title}
          </div>
        )}
        <div className="font-medium text-sm">
          {toast.message}
        </div>
      </div>

      <button
        onClick={handleClose}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center font-bold text-lg hover:bg-black hover:bg-opacity-10 transition-colors"
      >
        ×
      </button>
    </div>
  );
}

