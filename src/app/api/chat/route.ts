import { NextRequest, NextResponse } from 'next/server';
import { YelpAIRequest } from '@/lib/types';
import { handleYelpAIRequest } from '@/lib/yelp-server';
import { isValidLocation } from '@/lib/type-guards';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Message is required and must be a string',
            retryable: false
          }
        },
        { status: 400 }
      );
    }

    // Validate location if provided
    if (body.location && !isValidLocation(body.location)) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid location format',
            retryable: false
          }
        },
        { status: 400 }
      );
    }

    // Create Yelp AI request - no hardcoded responses, everything from Yelp API
    const yelpRequest: YelpAIRequest = {
      messages: [{ role: 'user', content: body.message }],
      location: body.location ? {
        latitude: body.location.latitude,
        longitude: body.location.longitude,
        address: body.location.address || `${body.location.city}, ${body.location.state}`,
        city: body.location.city,
        state: body.location.state,
        country: body.location.country || 'US'
      } : undefined
    };

    // Use Yelp AI API for all queries
    const response = await handleYelpAIRequest(yelpRequest);

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An error occurred while processing your request',
          retryable: true
        }
      },
      { status: 500 }
    );
  }
}