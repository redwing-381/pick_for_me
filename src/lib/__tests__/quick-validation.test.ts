/**
 * Quick validation tests for Pick For Me application
 * These tests verify core functionality without extensive property-based testing
 */

import { 
  AppErrorHandler, 
  createErrorContext, 
  getErrorCode 
} from '../error-handling';

describe('Quick System Validation', () => {
  let errorHandler: AppErrorHandler;

  beforeEach(() => {
    errorHandler = AppErrorHandler.getInstance();
    errorHandler.clearErrorLog();
  });

  describe('Error Handling Core Functions', () => {
    it('should create error contexts correctly', () => {
      const context = createErrorContext('TestComponent', 'testAction', { test: 'data' });
      
      expect(context.component).toBe('TestComponent');
      expect(context.action).toBe('testAction');
      expect(context.additionalData).toEqual({ test: 'data' });
      expect(context.timestamp).toBeInstanceOf(Date);
    });

    it('should classify network errors correctly', () => {
      const networkError = new Error('fetch failed');
      networkError.name = 'TypeError';
      
      const errorCode = getErrorCode(networkError);
      expect(errorCode).toBe('NETWORK_ERROR');
    });

    it('should classify API errors correctly', () => {
      const apiError = { status: 404, message: 'Not found' };
      
      const errorCode = getErrorCode(apiError);
      expect(errorCode).toBe('NOT_FOUND_ERROR');
    });

    it('should create and log errors properly', () => {
      const context = createErrorContext('TestComponent', 'testAction');
      const error = new Error('Test error');
      
      const appError = errorHandler.createError('UNKNOWN_ERROR', error, context);
      
      expect(appError.code).toBe('UNKNOWN_ERROR');
      expect(appError.message).toBe('Test error');
      expect(appError.userMessage).toBeTruthy();
      expect(typeof appError.retryable).toBe('boolean');
      expect(appError.timestamp).toBeInstanceOf(Date);
      
      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0]).toBe(appError);
    });

    it('should clear error log correctly', () => {
      const context = createErrorContext('TestComponent', 'testAction');
      errorHandler.createError('UNKNOWN_ERROR', new Error('Test'), context);
      
      expect(errorHandler.getErrorLog()).toHaveLength(1);
      
      errorHandler.clearErrorLog();
      expect(errorHandler.getErrorLog()).toHaveLength(0);
    });
  });

  describe('System Integration', () => {
    it('should handle singleton pattern correctly', () => {
      const handler1 = AppErrorHandler.getInstance();
      const handler2 = AppErrorHandler.getInstance();
      
      expect(handler1).toBe(handler2);
    });

    it('should provide network status', () => {
      const status = errorHandler.getNetworkStatus();
      expect(typeof status).toBe('boolean');
    });
  });
});