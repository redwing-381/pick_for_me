// Booking simulation utilities for testing comprehensive booking flows
// Integrates with the enhanced travel mock data system

import { travelMockData, simulateBooking, simulateError } from './travel-mock-data';
import type { ApiResponse } from './types';

// =============================================================================
// BOOKING SIMULATION TYPES
// =============================================================================

export interface BookingRequest {
  businessId: string;
  category: 'hotels' | 'attractions' | 'transportation' | 'dining' | 'accommodation' | 'attraction' | 'entertainment';
  bookingDetails: {
    date?: string;
    checkIn?: string;
    checkOut?: string;
    partySize?: number;
    guests?: number;
    passengers?: number;
    specialRequests?: string;
  };
  userContact: {
    name: string;
    email: string;
    phone: string;
  };
  scenario?: string; // Force specific booking scenario
}

export interface BookingResponse {
  success: boolean;
  confirmationId?: string;
  bookingDetails?: {
    businessName: string;
    category: string;
    date: string;
    totalCost: number;
    status: 'confirmed' | 'pending' | 'failed';
  };
  error?: {
    code: string;
    message: string;
    retryable: boolean;
    suggestedActions: string[];
  };
  alternativeOptions?: Array<{
    businessId: string;
    businessName: string;
    availability: string;
    price: number;
  }>;
  responseTime: number;
}

export interface MultiServiceBookingRequest {
  bookings: BookingRequest[];
  userContact: {
    name: string;
    email: string;
    phone: string;
  };
  coordinationPreferences?: {
    prioritizePrice: boolean;
    prioritizeLocation: boolean;
    allowPartialBooking: boolean;
  };
}

export interface MultiServiceBookingResponse {
  success: boolean;
  overallStatus: 'all_confirmed' | 'partial_confirmed' | 'all_failed';
  bookingResults: Array<{
    category: string;
    businessId: string;
    status: 'confirmed' | 'pending' | 'failed';
    confirmationId?: string;
    error?: string;
  }>;
  totalCost: number;
  coordinationId?: string;
  failedBookings?: Array<{
    category: string;
    businessId: string;
    error: string;
    alternatives: any[];
  }>;
  responseTime: number;
}

// =============================================================================
// BOOKING SIMULATION CLASS
// =============================================================================

export class BookingSimulator {
  private static instance: BookingSimulator;
  private bookingHistory: Array<{ request: BookingRequest; response: BookingResponse; timestamp: Date }> = [];
  private errorSimulationRate: number = 0.1; // 10% chance of errors by default

  private constructor() {}

  public static getInstance(): BookingSimulator {
    if (!BookingSimulator.instance) {
      BookingSimulator.instance = new BookingSimulator();
    }
    return BookingSimulator.instance;
  }

  // =============================================================================
  // SINGLE BOOKING SIMULATION
  // =============================================================================

