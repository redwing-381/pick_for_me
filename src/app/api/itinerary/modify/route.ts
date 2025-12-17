import { NextRequest, NextResponse } from 'next/server';
import { getItineraryPlanner } from '@/lib/itinerary-planner';
import { TravelItinerary } from '@/lib/types';

// =============================================================================
// ITINERARY MODIFICATION API ROUTE
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request structure
    const validation = validateModificationRequest(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid modification request',
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

    // Modify itinerary through planner
    const planner = getItineraryPlanner();
    const modifiedItinerary = await planner.modifyItinerary(itinerary, body.modifications);

    console.log(`Itinerary modified: ${itinerary.id}`);
    
    return NextResponse.json({
      success: true,
      itinerary: modifiedItinerary
    });

  } catch (error) {
    console.error('Itinerary modification API error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'MODIFICATION_ERROR',
          message: 'An unexpected error occurred while modifying itinerary',
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
    endpoint: '/api/itinerary/modify',
    description: 'Travel itinerary modification API',
    methods: {
      POST: {
        description: 'Modify an existing travel itinerary',
        required_fields: {
          itinerary: 'TravelItinerary - The itinerary to modify',
          modifications: 'object - Modifications to apply'
        },
        modification_types: {
          addActivity: {
            day: 'number - Day index to add activity to',
            activity: 'ActivitySuggestion - Activity to add',
            time: 'string - Time slot for the activity'
          },
          removeActivity: {
            day: 'number - Day index',
            activityIndex: 'number - Activity index to remove'
          },
          replaceActivity: {
            day: 'number - Day index',
            activityIndex: 'number - Activity index to replace',
            newActivity: 'ActivitySuggestion - New activity'
          },
          changeAccommodation: 'Business - New accommodation'
        }
      }
    },
    example_request: {
      itinerary: {
        id: "ITIN_123456789_ABC123",
        name: "San Francisco 3-Day Trip",
        destination: {
          city: "San Francisco",
          state: "CA"
        },
        days: [
          {
            date: "2024-12-25",
            activities: [],
            accommodation: null,
            meals: []
          }
        ]
      },
      modifications: {
        addActivity: {
          day: 0,
          activity: {
            business: {
              id: "new-attraction",
              name: "Golden Gate Bridge",
              rating: 4.8,
              categories: [{ alias: "attractions", title: "Attractions" }]
            },
            category: "attraction",
            priority: 9,
            estimatedDuration: 120,
            bestTimeSlots: ["10:00", "14:00"],
            cost: 0,
            reasoning: "Iconic San Francisco landmark"
          },
          time: "10:00"
        }
      }
    }
  });
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

function validateModificationRequest(request: any): { isValid: boolean; errors: string[] } {
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

  // Validate modifications
  if (!request.modifications || typeof request.modifications !== 'object') {
    errors.push('Modifications object is required');
  } else {
    const { addActivity, removeActivity, replaceActivity, changeAccommodation } = request.modifications;
    
    // Validate addActivity
    if (addActivity) {
      if (typeof addActivity.day !== 'number' || !addActivity.activity || !addActivity.time) {
        errors.push('addActivity requires day (number), activity (object), and time (string)');
      }
    }
    
    // Validate removeActivity
    if (removeActivity) {
      if (typeof removeActivity.day !== 'number' || typeof removeActivity.activityIndex !== 'number') {
        errors.push('removeActivity requires day (number) and activityIndex (number)');
      }
    }
    
    // Validate replaceActivity
    if (replaceActivity) {
      if (typeof replaceActivity.day !== 'number' || typeof replaceActivity.activityIndex !== 'number' || !replaceActivity.newActivity) {
        errors.push('replaceActivity requires day (number), activityIndex (number), and newActivity (object)');
      }
    }
    
    // Validate changeAccommodation
    if (changeAccommodation) {
      if (!changeAccommodation.id || !changeAccommodation.name) {
        errors.push('changeAccommodation requires a valid business object with id and name');
      }
    }
    
    // At least one modification must be provided
    if (!addActivity && !removeActivity && !replaceActivity && !changeAccommodation) {
      errors.push('At least one modification (addActivity, removeActivity, replaceActivity, or changeAccommodation) must be provided');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}