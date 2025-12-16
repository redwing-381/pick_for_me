import { NextRequest, NextResponse } from 'next/server';
import { 
  BookingRequest, 
  BookingResponse, 
  BookingInfo, 
  Business, 
  ContactInfo,
  ApiResponse 
} from '@/lib/types';
import { getYelpClient } from '@/lib/yelp-client';
import { isValidContactInfo, isValidBusiness } from '@/lib/type-guards';

// =============================================================================
// BOOKING VALIDATION HELPERS
// =============================================================================

function validateBookingRequest(request: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate business
  if (!request.business || !isValidBusiness(request.business)) {
    errors.push('Valid business information is required');
  }

  // Validate party size
  if (!request.partySize || typeof request.partySize !== 'number' || request.partySize < 1 || request.partySize > 20) {
    errors.push('Party size must be between 1 and 20 people');
  }

  // Validate preferred time
  if (!request.preferredTime || typeof request.preferredTime !== 'string') {
    errors.push('Preferred time is required');
  } else {
    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(request.preferredTime)) {
      errors.push('Preferred time must be in HH:MM format');
    }
  }

  // Validate preferred date
  if (!request.preferredDate || typeof request.preferredDate !== 'string') {
    errors.push('Preferred date is required');
  } else {
    // Validate date format (YYYY-MM-DD) and ensure it's not in the past
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(request.preferredDate)) {
      errors.push('Preferred date must be in YYYY-MM-DD format');
    } else {
      const requestedDate = new Date(request.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (requestedDate < today) {
        errors.push('Preferred date cannot be in the past');
      }
    }
  }

  // Validate user contact information
  if (!request.userContact || !isValidContactInfo(request.userContact)) {
    errors.push('Valid contact information (name, phone, email) is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function generateConfirmationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `PFM_${timestamp}_${random}`.toUpperCase();
}

// =============================================================================
// BOOKING LOGIC
// =============================================================================

async function checkAvailability(
  business: Business, 
  date: string, 
  time: string, 
  partySize: number
): Promise<ApiResponse<{ available_times: string[]; booking_url?: string }>> {
  try {
    const yelpClient = getYelpClient();
    
    // Check if business supports online reservations
    if (!business.reservationUrl && !business.transactions.includes('restaurant_reservation')) {
      return {
        success: false,
        error: {
          message: 'This restaurant does not support online reservations',
          code: 'NO_ONLINE_RESERVATIONS'
        }
      };
    }

    // Call Yelp Reservations API to check availability
    const availabilityResult = await yelpClient.checkReservationAvailability({
      businessId: business.id,
      date,
      time,
      partySize
    });

    return availabilityResult;
  } catch (error) {
    console.error('Error checking availability:', error);
    return {
      success: false,
      error: {
        message: 'Unable to check availability at this time',
        code: 'AVAILABILITY_CHECK_FAILED',
        details: error
      }
    };
  }
}

async function attemptBooking(
  business: Business,
  date: string,
  time: string,
  partySize: number,
  userContact: ContactInfo,
  specialRequests?: string
): Promise<ApiResponse<{ confirmation_id: string; status: 'confirmed' | 'pending' }>> {
  try {
    const yelpClient = getYelpClient();
    
    // Attempt to make the reservation through Yelp
    const bookingResult = await yelpClient.makeReservation({
      businessId: business.id,
      date,
      time,
      partySize,
      customerName: userContact.name,
      customerPhone: userContact.phone,
      customerEmail: userContact.email
    });

    return bookingResult;
  } catch (error) {
    console.error('Error making reservation:', error);
    return {
      success: false,
      error: {
        message: 'Unable to complete booking at this time',
        code: 'BOOKING_FAILED',
        details: error
      }
    };
  }
}

function generateAlternativeTimes(requestedTime: string): string[] {
  const [hours, minutes] = requestedTime.split(':').map(Number);
  const alternatives: string[] = [];
  
  // Generate times 30 minutes before and after
  for (let offset = -60; offset <= 60; offset += 30) {
    if (offset === 0) continue; // Skip the original time
    
    const newMinutes = minutes + offset;
    const newHours = hours + Math.floor(newMinutes / 60);
    const finalMinutes = ((newMinutes % 60) + 60) % 60;
    const finalHours = ((newHours % 24) + 24) % 24;
    
    // Only suggest reasonable dining hours (11:00 - 22:00)
    if (finalHours >= 11 && finalHours <= 22) {
      const timeString = `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
      alternatives.push(timeString);
    }
  }
  
  return alternatives.sort();
}

// =============================================================================
// API ROUTE HANDLERS
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the booking request
    const validation = validateBookingRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            message: 'Invalid booking request',
            details: validation.errors
          }
        },
        { status: 400 }
      );
    }

    const bookingRequest: BookingRequest = body;
    const { business, partySize, preferredTime, preferredDate, userContact, specialRequests } = bookingRequest;

    // Step 1: Check availability
    console.log(`Checking availability for ${business.name} on ${preferredDate} at ${preferredTime}`);
    
    const availabilityResult = await checkAvailability(business, preferredDate, preferredTime, partySize);
    
    if (!availabilityResult.success) {
      // Handle case where restaurant doesn't support online reservations
      if (availabilityResult.error?.code === 'NO_ONLINE_RESERVATIONS') {
        const response: BookingResponse = {
          success: false,
          error: {
            code: 'NO_ONLINE_RESERVATIONS',
            message: 'This restaurant requires phone reservations',
            details: 'Please call the restaurant directly to make a reservation',
            retryable: false
          },
          requiresPhoneCall: true,
          phoneNumber: business.display_phone || business.phone
        };
        
        return NextResponse.json(response);
      }
      
      // Other availability check failures
      const response: BookingResponse = {
        success: false,
        error: {
          code: availabilityResult.error?.code || 'AVAILABILITY_ERROR',
          message: availabilityResult.error?.message || 'Unable to check availability',
          retryable: true
        }
      };
      
      return NextResponse.json(response, { status: 503 });
    }

    // Step 2: Check if requested time is available
    const availableTimes = availabilityResult.data.available_times;
    const isTimeAvailable = availableTimes.includes(preferredTime);
    
    if (!isTimeAvailable) {
      // Offer alternative times
      const alternativeTimes = availableTimes.length > 0 
        ? availableTimes 
        : generateAlternativeTimes(preferredTime);
      
      const response: BookingResponse = {
        success: false,
        error: {
          code: 'TIME_UNAVAILABLE',
          message: `The requested time ${preferredTime} is not available`,
          details: 'Alternative times are suggested',
          retryable: true
        },
        alternativeTimes: alternativeTimes.slice(0, 5) // Limit to 5 alternatives
      };
      
      return NextResponse.json(response);
    }

    // Step 3: Attempt to make the booking
    console.log(`Attempting to book ${business.name} for ${partySize} people on ${preferredDate} at ${preferredTime}`);
    
    const bookingResult = await attemptBooking(
      business, 
      preferredDate, 
      preferredTime, 
      partySize, 
      userContact, 
      specialRequests
    );
    
    if (!bookingResult.success) {
      // Booking failed, offer alternatives
      const alternativeTimes = generateAlternativeTimes(preferredTime);
      
      const response: BookingResponse = {
        success: false,
        error: {
          code: bookingResult.error?.code || 'BOOKING_FAILED',
          message: bookingResult.error?.message || 'Unable to complete booking',
          details: 'Please try an alternative time or contact the restaurant directly',
          retryable: true
        },
        alternativeTimes: alternativeTimes.slice(0, 3),
        requiresPhoneCall: true,
        phoneNumber: business.display_phone || business.phone
      };
      
      return NextResponse.json(response);
    }

    // Step 4: Booking successful!
    const confirmationId = bookingResult.data.confirmation_id;
    
    const bookingInfo: BookingInfo = {
      confirmationId,
      restaurantName: business.name,
      restaurantId: business.id,
      date: preferredDate,
      time: preferredTime,
      partySize,
      status: bookingResult.data.status === 'confirmed' ? 'confirmed' : 'confirmed',
      userContact,
      specialRequests
    };

    const response: BookingResponse = {
      success: true,
      confirmationId,
      bookingDetails: bookingInfo
    };

    console.log(`Booking confirmed for ${business.name}: ${confirmationId}`);
    
    return NextResponse.json(response);

  } catch (error) {
    console.error('Booking API error:', error);
    
    // Determine error type and provide appropriate response
    let errorCode = 'BOOKING_ERROR';
    let statusCode = 500;
    let userMessage = 'An unexpected error occurred while processing your booking';
    let retryable = true;

    if (error instanceof SyntaxError) {
      errorCode = 'VALIDATION_ERROR';
      statusCode = 400;
      userMessage = 'Invalid booking request format';
      retryable = false;
    } else if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as any;
      if (apiError.status === 429) {
        errorCode = 'RATE_LIMIT_ERROR';
        statusCode = 429;
        userMessage = 'Too many booking requests. Please wait a moment and try again.';
        retryable = true;
      } else if (apiError.status === 401) {
        errorCode = 'AUTHENTICATION_ERROR';
        statusCode = 401;
        userMessage = 'Authentication failed. Please try again.';
        retryable = false;
      } else if (apiError.status === 404) {
        errorCode = 'NOT_FOUND_ERROR';
        statusCode = 404;
        userMessage = 'Restaurant not found or no longer available for booking.';
        retryable = false;
      } else if (apiError.status >= 500) {
        errorCode = 'SERVER_ERROR';
        statusCode = 503;
        userMessage = 'Booking service temporarily unavailable. Please try again.';
        retryable = true;
      }
    } else if (error instanceof Error && error.message.includes('fetch')) {
      errorCode = 'NETWORK_ERROR';
      statusCode = 503;
      userMessage = 'Network error. Please check your connection and try again.';
      retryable = true;
    } else if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      errorCode = 'TIMEOUT_ERROR';
      statusCode = 408;
      userMessage = 'Booking request timed out. Please try again.';
      retryable = true;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: errorCode,
          message: userMessage,
          retryable,
          timestamp: new Date().toISOString(),
          details: process.env.NODE_ENV === 'development' ? error : undefined
        }
      },
      { status: statusCode }
    );
  }
}

// Handle GET requests for API documentation and booking status checks
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const confirmationId = searchParams.get('confirmation_id');
  
  // If confirmation ID is provided, return booking status
  if (confirmationId) {
    // In a real implementation, this would query the booking database
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      booking: {
        confirmationId,
        status: 'confirmed',
        message: 'Your reservation is confirmed'
      }
    });
  }
  
  // Otherwise, return API documentation
  return NextResponse.json({
    endpoint: '/api/booking',
    methods: {
      POST: {
        description: 'Create a new restaurant reservation',
        required_fields: {
          business: 'Business - Restaurant information',
          partySize: 'number - Number of people (1-20)',
          preferredTime: 'string - Time in HH:MM format',
          preferredDate: 'string - Date in YYYY-MM-DD format',
          userContact: 'ContactInfo - Customer contact information'
        },
        optional_fields: {
          specialRequests: 'string - Special requests or notes'
        },
        response_format: {
          success: 'boolean',
          confirmationId: 'string (if successful)',
          bookingDetails: 'BookingInfo (if successful)',
          error: 'BookingError (if failed)',
          alternativeTimes: 'string[] (if time unavailable)',
          requiresPhoneCall: 'boolean (if manual booking needed)',
          phoneNumber: 'string (if manual booking needed)'
        }
      },
      GET: {
        description: 'Check booking status or get API documentation',
        query_parameters: {
          confirmation_id: 'string - Booking confirmation ID to check status'
        }
      }
    },
    example_request: {
      business: {
        id: "yelp-business-id",
        name: "Restaurant Name",
        phone: "+1234567890"
      },
      partySize: 4,
      preferredTime: "19:00",
      preferredDate: "2024-12-20",
      userContact: {
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com"
      },
      specialRequests: "Window table if possible"
    }
  });
}

// Handle PUT requests for booking modifications
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { confirmationId, modifications } = body;
    
    if (!confirmationId) {
      return NextResponse.json(
        { error: 'Confirmation ID is required for modifications' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would update the booking
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      message: 'Booking modification request received',
      confirmationId,
      status: 'modification_pending'
    });
    
  } catch (error) {
    console.error('Booking modification error:', error);
    return NextResponse.json(
      { error: 'Failed to process booking modification' },
      { status: 500 }
    );
  }
}

// Handle DELETE requests for booking cancellations
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const confirmationId = searchParams.get('confirmation_id');
    
    if (!confirmationId) {
      return NextResponse.json(
        { error: 'Confirmation ID is required for cancellation' },
        { status: 400 }
      );
    }
    
    // In a real implementation, this would cancel the booking
    // For now, return a mock response
    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      confirmationId,
      status: 'cancelled'
    });
    
  } catch (error) {
    console.error('Booking cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}