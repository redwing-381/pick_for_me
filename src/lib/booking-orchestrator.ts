// Booking orchestration system for travel services
// Coordinates bookings across hotels, attractions, transportation, and restaurants

import { 
  Business, 
  BookingRequest, 
  BookingResponse, 
  BookingInfo, 
  ContactInfo,
  Location,
  TravelContext,
  ApiResponse
} from './types';
import { getYelpClient } from './yelp-client';

// =============================================================================
// TRAVEL BOOKING TYPES
// =============================================================================

export interface TravelBookingRequest {
  category: 'accommodation' | 'attraction' | 'transportation' | 'dining' | 'entertainment';
  business: Business;
  bookingDetails: BookingDetails;
  userContact: ContactInfo;
  travelContext?: TravelContext;
}

export interface BookingDetails {
  // Common fields
  date: string;
  partySize: number;
  specialRequests?: string;
  
  // Accommodation specific
  checkInDate?: string;
  checkOutDate?: string;
  roomType?: string;
  numberOfRooms?: number;
  
  // Transportation specific
  departureTime?: string;
  arrivalTime?: string;
  transportationType?: 'flight' | 'train' | 'bus' | 'car_rental' | 'taxi';
  
  // Attraction specific
  visitTime?: string;
  ticketType?: string;
  numberOfTickets?: number;
  
  // Dining specific (existing restaurant booking)
  preferredTime?: string;
}

export interface TravelBookingResponse {
  success: boolean;
  bookingId?: string;
  confirmationDetails?: TravelBookingConfirmation;
  error?: BookingError;
  alternativeOptions?: AlternativeBookingOption[];
  requiresManualBooking?: boolean;
  contactInfo?: {
    phone?: string;
    email?: string;
    website?: string;
  };
}

export interface TravelBookingConfirmation {
  bookingId: string;
  category: string;
  businessName: string;
  businessId: string;
  status: 'confirmed' | 'pending' | 'requires_confirmation';
  details: BookingDetails;
  userContact: ContactInfo;
  totalCost?: number;
  currency?: string;
  cancellationPolicy?: string;
  confirmationEmail?: boolean;
}

export interface AlternativeBookingOption {
  business: Business;
  availableSlots: string[];
  estimatedCost?: number;
  reason: string;
}

export interface BookingError {
  code: string;
  message: string;
  details?: string;
  retryable: boolean;
  category?: string;
}

// =============================================================================
// BOOKING ORCHESTRATOR CLASS
// =============================================================================

export class BookingOrchestrator {
  private yelpClient = getYelpClient();
  
  // =============================================================================
  // MAIN BOOKING COORDINATION
  // =============================================================================
  
