import { NextRequest, NextResponse } from 'next/server';
import { getBookingOrchestrator, TravelBookingRequest } from '@/lib/booking-orchestrator';
import { isValidBusiness, isValidContactInfo } from '@/lib/type-guards';

// =============================================================================
// HOTEL BOOKING API ROUTE
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request structure
    const validation = validateHotelBookingRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid hotel booking request',
            details: validation.errors
          }
        },
        { status: 400 }
      );
    }

    // Convert to travel booking request
    const travelBookingRequest: TravelBookingRequest = {
      category: 'accommodation',
      business: body.business,
      bookingDetails: {
        date: body.checkInDate,
        partySize: body.numberOfGuests || 2,
        checkInDate: body.checkInDate,
        checkOutDate: body.checkOutDate,
        roomType: body.roomType,
        numberOfRooms: body.numberOfRooms || 1,
        specialRequests: body.specialRequests
      },
      userContact: body.userContact,
      travelContext: body.travelContext
    };

    // Process booking through orchestrator
    const orchestrator = getBookingOrchestrator();
    const result = await orchestrator.coordinateBooking(travelBookingRequest);

    if (result.success) {
      console.log(`Hotel booking confirmed: ${result.bookingId} at ${body.business.name}`);
      return NextResponse.json(result);
    } else {
      console.log(`Hotel booking failed for ${body.business.name}: ${result.error?.message}`);
      return NextResponse.json(result, { status: result.error?.retryable ? 503 : 400 });
    }

  } catch (error) {
    console.error('Hotel booking API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'HOTEL_BOOKING_ERROR',
          message: 'An unexpected error occurred while processing hotel booking',
          retryable: true
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get('booking_id');
  
  if (bookingId) {
    // Return booking status (mock implementation)
    return NextResponse.json({
      success: true,
      booking: {
        bookingId,
        status: 'confirmed',
        category: 'accommodation',
        message: 'Your hotel reservation is confirmed'
      }
    });
  }
  
  // Return API documentation
  return NextResponse.json({
    endpoint: '/api/booking/hotels',
    description: 'Hotel and accommodation booking API',
    methods: {
      POST: {
        description: 'Create a new hotel reservation',
        required_fields: {
          business: 'Business - Hotel information',
          checkInDate: 'string - Check-in date (YYYY-MM-DD)',
          checkOutDate: 'string - Check-out date (YYYY-MM-DD)',
          numberOfGuests: 'number - Number of guests',
          userContact: 'ContactInfo - Guest contact information'
        },
        optional_fields: {
          roomType: 'string - Preferred room type',
          numberOfRooms: 'number - Number of rooms (default: 1)',
          specialRequests: 'string - Special requests or preferences',
          travelContext: 'TravelContext - Additional travel information'
        }
      },
      GET: {
        description: 'Check hotel booking status',
        query_parameters: {
          booking_id: 'string - Hotel booking ID to check status'
        }
      }
    },
    example_request: {
      business: {
        id: "hotel-business-id",
        name: "Hotel Name",
        phone: "+1234567890"
      },
      checkInDate: "2024-12-25",
      checkOutDate: "2024-12-27",
      numberOfGuests: 2,
      numberOfRooms: 1,
      roomType: "Standard Double",
      userContact: {
        name: "John Doe",
        phone: "+1234567890",
        email: "john@example.com"
      },
      specialRequests: "High floor room with city view"
    }
  });
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

function validateHotelBookingRequest(request: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate business
  if (!request.business || !isValidBusiness(request.business)) {
    errors.push('Valid hotel business information is required');
  }

  // Validate dates
  if (!request.checkInDate || typeof request.checkInDate !== 'string') {
    errors.push('Check-in date is required (YYYY-MM-DD format)');
  }

  if (!request.checkOutDate || typeof request.checkOutDate !== 'string') {
    errors.push('Check-out date is required (YYYY-MM-DD format)');
  }

  // Validate date logic
  if (request.checkInDate && request.checkOutDate) {
    const checkIn = new Date(request.checkInDate);
    const checkOut = new Date(request.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      errors.push('Check-in date cannot be in the past');
    }

    if (checkOut <= checkIn) {
      errors.push('Check-out date must be after check-in date');
    }

    const daysDifference = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference > 30) {
      errors.push('Hotel stays cannot exceed 30 days');
    }
  }

  // Validate guests
  if (!request.numberOfGuests || typeof request.numberOfGuests !== 'number' || request.numberOfGuests < 1 || request.numberOfGuests > 10) {
    errors.push('Number of guests must be between 1 and 10');
  }

  // Validate rooms
  if (request.numberOfRooms && (typeof request.numberOfRooms !== 'number' || request.numberOfRooms < 1 || request.numberOfRooms > 5)) {
    errors.push('Number of rooms must be between 1 and 5');
  }

  // Validate contact info
  if (!request.userContact || !isValidContactInfo(request.userContact)) {
    errors.push('Valid contact information (name, phone, email) is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}