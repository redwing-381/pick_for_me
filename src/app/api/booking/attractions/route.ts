import { NextRequest, NextResponse } from 'next/server';
import { getBookingOrchestrator, TravelBookingRequest } from '@/lib/booking-orchestrator';
import { isValidBusiness, isValidContactInfo } from '@/lib/type-guards';

// =============================================================================
// ATTRACTION BOOKING API ROUTE
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request structure
    const validation = validateAttractionBookingRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid attraction booking request',
            details: validation.errors
          }
        },
        { status: 400 }
      );
    }

    // Convert to travel booking request
    const travelBookingRequest: TravelBookingRequest = {
      category: 'attraction',
      business: body.business,
      bookingDetails: {
        date: body.visitDate,
        partySize: body.numberOfTickets || body.numberOfVisitors,
        visitTime: body.visitTime,
        ticketType: body.ticketType,
        numberOfTickets: body.numberOfTickets,
        specialRequests: body.specialRequests
      },
      userContact: body.userContact,
      travelContext: body.travelContext
    };

    // Process booking through orchestrator
    const orchestrator = getBookingOrchestrator();
    const result = await orchestrator.coordinateBooking(travelBookingRequest);

    if (result.success) {
      console.log(`Attraction booking confirmed: ${result.bookingId} at ${body.business.name}`);
      return NextResponse.json(result);
    } else {
      console.log(`Attraction booking failed for ${body.business.name}: ${result.error?.message}`);
      return NextResponse.json(result, { status: result.error?.retryable ? 503 : 400 });
    }

  } catch (error) {
    console.error('Attraction booking API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'ATTRACTION_BOOKING_ERROR',
          message: 'An unexpected error occurred while processing attraction booking',
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
        category: 'attraction',
        message: 'Your attraction tickets are confirmed'
      }
    });
  }
  
  // Return API documentation
  return NextResponse.json({
    endpoint: '/api/booking/attractions',
    description: 'Attraction and ticket booking API',
    methods: {
      POST: {
        description: 'Purchase attraction tickets',
        required_fields: {
          business: 'Business - Attraction information',
          visitDate: 'string - Visit date (YYYY-MM-DD)',
          numberOfVisitors: 'number - Number of visitors',
          userContact: 'ContactInfo - Visitor contact information'
        },
        optional_fields: {
          visitTime: 'string - Preferred visit time (HH:MM)',
          ticketType: 'string - Type of ticket (adult, child, senior, etc.)',
          numberOfTickets: 'number - Number of tickets (defaults to numberOfVisitors)',
          specialRequests: 'string - Special requests or accessibility needs',
          travelContext: 'TravelContext - Additional travel information'
        }
      },
      GET: {
        description: 'Check attraction booking status',
        query_parameters: {
          booking_id: 'string - Attraction booking ID to check status'
        }
      }
    },
    example_request: {
      business: {
        id: "attraction-business-id",
        name: "Museum of Science",
        phone: "+1234567890"
      },
      visitDate: "2024-12-25",
      visitTime: "10:00",
      numberOfVisitors: 4,
      numberOfTickets: 4,
      ticketType: "General Admission",
      userContact: {
        name: "Jane Smith",
        phone: "+1234567890",
        email: "jane@example.com"
      },
      specialRequests: "Wheelchair accessible entrance"
    }
  });
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

function validateAttractionBookingRequest(request: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate business
  if (!request.business || !isValidBusiness(request.business)) {
    errors.push('Valid attraction business information is required');
  }

  // Validate visit date
  if (!request.visitDate || typeof request.visitDate !== 'string') {
    errors.push('Visit date is required (YYYY-MM-DD format)');
  } else {
    const visitDate = new Date(request.visitDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (visitDate < today) {
      errors.push('Visit date cannot be in the past');
    }

    // Check if date is more than 1 year in the future
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 1);
    if (visitDate > maxDate) {
      errors.push('Visit date cannot be more than 1 year in the future');
    }
  }

  // Validate number of visitors
  if (!request.numberOfVisitors || typeof request.numberOfVisitors !== 'number' || request.numberOfVisitors < 1 || request.numberOfVisitors > 50) {
    errors.push('Number of visitors must be between 1 and 50');
  }

  // Validate number of tickets (if provided)
  if (request.numberOfTickets && (typeof request.numberOfTickets !== 'number' || request.numberOfTickets < 1 || request.numberOfTickets > 50)) {
    errors.push('Number of tickets must be between 1 and 50');
  }

  // Validate visit time format (if provided)
  if (request.visitTime && typeof request.visitTime === 'string') {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(request.visitTime)) {
      errors.push('Visit time must be in HH:MM format');
    }
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