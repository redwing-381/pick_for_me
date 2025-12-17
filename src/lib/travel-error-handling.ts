// Enhanced error handling system specifically for travel services
import { ApiResponse } from './types';
import { errorHandler, createErrorContext, ErrorCode } from './error-handling';

// =============================================================================
// TRAVEL-SPECIFIC ERROR TYPES
// =============================================================================

export interface TravelError {
  code: string;
  message: string;
  category: 'booking' | 'itinerary' | 'location' | 'api' | 'validation' | 'network';
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  userMessage: string;
  suggestedActions: string[];
  context?: Record<string, any>;
  timestamp: Date;
}

export interface ErrorRecoveryStrategy {
  canRecover: boolean;
  recoveryAction: () => Promise<any>;
  fallbackData?: any;
  userGuidance: string;
}

export interface ServiceHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  lastCheck: Date;
  errorCount: number;
  responseTime: number;
}

// =============================================================================
// ERROR CODES AND MESSAGES
// =============================================================================

export const TRAVEL_ERROR_CODES = {
  // Booking Errors
  BOOKING_UNAVAILABLE: {
    code: 'BOOKING_UNAVAILABLE',
    message: 'The requested booking is not available',
    category: 'booking' as const,
    severity: 'medium' as const,
    retryable: false,
    userMessage: 'Sorry, this booking is no longer available. Let me suggest some alternatives.',
    suggestedActions: ['View alternative options', 'Try different dates', 'Contact venue directly'] as string[]
  },
  BOOKING_FAILED: {
    code: 'BOOKING_FAILED',
    message: 'Booking request failed',
    category: 'booking' as const,
    severity: 'high' as const,
    retryable: true,
    userMessage: 'We encountered an issue processing your booking. Please try again.',
    suggestedActions: ['Retry booking', 'Check payment information', 'Contact support'] as string[]
  },
  
  // Itinerary Errors
  ITINERARY_GENERATION_FAILED: {
    code: 'ITINERARY_GENERATION_FAILED',
    message: 'Failed to generate travel itinerary',
    category: 'itinerary' as const,
    severity: 'high' as const,
    retryable: true,
    userMessage: 'We had trouble creating your itinerary. Let me try a different approach.',
    suggestedActions: ['Simplify preferences', 'Try shorter trip', 'Manual planning mode'] as string[]
  },
  ITINERARY_TOO_COMPLEX: {
    code: 'ITINERARY_TOO_COMPLEX',
    message: 'Itinerary request is too complex',
    category: 'itinerary' as const,
    severity: 'medium' as const,
    retryable: false,
    userMessage: 'Your trip request is quite complex. Let me break it down into simpler parts.',
    suggestedActions: ['Reduce trip length', 'Fewer activities per day', 'Split into multiple trips'] as string[]
  },
  
  // Location Errors
  LOCATION_NOT_FOUND: {
    code: 'LOCATION_NOT_FOUND',
    message: 'Location could not be found',
    category: 'location' as const,
    severity: 'medium' as const,
    retryable: false,
    userMessage: 'I couldn\'t find that location. Could you be more specific?',
    suggestedActions: ['Check spelling', 'Include city/state', 'Use nearby landmark'] as string[]
  },
  
  // API Errors
  API_RATE_LIMITED: {
    code: 'API_RATE_LIMITED',
    message: 'API rate limit exceeded',
    category: 'api' as const,
    severity: 'medium' as const,
    retryable: true,
    userMessage: 'I\'m getting a lot of requests right now. Please wait a moment.',
    suggestedActions: ['Wait and retry', 'Try simpler request', 'Come back later'] as string[]
  },
  
  // Network Errors
  NETWORK_TIMEOUT: {
    code: 'NETWORK_TIMEOUT',
    message: 'Network request timed out',
    category: 'network' as const,
    severity: 'medium' as const,
    retryable: true,
    userMessage: 'The connection is slow. Please check your internet and try again.',
    suggestedActions: ['Check internet connection', 'Retry request', 'Try simpler request'] as string[]
  }
} as const;

// =============================================================================
// TRAVEL ERROR HANDLER CLASS
// =============================================================================

export class TravelErrorHandler {
  private serviceHealth = new Map<string, ServiceHealthStatus>();
  private errorHistory: TravelError[] = [];
  private maxErrorHistory = 100;
  
  createTravelError(
    errorCode: keyof typeof TRAVEL_ERROR_CODES,
    context?: Record<string, any>,
    originalError?: Error
  ): TravelError {
    const errorTemplate = TRAVEL_ERROR_CODES[errorCode];
    
    const travelError: TravelError = {
      ...errorTemplate,
      context,
      timestamp: new Date()
    };
    
    // Log the error using the existing error handler
    const errorContext = createErrorContext('travel-error-handler', 'createTravelError', {
      travelErrorCode: errorCode,
      category: errorTemplate.category,
      severity: errorTemplate.severity,
      ...context
    });
    
    errorHandler.createError('UNKNOWN_ERROR' as ErrorCode, originalError || new Error(errorTemplate.message), errorContext);
    
    // Add to error history
    this.addToErrorHistory(travelError);
    
    return travelError;
  }
  
