import { NextRequest, NextResponse } from 'next/server';
import { DecisionRequest, DecisionResponse } from '@/lib/types';
import { decisionEngine, handleNoSuitableOptions } from '@/lib/decision-engine';
import { isValidLocation } from '@/lib/type-guards';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.businesses || !Array.isArray(body.businesses) || body.businesses.length === 0) {
      return NextResponse.json(
        { error: 'Businesses array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!body.userPreferences || typeof body.userPreferences !== 'object') {
      return NextResponse.json(
        { error: 'User preferences are required' },
        { status: 400 }
      );
    }

    if (!body.location || !isValidLocation(body.location)) {
      return NextResponse.json(
        { error: 'Valid location is required' },
        { status: 400 }
      );
    }

    // Prepare decision request
    const decisionRequest: DecisionRequest = {
      businesses: body.businesses,
      userPreferences: body.userPreferences,
      location: body.location,
      conversationContext: body.conversationContext
    };

    // Make decision
    let decision: DecisionResponse;
    
    try {
      decision = await decisionEngine.selectBestRestaurant(decisionRequest);
    } catch (error) {
      // Handle case where no suitable options are found
      if (error instanceof Error && error.message.includes('No restaurants found')) {
        try {
          decision = handleNoSuitableOptions(body.businesses, body.userPreferences);
        } catch (fallbackError) {
          return NextResponse.json(
            { 
              error: 'No suitable restaurants found',
              message: 'Please try adjusting your preferences or expanding your search area'
            },
            { status: 404 }
          );
        }
      } else {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      data: decision,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Decision API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while making the decision'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for API documentation
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/decision',
    method: 'POST',
    description: 'Autonomous decision-making engine for restaurant selection',
    required_fields: {
      businesses: 'Business[] - Array of restaurant options to choose from',
      userPreferences: 'UserPreferences - User dining preferences and constraints',
      location: 'Location - User location for distance calculations'
    },
    optional_fields: {
      conversationContext: 'ConversationContext - Additional context from conversation'
    },
    response_format: {
      success: 'boolean',
      data: 'DecisionResponse - Selected restaurant with reasoning and alternatives',
      timestamp: 'string'
    },
    example_request: {
      businesses: [
        {
          id: 'restaurant-1',
          name: 'Italian Bistro',
          rating: 4.5,
          price: '$$',
          categories: [{ alias: 'italian', title: 'Italian' }],
          distance: 0.8
        }
      ],
      userPreferences: {
        cuisineTypes: ['italian'],
        priceRange: '$$',
        dietaryRestrictions: [],
        atmosphere: 'casual',
        partySize: 2
      },
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA',
        city: 'San Francisco',
        state: 'CA'
      }
    },
    decision_factors: [
      'Rating (30% weight) - Restaurant quality based on reviews',
      'Price Match (25% weight) - How well price matches user preference',
      'Distance (20% weight) - Proximity to user location',
      'Cuisine Match (15% weight) - Alignment with preferred cuisines',
      'Popularity (10% weight) - Review count as popularity indicator'
    ]
  });
}