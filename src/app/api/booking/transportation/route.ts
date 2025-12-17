import { NextRequest, NextResponse } from 'next/server';
import { getBookingOrchestrator, TravelBookingRequest } from '@/lib/booking-orchestrator';
import { isValidBusiness, isValidContactInfo } from '@/lib/type-guards';

// =============================================================================
// TRANSPORTATION BOOKING API ROUTE
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request structure
    const validation = validateTransportationBookingRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid transportation booking request',
            details: validation.errors
          }
        },
        { status: 400 }
      );
    }

    // Convert to travel booking request
    const travelBookingRequest: TravelBookingRequest = {
      category: 'transportation',
      business: body.business,
      bookingDetails: {
        date: body.travelDate,
        partySize: body.numberOfPassengers,
        departureTime: body.departureTime,
        arrivalTime: body.arrivalTime,
        transportationType: body.transportationType,
        specialRequests: body.specialRequests
      },
      userContact: body.userContact,
      travelContext: body.travelContext
    };

    // Process booking through orchestrator
    const orchestrator = getBookingOrchestrator();
    const result = await orchestrator.coordinateBooking(travelBookingRequest);

    if (result.success) {
      console.log(`Transportation booking confirmed: ${result.bookingId} for ${body.transportationType}`);
      return NextResponse.json(result);
    } else {
      console.log(`Transportation booking failed for ${body.transportationType}: ${result.error?.message}`);
      return NextResponse.json(result, { status: result.error?.retryable ? 503 : 400 });
    }

  } catch (error) {
    console.error('Transportation booking API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'TRANSPORTATION_BOOKING_ERROR',
          message: 'An unexpected error occurred while processing transportation booking',
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
        category: 'transportation',
        message: 'Your transportation booking is confirmed'
      }
    });
  }
  
  // Return API documentation
  return NextResponse.json({
    endpoint: '/api/booking/transportation',
    description: 'Transportation booking API',
    methods: {
      POST: {
        description: 'Book transportation services',
        required_fields: {
          business: 'Business - Transportation provider information',
          travelDate: 'string - Travel date (YYYY-MM-DD)',
          departureTime: 'string - Departure time (HH:MM)',
          numberOfPassengers: 'number - Number of passengers',
          transportationType: 'string - Type of transport (flight, train, bus, car_rental, taxi)',
          userContact: 'ContactInfo - Passenger contact information'
        },
        optional_fields: {
          arrivalTime: 'string - Expected arrival time (HH:MM)',
          specialRequests: 'string - Special requests or accessibility needs',
          travelContext: 'TravelContext - Additional travel information'
        }
      },
      GET: {
        description: 'Check transportation booking status',
        query_parameters: {
          booking_id: 'string - Transportation booking ID to check status'
        }
      }
    },
    example_request: {
      business: {
        id: "transport-business-id",
        name: "City Airport Shuttle",
        phone: "+1234567890"
      },
      travelDate: "2024-12-25",
      departureTime: "08:00",
      arrivalTime: "09:30",
      numberOfPassengers: 2,
      transportationType: "bus",
      userContact: {
        name: "Mike Johnson",
        phone: "+1234567890",
        email: "mike@example.com"
      },
      specialRequests: "Wheelchair accessible vehicle"
    }
  });
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

function validateTransportationBookingRequest(request: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate business
  if (!request.business || !isValidBusiness(request.business)) {
    errors.push('Valid transportation provider information is required');
  }

  // Validate travel date
  if (!request.travelDate || typeof request.travelDate !== 'string') {
    errors.push('Travel date is required (YYYY-MM-DD format)');
  } else {
    const travelDate = new Date(request.travelDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (travelDate < today) {
      errors.push('Travel date cannot be in the past');
    }

    // Check if date is more than 1 year in the future
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (travelDate > maxDate) {
      errors.push('Travel date cannot be more than 1 year in the future');
    }
  }

  // Validate departure time
  if (!request.departureTime || typeof request.departureTime !== 'string') {
    errors.push('Departure time is required (HH:MM format)');
  } else {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(request.departureTime)) {
      errors.push('Departure time must be in HH:MM format');
    }
  }

  // Validate arrival time (if provided)
  if (request.arrivalTime && typeof request.arrivalTime === 'string') {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(request.arrivalTime)) {
      errors.push('Arrival time must be in HH:MM format');
    }
  }

  // Validate number of passengers
  if (!request.numberOfPassengers || typeof request.numberOfPassengers !== 'number' || request.numberOfPassengers < 1 || request.numberOfPassengers > 20) {
    errors.push('Number of passengers must be between 1 and 20');
  }

  // Validate transportation type
  const validTypes = ['flight', 'train', 'bus', 'car_rental', 'taxi'];
  if (!request.transportationType || !validTypes.includes(request.transportationType)) {
    errors.push(`Transportation type must be one of: ${validTypes.join(', ')}`);
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