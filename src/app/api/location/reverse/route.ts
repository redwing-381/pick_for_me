import { NextRequest, NextResponse } from 'next/server';
import type { Location, EnhancedLocation } from '@/lib/types';
import { isValidCoordinates, resolveCoordinatesToDetails } from '@/lib/location-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (!isValidCoordinates(lat, lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates provided' },
        { status: 400 }
      );
    }

    // Use enhanced geocoding with caching
    const enhancedLocation = await resolveCoordinatesToDetails(lat, lng);

    // Set caching headers for performance optimization
    const response = NextResponse.json({
      success: true,
      location: enhancedLocation,
      enhanced: true,
      cached: false, // This would be determined by the caching layer
    });

    // Add cache headers (24 hours for location data)
    response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=43200');
    response.headers.set('ETag', `"${lat.toFixed(6)}-${lng.toFixed(6)}"`);

    return response;
  } catch (error) {
    console.error('Enhanced reverse geocoding error:', error);
    
    let errorCode = 'GEOCODING_ERROR';
    let statusCode = 500;
    let userMessage = 'Failed to resolve location details. Please try again.';
    let retryable = true;

    if (error instanceof Error) {
      if (error.message.includes('Invalid coordinates')) {
        errorCode = 'INVALID_COORDINATES';
        statusCode = 400;
        userMessage = 'Invalid coordinates provided.';
        retryable = false;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorCode = 'NETWORK_ERROR';
        statusCode = 503;
        userMessage = 'Network error. Please check your connection and try again.';
        retryable = true;
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: {
          code: errorCode,
          message: userMessage,
          retryable,
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
}

