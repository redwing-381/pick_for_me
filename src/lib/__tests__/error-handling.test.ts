/**
 * Property-based tests for error handling system
 * **Feature: pick-for-me, Property 7: Error Handling and Recovery**
 * **Validates: Requirements 6.1, 6.3, 6.4, 6.5**
 */

import fc from 'fast-check';
import { 
  AppErrorHandler, 
  createErrorContext, 
  getErrorCode, 
  isNetworkError, 
  isTimeoutError, 
  isAPIError 
} from '../error-handling';
import type { ErrorCode, ErrorContext } from '../error-handling';

describe('Error Handling System Property Tests', () => {
  let errorHandler: AppErrorHandler;

  beforeEach(() => {
    errorHandler = AppErrorHandler.getInstance();
    errorHandler.clearErrorLog();
  });

  describe('Property 7.1: Error Classification Consistency', () => {
    /**
     * For any error input, the error classification should be consistent
     * and produce valid error codes
     */
    it('should consistently classify errors into valid error codes', () => {
      fc.assert(fc.property(
        fc.oneof(
          // Network errors
          fc.record({
            name: fc.constant('TypeError'),
            message: fc.string().filter(s => s.includes('fetch'))
          }),
          // Timeout errors  
          fc.record({
            name: fc.oneof(fc.constant('TimeoutError'), fc.constant('AbortError')),
            message: fc.string()
          }),
          // API errors
          fc.record({
            status: fc.integer({ min: 400, max: 599 }),
            message: fc.string()
          }),
          // Generic errors
          fc.record({
            message: fc.string()
          }),
          // String errors
          fc.string(),
          // Null/undefined
          fc.constantFrom(null, undefined)
        ),
        (error) => {
          const errorCode = getErrorCode(error);
          
          // Error code should be one of the valid codes
          const validCodes: ErrorCode[] = [
            'NETWORK_ERROR', 'API_ERROR', 'VALIDATION_ERROR', 'LOCATION_ERROR',
            'BOOKING_ERROR', 'TIMEOUT_ERROR', 'RATE_LIMIT_ERROR', 'AUTHENTICATION_ERROR',
            'PERMISSION_ERROR', 'NOT_FOUND_ERROR', 'SERVER_ERROR', 'UNKNOWN_ERROR'
          ];
          
          expect(validCodes).toContain(errorCode);
          
          // Classification should be deterministic
          const errorCode2 = getErrorCode(error);
          expect(errorCode).toBe(errorCode2);
        }
      ), { numRuns: 100 });
    });
  });

  describe('Property 7.2: Error Context Preservation', () => {
    /**
     * For any error context, all provided information should be preserved
     * in the created error
     */
    it('should preserve all context information in created errors', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 1 }), // component
        fc.string({ minLength: 1 }), // action
        fc.dictionary(fc.string(), fc.anything()), // additionalData
        fc.oneof(fc.string(), fc.record({ message: fc.string() })), // error
        (component, action, additionalData, originalError) => {
          const context = createErrorContext(component, action, additionalData);
          const errorCode = getErrorCode(originalError);
          const appError = errorHandler.createError(errorCode, originalError, context);
          
          // Context should be preserved
          expect(appError.context?.component).toBe(component);
          expect(appError.context?.action).toBe(action);
          expect(appError.context?.additionalData).toEqual(additionalData);
          expect(appError.context?.timestamp).toBeInstanceOf(Date);
          
          // Error details should be preserved
          expect(appError.code).toBe(errorCode);
          expect(appError.details).toBe(originalError);
          expect(appError.timestamp).toBeInstanceOf(Date);
          expect(typeof appError.message).toBe('string');
          expect(typeof appError.userMessage).toBe('string');
          expect(typeof appError.retryable).toBe('boolean');
        }
      ), { numRuns: 50 });
    });
  });

  describe('Property 7.3: Retry Logic Consistency', () => {
    /**
     * For any error, the retryable flag should be consistent with the error type
     * and retry attempts should respect the retryable flag
     */
    it('should have consistent retry logic based on error types', () => {
      fc.assert(fc.property(
        fc.oneof(
          // Retryable errors
          fc.record({ name: fc.constant('TypeError'), message: fc.string().filter(s => s.includes('fetch')) }),
          fc.record({ name: fc.constant('TimeoutError') }),
          fc.record({ status: fc.constantFrom(500, 502, 503, 504, 429) }),
          // Non-retryable errors
          fc.record({ status: fc.constantFrom(400, 401, 403, 404) }),
          fc.string()
        ),
        fc.string({ minLength: 1 }), // component
        fc.string({ minLength: 1 }), // action
        (error, component, action) => {
          const context = createErrorContext(component, action);
          const errorCode = getErrorCode(error);
          const appError = errorHandler.createError(errorCode, error, context);
          
          // Retryable logic should be consistent
          if (isNetworkError(error) || isTimeoutError(error)) {
            expect(appError.retryable).toBe(true);
          }
          
          if (isAPIError(error)) {
            const apiError = error as any;
            if (apiError.status >= 500 || apiError.status === 429) {
              expect(appError.retryable).toBe(true);
            } else if ([400, 401, 403, 404].includes(apiError.status)) {
              expect(appError.retryable).toBe(false);
            }
          }
          
          // Error code should match retryable status
          const nonRetryableCodes = ['VALIDATION_ERROR', 'AUTHENTICATION_ERROR', 'PERMISSION_ERROR', 'NOT_FOUND_ERROR'];
          if (nonRetryableCodes.includes(errorCode)) {
            expect(appError.retryable).toBe(false);
          }
        }
      ), { numRuns: 50 });
    });
  });

  describe('Property 7.4: Error Message Quality', () => {
    /**
     * For any error, the user message should be non-empty, helpful,
     * and not expose sensitive information
     */
    it('should generate appropriate user messages for all error types', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.record({ status: fc.integer({ min: 400, max: 599 }), message: fc.string() }),
          fc.record({ name: fc.constant('TypeError'), message: fc.string().filter(s => s.includes('fetch')) }),
          fc.record({ name: fc.constant('TimeoutError'), message: fc.string() }),
          fc.record({ code: fc.integer({ min: 1, max: 3 }) }), // Geolocation errors
          fc.string(),
          fc.record({ message: fc.string() })
        ),
        fc.string({ minLength: 1 }), // component
        fc.string({ minLength: 1 }), // action
        (error, component, action) => {
          const context = createErrorContext(component, action);
          const errorCode = getErrorCode(error);
          const appError = errorHandler.createError(errorCode, error, context);
          
          // User message should be helpful
          expect(appError.userMessage).toBeTruthy();
          expect(appError.userMessage.length).toBeGreaterThan(0);
          expect(typeof appError.userMessage).toBe('string');
          
          // Should not expose sensitive information
          expect(appError.userMessage).not.toMatch(/password|token|key|secret/i);
          expect(appError.userMessage).not.toMatch(/internal|debug|stack/i);
          
          // Should be user-friendly (no technical jargon in common cases)
          if (errorCode === 'NETWORK_ERROR') {
            expect(appError.userMessage.toLowerCase()).toMatch(/network|connection|internet/);
          }
          
          if (errorCode === 'TIMEOUT_ERROR') {
            expect(appError.userMessage.toLowerCase()).toMatch(/timeout|timed out|try again/);
          }
          
          if (errorCode === 'RATE_LIMIT_ERROR') {
            expect(appError.userMessage.toLowerCase()).toMatch(/too many|wait|limit/);
          }
        }
      ), { numRuns: 50 });
    });
  });

  describe('Property 7.5: Error Log Management', () => {
    /**
     * For any sequence of errors, the error log should maintain size limits
     * and preserve the most recent errors
     */
    it('should maintain error log size limits and preserve recent errors', () => {
      fc.assert(fc.property(
        fc.array(
          fc.record({
            error: fc.oneof(fc.string(), fc.record({ message: fc.string() })),
            component: fc.string({ minLength: 1 }),
            action: fc.string({ minLength: 1 })
          }),
          { minLength: 1, maxLength: 150 } // Test with more errors than the limit
        ),
        (errorSpecs) => {
          errorHandler.clearErrorLog();
          const createdErrors = [];
          
          // Create all errors
          for (const spec of errorSpecs) {
            const context = createErrorContext(spec.component, spec.action);
            const errorCode = getErrorCode(spec.error);
            const appError = errorHandler.createError(errorCode, spec.error, context);
            createdErrors.push(appError);
          }
          
          const errorLog = errorHandler.getErrorLog();
          
          // Should not exceed maximum size (assuming 100 is the limit)
          expect(errorLog.length).toBeLessThanOrEqual(100);
          
          // If we created more than 100 errors, should keep the most recent ones
          if (createdErrors.length > 100) {
            expect(errorLog.length).toBe(100);
            
            // Should contain the last 100 errors
            const lastErrors = createdErrors.slice(-100);
            for (let i = 0; i < 100; i++) {
              expect(errorLog[i].timestamp).toEqual(lastErrors[i].timestamp);
            }
          } else {
            // Should contain all errors if under limit
            expect(errorLog.length).toBe(createdErrors.length);
          }
          
          // All errors in log should have required properties
          errorLog.forEach(error => {
            expect(error).toHaveProperty('code');
            expect(error).toHaveProperty('message');
            expect(error).toHaveProperty('userMessage');
            expect(error).toHaveProperty('retryable');
            expect(error).toHaveProperty('timestamp');
            expect(error.timestamp).toBeInstanceOf(Date);
          });
        }
      ), { numRuns: 20 });
    });
  });

  describe('Property 7.6: Network Status Monitoring', () => {
    /**
     * Network status should be consistently tracked and reported
     */
    it('should consistently track network status', () => {
      fc.assert(fc.property(
        fc.boolean(),
        (initialStatus) => {
          // Network status should be a boolean
          const status = errorHandler.getNetworkStatus();
          expect(typeof status).toBe('boolean');
          
          // Status should be consistent across calls
          const status2 = errorHandler.getNetworkStatus();
          expect(status).toBe(status2);
        }
      ), { numRuns: 10 });
    });
  });

  describe('Property 7.7: Error Recovery Options', () => {
    /**
     * For any error with recovery options, the recovery should be attempted
     * according to the error's retryable status
     */
    it('should handle recovery options based on error retryability', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          // Retryable error
          fc.record({ name: fc.constant('TypeError'), message: fc.constant('fetch failed') }),
          // Non-retryable error
          fc.record({ status: fc.constant(400), message: fc.string() })
        ),
        fc.string({ minLength: 1 }), // component
        fc.string({ minLength: 1 }), // action
        async (error, component, action) => {
          const context = createErrorContext(component, action);
          const errorCode = getErrorCode(error);
          const appError = errorHandler.createError(errorCode, error, context);
          
          let retryAttempted = false;
          let fallbackAttempted = false;
          
          const recoveryOptions = {
            retry: async () => {
              retryAttempted = true;
            },
            fallback: async () => {
              fallbackAttempted = true;
            }
          };
          
          try {
            await errorHandler.handleErrorWithRecovery(appError, recoveryOptions);
          } catch (e) {
            // Recovery might fail, that's okay for testing
          }
          
          // If error is retryable, retry should be attempted
          if (appError.retryable) {
            expect(retryAttempted).toBe(true);
          }
          
          // Fallback might be attempted regardless
          // (This depends on implementation details)
        }
      ), { numRuns: 20 });
    });
  });
});