  async coordinateBooking(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    try {
      console.log(`Coordinating ${request.category} booking for ${request.business.name}`);
      
      // Validate booking request
      const validation = this.validateBookingRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid booking request',
            details: validation.errors.join(', '),
            retryable: false,
            category: request.category
          }
        };
      }
      
      // Route to appropriate booking handler based on category
      switch (request.category) {
        case 'dining':
          return await this.handleRestaurantBooking(request);
        case 'accommodation':
          return await this.handleAccommodationBooking(request);
        case 'attraction':
          return await this.handleAttractionBooking(request);
        case 'transportation':
          return await this.handleTransportationBooking(request);
        case 'entertainment':
          return await this.handleEntertainmentBooking(request);
        default:
          return {
            success: false,
            error: {
              code: 'UNSUPPORTED_CATEGORY',
              message: `Booking category '${request.category}' is not supported`,
              retryable: false,
              category: request.category
            }
          };
      }
      
    } catch (error) {
      console.error('Booking orchestration error:', error);
      return {
        success: false,
        error: {
          code: 'ORCHESTRATION_ERROR',
          message: 'An unexpected error occurred during booking coordination',
          details: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
          category: request.category
        }
      };
    }
  }
  
  // =============================================================================
  // CATEGORY-SPECIFIC BOOKING HANDLERS
  // =============================================================================
  
  private async handleRestaurantBooking(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    try {
      // Convert to existing restaurant booking format
      const restaurantBookingRequest: BookingRequest = {
        business: request.business,
        partySize: request.bookingDetails.partySize,
        preferredTime: request.bookingDetails.preferredTime || '19:00',
        preferredDate: request.bookingDetails.date,
        userContact: request.userContact,
        specialRequests: request.bookingDetails.specialRequests
      };
      
      // Use existing restaurant booking logic
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restaurantBookingRequest)
      });
      
      const bookingResponse: BookingResponse = await response.json();
      
      if (bookingResponse.success && bookingResponse.bookingDetails) {
        return {
          success: true,
          bookingId: bookingResponse.confirmationId,
          confirmationDetails: {
            bookingId: bookingResponse.confirmationId!,
            category: 'dining',
            businessName: request.business.name,
            businessId: request.business.id,
            status: 'confirmed',
            details: request.bookingDetails,
            userContact: request.userContact,
            confirmationEmail: true
          }
        };
      } else {
        return {
          success: false,
          error: {
            code: bookingResponse.error?.code || 'RESTAURANT_BOOKING_FAILED',
            message: bookingResponse.error?.message || 'Restaurant booking failed',
            retryable: bookingResponse.error?.retryable || true,
            category: 'dining'
          },
          alternativeOptions: bookingResponse.alternativeTimes ? [{
            business: request.business,
            availableSlots: bookingResponse.alternativeTimes,
            reason: 'Alternative times available'
          }] : undefined,
          requiresManualBooking: bookingResponse.requiresPhoneCall,
          contactInfo: bookingResponse.phoneNumber ? { phone: bookingResponse.phoneNumber } : undefined
        };
      }
      
    } catch (error) {
      console.error('Restaurant booking error:', error);
      return {
        success: false,
        error: {
          code: 'RESTAURANT_BOOKING_ERROR',
          message: 'Failed to process restaurant booking',
          retryable: true,
          category: 'dining'
        }
      };
    }
  }
  
  private async handleAccommodationBooking(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    try {
      // Check if business supports online hotel booking
      const supportsOnlineBooking = request.business.transactions.includes('hotel_reservation') ||
                                   request.business.categories.some(cat => 
                                     ['hotels', 'bedandbreakfast', 'hostels'].includes(cat.alias)
                                   );
      
      if (!supportsOnlineBooking) {
        return {
          success: false,
          error: {
            code: 'NO_ONLINE_BOOKING',
            message: 'This accommodation requires manual booking',
            retryable: false,
            category: 'accommodation'
          },
          requiresManualBooking: true,
          contactInfo: {
            phone: request.business.display_phone || request.business.phone,
            website: request.business.url
          }
        };
      }
      
      // Simulate accommodation booking (in real implementation, integrate with hotel booking APIs)
      const bookingId = this.generateBookingId('HOTEL');
      
      return {
        success: true,
        bookingId,
        confirmationDetails: {
          bookingId,
          category: 'accommodation',
          businessName: request.business.name,
          businessId: request.business.id,
          status: 'confirmed',
          details: request.bookingDetails,
          userContact: request.userContact,
          totalCost: this.estimateAccommodationCost(request.bookingDetails),
          currency: 'USD',
          cancellationPolicy: 'Free cancellation up to 24 hours before check-in',
          confirmationEmail: true
        }
      };
      
    } catch (error) {
      console.error('Accommodation booking error:', error);
      return {
        success: false,
        error: {
          code: 'ACCOMMODATION_BOOKING_ERROR',
          message: 'Failed to process accommodation booking',
          retryable: true,
          category: 'accommodation'
        }
      };
    }
  }
  
  private async handleAttractionBooking(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    try {
      // Check if attraction supports ticket booking
      const supportsTicketBooking = request.business.transactions.includes('ticket_sales') ||
                                   request.business.categories.some(cat => 
                                     ['museums', 'tours', 'amusementparks', 'zoos'].includes(cat.alias)
                                   );
      
      if (!supportsTicketBooking) {
        return {
          success: false,
          error: {
            code: 'NO_TICKET_BOOKING',
            message: 'This attraction requires manual ticket purchase',
            retryable: false,
            category: 'attraction'
          },
          requiresManualBooking: true,
          contactInfo: {
            phone: request.business.display_phone || request.business.phone,
            website: request.business.url
          }
        };
      }
      
      // Simulate attraction booking
      const bookingId = this.generateBookingId('TICKET');
      
      return {
        success: true,
        bookingId,
        confirmationDetails: {
          bookingId,
          category: 'attraction',
          businessName: request.business.name,
          businessId: request.business.id,
          status: 'confirmed',
          details: request.bookingDetails,
          userContact: request.userContact,
          totalCost: this.estimateAttractionCost(request.bookingDetails),
          currency: 'USD',
          confirmationEmail: true
        }
      };
      
    } catch (error) {
      console.error('Attraction booking error:', error);
      return {
        success: false,
        error: {
          code: 'ATTRACTION_BOOKING_ERROR',
          message: 'Failed to process attraction booking',
          retryable: true,
          category: 'attraction'
        }
      };
    }
  }
  
  private async handleTransportationBooking(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    try {
      // Transportation bookings typically require external services
      return {
        success: false,
        error: {
          code: 'EXTERNAL_BOOKING_REQUIRED',
          message: 'Transportation bookings require external booking platforms',
          retryable: false,
          category: 'transportation'
        },
        requiresManualBooking: true,
        contactInfo: {
          website: this.getTransportationBookingUrl(request.bookingDetails.transportationType)
        }
      };
      
    } catch (error) {
      console.error('Transportation booking error:', error);
      return {
        success: false,
        error: {
          code: 'TRANSPORTATION_BOOKING_ERROR',
          message: 'Failed to process transportation booking',
          retryable: true,
          category: 'transportation'
        }
      };
    }
  }
  
  private async handleEntertainmentBooking(request: TravelBookingRequest): Promise<TravelBookingResponse> {
    try {
      // Check if entertainment venue supports booking
      const supportsBooking = request.business.transactions.includes('event_tickets') ||
                             request.business.categories.some(cat => 
                               ['theaters', 'musicvenues', 'comedyclubs'].includes(cat.alias)
                             );
      
      if (!supportsBooking) {
        return {
          success: false,
          error: {
            code: 'NO_EVENT_BOOKING',
            message: 'This venue requires manual ticket purchase',
            retryable: false,
            category: 'entertainment'
          },
          requiresManualBooking: true,
          contactInfo: {
            phone: request.business.display_phone || request.business.phone,
            website: request.business.url
          }
        };
      }
      
      // Simulate entertainment booking
      const bookingId = this.generateBookingId('EVENT');
      
      return {
        success: true,
        bookingId,
        confirmationDetails: {
          bookingId,
          category: 'entertainment',
          businessName: request.business.name,
          businessId: request.business.id,
          status: 'confirmed',
          details: request.bookingDetails,
          userContact: request.userContact,
          totalCost: this.estimateEntertainmentCost(request.bookingDetails),
          currency: 'USD',
          confirmationEmail: true
        }
      };
      
    } catch (error) {
      console.error('Entertainment booking error:', error);
      return {
        success: false,
        error: {
          code: 'ENTERTAINMENT_BOOKING_ERROR',
          message: 'Failed to process entertainment booking',
          retryable: true,
          category: 'entertainment'
        }
      };
    }
  }
  
  // =============================================================================
  // AVAILABILITY CHECKING
  // =============================================================================
  
  async checkAvailability(
    business: Business, 
    category: string, 
    details: BookingDetails
  ): Promise<ApiResponse<{ available: boolean; alternatives?: string[] }>> {
    try {
      switch (category) {
        case 'dining':
          return await this.checkRestaurantAvailability(business, details);
        case 'accommodation':
          return await this.checkAccommodationAvailability(business, details);
        case 'attraction':
          return await this.checkAttractionAvailability(business, details);
        case 'transportation':
          return await this.checkTransportationAvailability(business, details);
        case 'entertainment':
          return await this.checkEntertainmentAvailability(business, details);
        default:
          return {
            success: false,
            error: {
              message: `Availability checking not supported for category: ${category}`,
              code: 'UNSUPPORTED_CATEGORY'
            }
          };
      }
    } catch (error) {
      console.error('Availability check error:', error);
      return {
        success: false,
        error: {
          message: 'Failed to check availability',
          code: 'AVAILABILITY_CHECK_ERROR',
          details: error
        }
      };
    }
  }
  
  private async checkRestaurantAvailability(
    business: Business, 
    details: BookingDetails
  ): Promise<ApiResponse<{ available: boolean; alternatives?: string[] }>> {
    // Use existing restaurant availability logic
    const availabilityResult = await this.yelpClient.checkReservationAvailability({
      businessId: business.id,
      date: details.date,
      time: details.preferredTime || '19:00',
      partySize: details.partySize
    });
    
    if (availabilityResult.success) {
      const isAvailable = availabilityResult.data.available_times.includes(details.preferredTime || '19:00');
      return {
        success: true,
        data: {
          available: isAvailable,
          alternatives: isAvailable ? undefined : availabilityResult.data.available_times
        }
      };
    }
    
    return availabilityResult;
  }
  
  private async checkAccommodationAvailability(
    business: Business, 
    details: BookingDetails
  ): Promise<ApiResponse<{ available: boolean; alternatives?: string[] }>> {
    // Simulate accommodation availability check
    const isAvailable = Math.random() > 0.3; // 70% availability rate
    
    return {
      success: true,
      data: {
        available: isAvailable,
        alternatives: isAvailable ? undefined : this.generateAlternativeDates(details.date)
      }
    };
  }
  
  private async checkAttractionAvailability(
    business: Business, 
    details: BookingDetails
  ): Promise<ApiResponse<{ available: boolean; alternatives?: string[] }>> {
    // Most attractions have good availability
    const isAvailable = Math.random() > 0.1; // 90% availability rate
    
    return {
      success: true,
      data: {
        available: isAvailable,
        alternatives: isAvailable ? undefined : this.generateAlternativeTimes(details.visitTime || '10:00')
      }
    };
  }
  
  private async checkTransportationAvailability(
    business: Business, 
    details: BookingDetails
  ): Promise<ApiResponse<{ available: boolean; alternatives?: string[] }>> {
    // Transportation availability varies by type
    const isAvailable = Math.random() > 0.4; // 60% availability rate
    
    return {
      success: true,
      data: {
        available: isAvailable,
        alternatives: isAvailable ? undefined : this.generateAlternativeTimes(details.departureTime || '09:00')
      }
    };
  }
  
  private async checkEntertainmentAvailability(
    business: Business, 
    details: BookingDetails
  ): Promise<ApiResponse<{ available: boolean; alternatives?: string[] }>> {
    // Entertainment events have limited availability
    const isAvailable = Math.random() > 0.5; // 50% availability rate
    
    return {
      success: true,
      data: {
        available: isAvailable,
        alternatives: isAvailable ? undefined : this.generateAlternativeDates(details.date)
      }
    };
  }
  
  // =============================================================================
  // VALIDATION HELPERS
  // =============================================================================
  
  private validateBookingRequest(request: TravelBookingRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Validate business
    if (!request.business || !request.business.id) {
      errors.push('Valid business information is required');
    }
    
    // Validate booking details
    if (!request.bookingDetails) {
      errors.push('Booking details are required');
    } else {
      if (!request.bookingDetails.date) {
        errors.push('Booking date is required');
      }
      
      if (!request.bookingDetails.partySize || request.bookingDetails.partySize < 1) {
        errors.push('Valid party size is required');
      }
      
      // Category-specific validation
      switch (request.category) {
        case 'accommodation':
          if (!request.bookingDetails.checkInDate || !request.bookingDetails.checkOutDate) {
            errors.push('Check-in and check-out dates are required for accommodation');
          }
          break;
        case 'transportation':
          if (!request.bookingDetails.departureTime) {
            errors.push('Departure time is required for transportation');
          }
          break;
        case 'dining':
          if (!request.bookingDetails.preferredTime) {
            errors.push('Preferred time is required for dining reservations');
          }
          break;
      }
    }
    
    // Validate contact info
    if (!request.userContact || !request.userContact.name || !request.userContact.email) {
      errors.push('Valid contact information is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // =============================================================================
  // UTILITY HELPERS
  // =============================================================================
  
  private generateBookingId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`.toUpperCase();
  }
  
  private estimateAccommodationCost(details: BookingDetails): number {
    const baseRate = 150; // Base rate per night
    const nights = details.checkInDate && details.checkOutDate 
      ? Math.ceil((new Date(details.checkOutDate).getTime() - new Date(details.checkInDate).getTime()) / (1000 * 60 * 60 * 24))
      : 1;
    const rooms = details.numberOfRooms || 1;
    
    return baseRate * nights * rooms;
  }
  
  private estimateAttractionCost(details: BookingDetails): number {
    const baseTicketPrice = 25;
    const tickets = details.numberOfTickets || details.partySize;
    
    return baseTicketPrice * tickets;
  }
  
  private estimateEntertainmentCost(details: BookingDetails): number {
    const baseTicketPrice = 45;
    const tickets = details.numberOfTickets || details.partySize;
    
    return baseTicketPrice * tickets;
  }
  
  private generateAlternativeDates(originalDate: string, count: number = 3): string[] {
    const baseDate = new Date(originalDate);
    const alternatives: string[] = [];
    
    for (let i = 1; i <= count; i++) {
      const altDate = new Date(baseDate);
      altDate.setDate(altDate.getDate() + i);
      alternatives.push(altDate.toISOString().split('T')[0]);
    }
    
    return alternatives;
  }
  
  private generateAlternativeTimes(originalTime: string, count: number = 3): string[] {
    const [hours, minutes] = originalTime.split(':').map(Number);
    const alternatives: string[] = [];
    
    for (let i = 1; i <= count; i++) {
      const newHours = (hours + i) % 24;
      const timeString = `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      alternatives.push(timeString);
    }
    
    return alternatives;
  }
  
  private getTransportationBookingUrl(type?: string): string {
    switch (type) {
      case 'flight':
        return 'https://www.expedia.com/Flights';
      case 'train':
        return 'https://www.amtrak.com';
      case 'bus':
        return 'https://www.greyhound.com';
      case 'car_rental':
        return 'https://www.enterprise.com';
      default:
        return 'https://www.expedia.com';
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let bookingOrchestratorInstance: BookingOrchestrator | null = null;

export function getBookingOrchestrator(): BookingOrchestrator {
  if (!bookingOrchestratorInstance) {
    bookingOrchestratorInstance = new BookingOrchestrator();
  }
  return bookingOrchestratorInstance;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export async function coordinateTravelBooking(request: TravelBookingRequest): Promise<TravelBookingResponse> {
  const orchestrator = getBookingOrchestrator();
  return await orchestrator.coordinateBooking(request);
}

export async function checkTravelAvailability(
  business: Business, 
  category: string, 
  details: BookingDetails
): Promise<ApiResponse<{ available: boolean; alternatives?: string[] }>> {
  const orchestrator = getBookingOrchestrator();
  return await orchestrator.checkAvailability(business, category, details);
}