  async handleTravelError<T>(
    error: TravelError,
    recoveryStrategy?: ErrorRecoveryStrategy
  ): Promise<ApiResponse<T>> {
    console.warn(`Travel Error [${error.code}]:`, error.message);
    
    // Update service health if applicable
    if (error.context?.service) {
      this.updateServiceHealth(error.context.service, 'degraded');
    }
    
    // Attempt recovery if strategy provided and error is retryable
    if (recoveryStrategy && error.retryable && recoveryStrategy.canRecover) {
      try {
        console.log('Attempting error recovery:', recoveryStrategy.userGuidance);
        const recoveryResult = await recoveryStrategy.recoveryAction();
        
        // Recovery successful
        if (error.context?.service) {
          this.updateServiceHealth(error.context.service, 'healthy');
        }
        
        return {
          success: true,
          data: recoveryResult
        };
      } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
        // Fall through to return error response
      }
    }
    
    // Return error response with user-friendly message
    return {
      success: false,
      error: {
        code: error.code,
        message: error.userMessage,
        details: {
          category: error.category,
          severity: error.severity,
          retryable: error.retryable,
          suggestedActions: error.suggestedActions,
          context: error.context
        }
      }
    };
  }
  
  updateServiceHealth(
    service: string, 
    status: ServiceHealthStatus['status'],
    responseTime?: number
  ): void {
    const currentHealth = this.serviceHealth.get(service);
    
    this.serviceHealth.set(service, {
      service,
      status,
      lastCheck: new Date(),
      errorCount: status === 'healthy' ? 0 : (currentHealth?.errorCount || 0) + 1,
      responseTime: responseTime || currentHealth?.responseTime || 0
    });
  }
  
  getServiceHealth(service: string): ServiceHealthStatus | undefined {
    return this.serviceHealth.get(service);
  }
  
  getAllServiceHealth(): ServiceHealthStatus[] {
    return Array.from(this.serviceHealth.values());
  }
  
  isServiceHealthy(service: string): boolean {
    const health = this.serviceHealth.get(service);
    return !health || health.status === 'healthy';
  }
  
  createBookingRecoveryStrategy(
    originalBookingFn: () => Promise<any>,
    alternativeOptions?: any[]
  ): ErrorRecoveryStrategy {
    return {
      canRecover: true,
      recoveryAction: async () => {
        // Try original booking again with exponential backoff
        await this.delay(1000);
        return await originalBookingFn();
      },
      fallbackData: alternativeOptions,
      userGuidance: 'Retrying your booking request...'
    };
  }
  
  createItineraryRecoveryStrategy(
    simplifiedRequest: any,
    fallbackItinerary?: any
  ): ErrorRecoveryStrategy {
    return {
      canRecover: true,
      recoveryAction: async () => {
        // Try with simplified parameters
        return await this.generateSimplifiedItinerary(simplifiedRequest);
      },
      fallbackData: fallbackItinerary,
      userGuidance: 'Trying with simplified preferences...'
    };
  }
  
  getErrorStats(): {
    totalErrors: number;
    errorsByCategory: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    recentErrors: TravelError[];
    mostCommonErrors: Array<{ code: string; count: number }>;
  } {
    const errorsByCategory: Record<string, number> = {};
    const errorsBySeverity: Record<string, number> = {};
    const errorCounts: Record<string, number> = {};
    
    this.errorHistory.forEach(error => {
      errorsByCategory[error.category] = (errorsByCategory[error.category] || 0) + 1;
      errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
      errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
    });
    
    const mostCommonErrors = Object.entries(errorCounts)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    const recentErrors = this.errorHistory
      .slice(-10)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return {
      totalErrors: this.errorHistory.length,
      errorsByCategory,
      errorsBySeverity,
      recentErrors,
      mostCommonErrors
    };
  }
  
  private addToErrorHistory(error: TravelError): void {
    this.errorHistory.push(error);
    
    // Keep only recent errors
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async generateSimplifiedItinerary(request: any): Promise<any> {
    // Mock simplified itinerary generation
    return {
      id: 'simplified-itinerary',
      name: 'Simplified Trip Plan',
      days: [{
        date: new Date(),
        activities: [],
        accommodation: null,
        meals: [],
        transportation: [],
        notes: 'Simplified itinerary due to complexity'
      }],
      totalEstimatedCost: 0
    };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let travelErrorHandlerInstance: TravelErrorHandler | null = null;

export function getTravelErrorHandler(): TravelErrorHandler {
  if (!travelErrorHandlerInstance) {
    travelErrorHandlerInstance = new TravelErrorHandler();
  }
  return travelErrorHandlerInstance;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export function createTravelError(
  errorCode: keyof typeof TRAVEL_ERROR_CODES,
  context?: Record<string, any>,
  originalError?: Error
): TravelError {
  const handler = getTravelErrorHandler();
  return handler.createTravelError(errorCode, context, originalError);
}

export async function handleTravelError<T>(
  error: TravelError,
  recoveryStrategy?: ErrorRecoveryStrategy
): Promise<ApiResponse<T>> {
  const handler = getTravelErrorHandler();
  return await handler.handleTravelError<T>(error, recoveryStrategy);
}

export function updateServiceHealth(
  service: string,
  status: ServiceHealthStatus['status'],
  responseTime?: number
): void {
  const handler = getTravelErrorHandler();
  handler.updateServiceHealth(service, status, responseTime);
}

export function getServiceHealth(service: string): ServiceHealthStatus | undefined {
  const handler = getTravelErrorHandler();
  return handler.getServiceHealth(service);
}

export function isServiceHealthy(service: string): boolean {
  const handler = getTravelErrorHandler();
  return handler.isServiceHealthy(service);
}