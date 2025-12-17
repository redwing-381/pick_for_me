import { NextRequest, NextResponse } from 'next/server';
import { getItineraryPlanner, ItineraryRequest } from '@/lib/itinerary-planner';
import { isValidContactInfo } from '@/lib/type-guards';

// =============================================================================
// ITINERARY GENERATION API ROUTE
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request structure
    const validation = validateItineraryRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid itinerary request',
            details: validation.errors
          }
        },
        { status: 400 }
      );
    }

    // Convert to itinerary request
    const itineraryRequest: ItineraryRequest = {
      destination: body.destination,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      groupSize: body.groupSize,
      budget: body.budget,
      preferences: body.preferences,
      interests: body.interests,
      travelStyle: body.travelStyle,
      accommodationPreference: body.accommodationPreference
    };

    // Generate itinerary through planner
    const planner = getItineraryPlanner();
    const result = await planner.generateItinerary(itineraryRequest);

    if (result.success) {
      console.log(`Itinerary generated: ${result.itinerary?.id} for ${body.destination.city}`);
      return NextResponse.json(result);
    } else {
      console.log(`Itinerary generation failed for ${body.destination.city}: ${result.error?.message}`);
      return NextResponse.json(result, { status: result.error?.code === 'VALIDATION_ERROR' ? 400 : 500 });
    }

  } catch (error) {
    console.error('Itinerary API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'ITINERARY_ERROR',
          message: 'An unexpected error occurred while generating itinerary',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itineraryId = searchParams.get('itinerary_id');
  
  if (itineraryId) {
    // Return itinerary status (mock implementation)
    return NextResponse.json({
      success: true,
      itinerary: {
        id: itineraryId,
        status: 'generated',
        message: 'Your itinerary is ready'
      }
    });
  }
  
  // Return API documentation
  return NextResponse.json({
    endpoint: '/api/itinerary',
    description: 'Travel itinerary generation API',
    methods: {
      POST: {
        description: 'Generate a multi-day travel itinerary',
        required_fields: {
          destination: 'Location - Destination information',
          startDate: 'string - Trip start date (YYYY-MM-DD)',
          endDate: 'string - Trip end date (YYYY-MM-DD)',
          groupSize: 'number - Number of travelers',
          preferences: 'UserPreferences - Travel preferences'
        },
        optional_fields: {
          budget: 'object - Budget constraints with min/max/currency',
          interests: 'string[] - Specific interests or activities',
          travelStyle: 'string - Travel style (budget, mid-range, luxury, adventure, cultural)',
          accommodationPreference: 'string - Accommodation type preference'
        }
      },
      GET: {
        description: 'Check itinerary status',
        query_parameters: {
          itinerary_id: 'string - Itinerary ID to check status'
        }
      }
    },
    example_request: {
      destination: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: "San Francisco, CA",
        city: "San Francisco",
        state: "CA",
        zipCode: "94102"
      },
      startDate: "2024-12-25",
      endDate: "2024-12-28",
      groupSize: 2,
      budget: {
        min: 500,
        max: 1500,
        currency: "USD"
      },
      preferences: {
        cuisineTypes: ["italian", "seafood"],
        priceRange: "$$",
        dietaryRestrictions: [],
        atmosphere: "casual",
        partySize: 2
      },
      interests: ["museums", "parks", "nightlife"],
      travelStyle: "mid-range",
      accommodationPreference: "hotel"
    }
  });
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

function validateItineraryRequest(request: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate destination
  if (!request.destination || !request.destination.city || !request.destination.latitude || !request.destination.longitude) {
    errors.push('Valid destination with city, latitude, and longitude is required');
  }

  // Validate dates
  if (!request.startDate || typeof request.startDate !== 'string') {
    errors.push('Start date is required (YYYY-MM-DD format)');
  }

  if (!request.endDate || typeof request.endDate !== 'string') {
    errors.push('End date is required (YYYY-MM-DD format)');
  }

  // Validate date logic
  if (request.startDate && request.endDate) {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      errors.push('Start date cannot be in the past');
    }

    if (endDate <= startDate) {
      errors.push('End date must be after start date');
    }

    const daysDifference = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDifference > 14) {
      errors.push('Itinerary planning is limited to 14 days maximum');
    }
  }

  // Validate group size
  if (!request.groupSize || typeof request.groupSize !== 'number' || request.groupSize < 1 || request.groupSize > 20) {
    errors.push('Group size must be between 1 and 20 people');
  }

  // Validate preferences
  if (!request.preferences || typeof request.preferences !== 'object') {
    errors.push('Travel preferences are required');
  }

  // Validate budget (if provided)
  if (request.budget) {
    if (typeof request.budget !== 'object' || !request.budget.currency) {
      errors.push('Budget must include currency');
    }
    if (request.budget.min && request.budget.max && request.budget.min >= request.budget.max) {
      errors.push('Budget maximum must be greater than minimum');
    }
  }

  // Validate travel style (if provided)
  if (request.travelStyle) {
    const validStyles = ['budget', 'mid-range', 'luxury', 'adventure', 'cultural'];
    if (!validStyles.includes(request.travelStyle)) {
      errors.push(`Travel style must be one of: ${validStyles.join(', ')}`);
    }
  }

  // Validate accommodation preference (if provided)
  if (request.accommodationPreference) {
    const validTypes = ['hotel', 'hostel', 'apartment', 'any'];
    if (!validTypes.includes(request.accommodationPreference)) {
      errors.push(`Accommodation preference must be one of: ${validTypes.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}