// =============================================================================
// HELPER FUNCTIONS FOR TESTING
// =============================================================================

describe('Error Classification Helper Functions', () => {
  describe('isNetworkError', () => {
    it('should correctly identify network errors', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.record({ name: fc.constant('TypeError'), message: fc.string().filter(s => s.includes('fetch')) }),
          fc.record({ name: fc.string().filter(s => s !== 'TypeError'), message: fc.string() }),
          fc.string(),
          fc.integer(),
          fc.constantFrom(null, undefined)
        ),
        (error) => {
          const result = isNetworkError(error);
          
          if (error && typeof error === 'object' && 'name' in error && 'message' in error) {
            const typedError = error as { name: string; message: string };
            if (typedError.name === 'TypeError' && typedError.message.includes('fetch')) {
              expect(result).toBe(true);
            } else {
              expect(result).toBe(false);
            }
          } else {
            expect(result).toBe(false);
          }
        }
      ), { numRuns: 50 });
    });
  });

  describe('isTimeoutError', () => {
    it('should correctly identify timeout errors', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.record({ name: fc.constantFrom('TimeoutError', 'AbortError') }),
          fc.record({ name: fc.string().filter(s => !['TimeoutError', 'AbortError'].includes(s)) }),
          fc.string(),
          fc.integer(),
          fc.constantFrom(null, undefined)
        ),
        (error) => {
          const result = isTimeoutError(error);
          
          if (error && typeof error === 'object' && 'name' in error) {
            const typedError = error as { name: string };
            if (['TimeoutError', 'AbortError'].includes(typedError.name)) {
              expect(result).toBe(true);
            } else {
              expect(result).toBe(false);
            }
          } else {
            expect(result).toBe(false);
          }
        }
      ), { numRuns: 50 });
    });
  });

  describe('isAPIError', () => {
    it('should correctly identify API errors', () => {
      fc.assert(fc.property(
        fc.oneof(
          fc.record({ status: fc.integer() }),
          fc.record({ message: fc.string() }),
          fc.string(),
          fc.integer(),
          fc.constantFrom(null, undefined)
        ),
        (error) => {
          const result = isAPIError(error);
          
          if (error && typeof error === 'object' && 'status' in error) {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        }
      ), { numRuns: 50 });
    });
  });
});