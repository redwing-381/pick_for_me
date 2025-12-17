import { NextRequest, NextResponse } from 'next/server';
import { getItineraryPlanner, ItineraryRequest } from '@/lib/itinerary-planner';
import { TravelItinerary } from '@/lib/types';

// =============================================================================
// ITINERARY OPTIMIZATION API ROUTE
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request structure
    const validation = validateOptimizationRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid optimization request',
            details: validation.errors
          }
        },
        { status: 400 }
      );
    }

    // Convert dates in itinerary
    const itinerary: TravelItinerary = {
      ...body.itinerary,
      days: body.itinerary.days.map((day: any) => ({
        ...day,
        date: new Date(day.date)
      }))
    };

    const originalRequest: ItineraryRequest = {
      ...body.originalRequest,
      startDate: new Date(body.originalRequest.startDate),
      endDate: new Date(body.originalRequest.endDate)
    };

    // Optimize itinerary through planner
    const planner = getItineraryPlanner();
    const result = await planner.optimizeItinerary(itinerary, originalRequest);

    console.log(`Itinerary optimized: ${itinerary.id} - Balance score: ${result.balanceScore}`);
    
    return NextResponse.json({
      success: true,
      optimization: result
    });

  } catch (error) {
    console.error('Itinerary optimization API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'OPTIMIZATION_ERROR',
          message: 'An unexpected error occurred while optimizing itinerary',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return API documentation
  return NextResponse.json({
    endpoint: '/api/itinerary/optimize',
    description: 'Travel itinerary optimization API',
    methods: {
      POST: {
        description: 'Optimize an existing travel itinerary',
        required_fields: {
          itinerary: 'TravelItinerary - The itinerary to optimize',
          originalRequest: 'ItineraryRequest - The original request parameters'
        },
        response_format: {
          success: 'boolean',
          optimization: 'ItineraryOptimizationResult - Optimization results and suggestions'
        }
      }
    },
    example_request: {
      itinerary: {
        id: "ITIN_123456789_ABC123",
        name: "San Francisco 3-Day Trip",
        destination: {
          city: "San Francisco",
          state: "CA",
          latitude: 37.7749,
          longitude: -122.4194
        },
        days: [
          {
            date: "2024-12-25",
            activities: [],
            accommodation: null,
            meals: [],
            transportation: []
          }
        ],
        totalEstimatedCost: 1200
      },
      originalRequest: {
        destination: {
          city: "San Francisco",
          state: "CA",
          latitude: 37.7749,
          longitude: -122.4194
        },
        startDate: "2024-12-25",
        endDate: "2024-12-28",
        groupSize: 2,
        preferences: {
          cuisineTypes: ["italian"],
          priceRange: "$$",
          dietaryRestrictions: [],
          atmosphere: "casual",
          partySize: 2
        }
      }
    }
  });
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

function validateOptimizationRequest(request: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate itinerary
  if (!request.itinerary || typeof request.itinerary !== 'object') {
    errors.push('Valid itinerary object is required');
  } else {
    if (!request.itinerary.id || !request.itinerary.name) {
      errors.push('Itinerary must have id and name');
    }
    if (!request.itinerary.days || !Array.isArray(request.itinerary.days)) {
      errors.push('Itinerary must have days array');
    }
  }

  // Validate original request
  if (!request.originalRequest || typeof request.originalRequest !== 'object') {
    errors.push('Original request parameters are required for optimization');
  } else {
    if (!request.originalRequest.destination || !request.originalRequest.startDate || !request.originalRequest.endDate) {
      errors.push('Original request must include destination, startDate, and endDate');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}