  async simulateSingleBooking(request: BookingRequest): Promise<ApiResponse<BookingResponse>> {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validationError = this.validateBookingRequest(request);
      if (validationError) {
        return {
          success: false,
          error: {
            message: validationError,
            code: 'VALIDATION_ERROR',
            details: request
          }
        };
      }

      // Get business details
      const business = travelMockData.getBusinessById(request.businessId);
      if (!business) {
        return {
          success: false,
          error: {
            message: 'Business not found',
            code: 'BUSINESS_NOT_FOUND',
            details: { businessId: request.businessId }
          }
        };
      }

      // Simulate booking attempt
      const bookingResult = simulateBooking(request.businessId, request.scenario);
      const responseTime = Date.now() - startTime;

      let response: BookingResponse;

      if (bookingResult.success) {
        // Successful booking
        response = {
          success: true,
          confirmationId: bookingResult.confirmationId!,
          bookingDetails: {
            businessName: business.name,
            category: request.category,
            date: request.bookingDetails.date || request.bookingDetails.checkIn || new Date().toISOString(),
            totalCost: this.calculateBookingCost(business, request),
            status: 'confirmed'
          },
          responseTime: bookingResult.responseTime
        };
      } else {
        // Failed booking
        response = {
          success: false,
          error: {
            code: this.getErrorCode(bookingResult.error!),
            message: bookingResult.error!,
            retryable: this.isRetryableError(bookingResult.error!),
            suggestedActions: this.getSuggestedActions(bookingResult.error!)
          },
          alternativeOptions: bookingResult.alternativeOptions?.map(alt => ({
            businessId: alt.id,
            businessName: alt.name,
            availability: alt.availability,
            price: this.calculateBookingCost(business, request)
          })),
          responseTime: bookingResult.responseTime
        };
      }

      // Store in history
      this.bookingHistory.push({
        request,
        response,
        timestamp: new Date()
      });

      return {
        success: true,
        data: response
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown booking error',
          code: 'BOOKING_SYSTEM_ERROR',
          details: error
        }
      };
    }
  }

  // =============================================================================
  // MULTI-SERVICE BOOKING SIMULATION
  // =============================================================================

  async simulateMultiServiceBooking(request: MultiServiceBookingRequest): Promise<ApiResponse<MultiServiceBookingResponse>> {
    const startTime = Date.now();
    
    try {
      const bookingResults: MultiServiceBookingResponse['bookingResults'] = [];
      const failedBookings: MultiServiceBookingResponse['failedBookings'] = [];
      let totalCost = 0;
      let confirmedCount = 0;

      // Process each booking
      for (const booking of request.bookings) {
        const result = await this.simulateSingleBooking({
          ...booking,
          userContact: request.userContact
        });

        if (result.success && result.data.success) {
          // Successful booking
          bookingResults.push({
            category: booking.category,
            businessId: booking.businessId,
            status: 'confirmed',
            confirmationId: result.data.confirmationId
          });
          totalCost += result.data.bookingDetails?.totalCost || 0;
          confirmedCount++;
        } else {
          // Failed booking
          const errorMessage = result.success ? result.data.error?.message || 'Unknown error' : result.error?.message || 'System error';
          
          bookingResults.push({
            category: booking.category,
            businessId: booking.businessId,
            status: 'failed',
            error: errorMessage
          });

          failedBookings.push({
            category: booking.category,
            businessId: booking.businessId,
            error: errorMessage,
            alternatives: result.success ? result.data.alternativeOptions || [] : []
          });
        }

        // Add small delay between bookings to simulate real-world processing
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Determine overall status
      let overallStatus: MultiServiceBookingResponse['overallStatus'];
      if (confirmedCount === request.bookings.length) {
        overallStatus = 'all_confirmed';
      } else if (confirmedCount > 0) {
        overallStatus = 'partial_confirmed';
      } else {
        overallStatus = 'all_failed';
      }

      const response: MultiServiceBookingResponse = {
        success: overallStatus !== 'all_failed',
        overallStatus,
        bookingResults,
        totalCost,
        coordinationId: overallStatus !== 'all_failed' ? `COORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : undefined,
        failedBookings: failedBookings.length > 0 ? failedBookings : undefined,
        responseTime: Date.now() - startTime
      };

      return {
        success: true,
        data: response
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown multi-service booking error',
          code: 'MULTI_BOOKING_SYSTEM_ERROR',
          details: error
        }
      };
    }
  }

  // =============================================================================
  // AVAILABILITY CHECKING
  // =============================================================================

  async checkAvailability(businessId: string, date: string, partySize: number = 2): Promise<ApiResponse<{
    available: boolean;
    timeSlots: string[];
    pricing: { basePrice: number; totalPrice: number };
    restrictions?: string[];
  }>> {
    try {
      const business = travelMockData.getBusinessById(businessId);
      if (!business) {
        return {
          success: false,
          error: {
            message: 'Business not found',
            code: 'BUSINESS_NOT_FOUND'
          }
        };
      }

      const availabilityPattern = travelMockData.getAvailabilityPattern(businessId);
      if (!availabilityPattern) {
        return {
          success: false,
          error: {
            message: 'Availability information not found',
            code: 'AVAILABILITY_NOT_FOUND'
          }
        };
      }

      // Simulate availability check
      const isAvailable = Math.random() > 0.2; // 80% chance of availability
      const availableSlots = isAvailable ? 
        availabilityPattern.timeSlots.filter(() => Math.random() > 0.3) : // Some slots may be taken
        [];

      const basePrice = availabilityPattern.priceVariation.min + 
        (Math.random() * (availabilityPattern.priceVariation.max - availabilityPattern.priceVariation.min));
      
      const totalPrice = basePrice * partySize * availabilityPattern.seasonalMultiplier;

      return {
        success: true,
        data: {
          available: isAvailable,
          timeSlots: availableSlots,
          pricing: {
            basePrice: Math.round(basePrice),
            totalPrice: Math.round(totalPrice)
          },
          restrictions: isAvailable ? undefined : ['Fully booked for selected date', 'Try alternative dates']
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Availability check failed',
          code: 'AVAILABILITY_CHECK_ERROR',
          details: error
        }
      };
    }
  }

  // =============================================================================
  // ERROR SIMULATION
  // =============================================================================

  simulateRandomError(): { error: string; code: string; retryable: boolean } {
    const errorConditions = [
      'network_timeout',
      'server_overload', 
      'payment_failed',
      'fully_booked',
      'invalid_request',
      'system_error'
    ];
    
    const condition = errorConditions[Math.floor(Math.random() * errorConditions.length)];
    return simulateError(condition);
  }

  setErrorSimulationRate(rate: number): void {
    this.errorSimulationRate = Math.max(0, Math.min(1, rate));
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private validateBookingRequest(request: BookingRequest): string | null {
    if (!request.businessId) {
      return 'Business ID is required';
    }

    if (!request.userContact.name || !request.userContact.email) {
      return 'User contact information is incomplete';
    }

    if (!request.bookingDetails.date && !request.bookingDetails.checkIn) {
      return 'Booking date is required';
    }

    // Category-specific validation
    switch (request.category) {
      case 'hotels':
        if (!request.bookingDetails.checkIn || !request.bookingDetails.checkOut) {
          return 'Check-in and check-out dates are required for hotel bookings';
        }
        break;
      case 'attractions':
        if (!request.bookingDetails.partySize) {
          return 'Party size is required for attraction bookings';
        }
        break;
      case 'transportation':
        if (!request.bookingDetails.passengers) {
          return 'Number of passengers is required for transportation bookings';
        }
        break;
      case 'dining':
        if (!request.bookingDetails.partySize) {
          return 'Party size is required for restaurant reservations';
        }
        break;
    }

    return null;
  }

  private calculateBookingCost(business: any, request: BookingRequest): number {
    let baseCost = 0;
    
    // Get base cost from business
    if (business.pricePerNight) {
      baseCost = business.pricePerNight;
    } else if (business.ticketPrice) {
      baseCost = business.ticketPrice;
    } else if (business.farePrice) {
      baseCost = business.farePrice;
    } else {
      // Estimate based on price range
      const priceMap: Record<string, number> = {
        '$': 25,
        '$$': 50,
        '$$$': 100,
        '$$$$': 200
      };
      baseCost = priceMap[business.price] || 50;
    }

    // Apply multipliers based on booking details
    let multiplier = 1;
    
    if (request.bookingDetails.partySize) {
      multiplier *= request.bookingDetails.partySize;
    }
    
    if (request.bookingDetails.guests) {
      multiplier *= request.bookingDetails.guests;
    }
    
    if (request.bookingDetails.passengers) {
      multiplier *= request.bookingDetails.passengers;
    }

    // Calculate nights for hotels
    if (request.category === 'hotels' && request.bookingDetails.checkIn && request.bookingDetails.checkOut) {
      const checkIn = new Date(request.bookingDetails.checkIn);
      const checkOut = new Date(request.bookingDetails.checkOut);
      const nights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
      multiplier *= nights;
    }

    return Math.round(baseCost * multiplier);
  }

  private getErrorCode(errorMessage: string): string {
    if (errorMessage.includes('payment')) return 'PAYMENT_FAILED';
    if (errorMessage.includes('booked') || errorMessage.includes('availability')) return 'FULLY_BOOKED';
    if (errorMessage.includes('system') || errorMessage.includes('unavailable')) return 'SYSTEM_ERROR';
    if (errorMessage.includes('invalid') || errorMessage.includes('date')) return 'INVALID_REQUEST';
    return 'BOOKING_FAILED';
  }

  private isRetryableError(errorMessage: string): boolean {
    const retryableErrors = ['system', 'network', 'timeout', 'overload'];
    return retryableErrors.some(error => errorMessage.toLowerCase().includes(error));
  }

  private getSuggestedActions(errorMessage: string): string[] {
    if (errorMessage.includes('payment')) {
      return ['Check payment information', 'Try different payment method', 'Contact support'];
    }
    if (errorMessage.includes('booked') || errorMessage.includes('availability')) {
      return ['Try different dates', 'View alternative options', 'Join waitlist'];
    }
    if (errorMessage.includes('system')) {
      return ['Try again later', 'Contact support', 'Use alternative booking method'];
    }
    if (errorMessage.includes('invalid') || errorMessage.includes('date')) {
      return ['Check booking details', 'Select valid dates', 'Contact venue directly'];
    }
    return ['Try again', 'Contact support', 'View alternatives'];
  }

  // =============================================================================
  // ANALYTICS AND REPORTING
  // =============================================================================

  getBookingHistory(): Array<{ request: BookingRequest; response: BookingResponse; timestamp: Date }> {
    return [...this.bookingHistory];
  }

  getBookingStats(): {
    totalBookings: number;
    successRate: number;
    averageResponseTime: number;
    errorBreakdown: Record<string, number>;
    categoryBreakdown: Record<string, number>;
  } {
    const total = this.bookingHistory.length;
    const successful = this.bookingHistory.filter(h => h.response.success).length;
    const avgResponseTime = this.bookingHistory.reduce((sum, h) => sum + h.response.responseTime, 0) / total;
    
    const errorBreakdown: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};
    
    this.bookingHistory.forEach(history => {
      // Count categories
      categoryBreakdown[history.request.category] = (categoryBreakdown[history.request.category] || 0) + 1;
      
      // Count errors
      if (!history.response.success && history.response.error) {
        const errorCode = history.response.error.code;
        errorBreakdown[errorCode] = (errorBreakdown[errorCode] || 0) + 1;
      }
    });

    return {
      totalBookings: total,
      successRate: total > 0 ? successful / total : 0,
      averageResponseTime: avgResponseTime || 0,
      errorBreakdown,
      categoryBreakdown
    };
  }

  clearHistory(): void {
    this.bookingHistory = [];
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const bookingSimulator = BookingSimulator.getInstance();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export async function simulateSingleBooking(request: BookingRequest): Promise<ApiResponse<BookingResponse>> {
  return bookingSimulator.simulateSingleBooking(request);
}

export async function simulateMultiServiceBooking(request: MultiServiceBookingRequest): Promise<ApiResponse<MultiServiceBookingResponse>> {
  return bookingSimulator.simulateMultiServiceBooking(request);
}

export async function checkBookingAvailability(businessId: string, date: string, partySize?: number) {
  return bookingSimulator.checkAvailability(businessId, date, partySize);
}

export function getBookingStats() {
  return bookingSimulator.getBookingStats();
}