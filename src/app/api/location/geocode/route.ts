import { NextRequest, NextResponse } from 'next/server';
import type { Location, EnhancedLocation } from '@/lib/types';
import { validateLocationInput, geocodeAddressToDetails } from '@/lib/location-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const validation = validateLocationInput(query);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || 'Invalid location query' },
        { status: 400 }
      );
    }

    // Use enhanced geocoding for better results
    let locations: EnhancedLocation[] = [];
    
    if (validation.type === 'coordinates') {
      // Handle coordinates directly
      const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        
        const enhancedLocation = await geocodeAddressToDetails(`${lat},${lng}`);
        locations = enhancedLocation;
      }
    } else {
      // Geocode address/city/zip
      locations = await geocodeAddressToDetails(query);
    }

    // Set caching headers for performance optimization
    const response = NextResponse.json({
      success: true,
      locations,
      query,
      type: validation.type,
      enhanced: true,
    });

    // Add cache headers (1 hour for search results)
    response.headers.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=1800');
    response.headers.set('ETag', `"geocode-${Buffer.from(query).toString('base64')}"`);

    return response;
  } catch (error) {
    console.error('Enhanced geocoding error:', error);
    
    let errorCode = 'GEOCODING_ERROR';
    let statusCode = 500;
    let userMessage = 'Failed to find location. Please try a different address.';
    let retryable = true;

    if (error instanceof Error) {
      if (error.message.includes('Failed to geocode address')) {
        errorCode = 'NOT_FOUND_ERROR';
        statusCode = 404;
        userMessage = 'Address not found. Please try a different address.';
        retryable = false;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorCode = 'NETWORK_ERROR';
        statusCode = 503;
        userMessage = 'Network error. Please check your connection and try again.';
        retryable = true;
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        errorCode = 'RATE_LIMIT_ERROR';
        statusCode = 429;
        userMessage = 'Too many location requests. Please wait a moment and try again.';
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

