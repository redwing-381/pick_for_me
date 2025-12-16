import { NextRequest, NextResponse } from 'next/server';
import type { Location } from '@/lib/types';
import { validateLocationInput } from '@/lib/location-utils';

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

    // Geocode the address/location query
    const locations = await geocodeQuery(query, validation.type);

    return NextResponse.json({
      success: true,
      locations,
      query,
      type: validation.type,
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    
    let errorCode = 'LOCATION_ERROR';
    let statusCode = 500;
    let userMessage = 'Failed to find location. Please try a different address.';
    let retryable = true;

    if (error instanceof Error && error.message.includes('fetch')) {
      errorCode = 'NETWORK_ERROR';
      statusCode = 503;
      userMessage = 'Network error. Please check your connection and try again.';
      retryable = true;
    } else if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as any;
      if (apiError.status === 404) {
        errorCode = 'NOT_FOUND_ERROR';
        statusCode = 404;
        userMessage = 'Address not found. Please try a different address.';
        retryable = false;
      } else if (apiError.status === 429) {
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

async function geocodeQuery(
  query: string,
  type: 'coordinates' | 'address' | 'zipcode' | 'city' | 'invalid'
): Promise<Location[]> {
  // Mock implementation - in production, integrate with a real geocoding service
  const locations: Location[] = [];

  // Handle coordinates directly
  if (type === 'coordinates') {
    const coordMatch = query.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      
      locations.push({
        latitude: lat,
        longitude: lng,
        address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: 'Unknown',
        state: 'Unknown',
        country: 'US',
      });
    }
    return locations;
  }

  // Mock geocoding for common locations
  const mockLocations = getMockLocations();
  const queryLower = query.toLowerCase();

  // Search through mock locations
  for (const location of mockLocations) {
    const addressLower = location.address.toLowerCase();
    const cityLower = location.city.toLowerCase();
    
    if (
      addressLower.includes(queryLower) ||
      cityLower.includes(queryLower) ||
      queryLower.includes(cityLower)
    ) {
      locations.push(location);
    }
  }

  // If no matches found, try to create a reasonable default
  if (locations.length === 0) {
    // For zip codes, create a generic location
    if (type === 'zipcode') {
      locations.push({
        latitude: 37.7749, // Default to San Francisco area
        longitude: -122.4194,
        address: `${query}, USA`,
        city: 'Unknown',
        state: 'Unknown',
        country: 'US',
      });
    }
  }

  // In production, you would make an API call like this:
  /*
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error('Geocoding API request failed');
  }
  
  const data = await response.json();
  
  if (data.status !== 'OK') {
    return [];
  }
  
  return data.results.map((result: any) => ({
    latitude: result.geometry.location.lat,
    longitude: result.geometry.location.lng,
    address: result.formatted_address,
    city: extractCity(result.address_components),
    state: extractState(result.address_components),
    country: extractCountry(result.address_components),
  }));
  */

  return locations.slice(0, 5); // Limit to 5 results
}

function getMockLocations(): Location[] {
  return [
    {
      latitude: 37.7749,
      longitude: -122.4194,
      address: 'San Francisco, CA, USA',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
    },
    {
      latitude: 40.7128,
      longitude: -74.0060,
      address: 'New York, NY, USA',
      city: 'New York',
      state: 'NY',
      country: 'US',
    },
    {
      latitude: 34.0522,
      longitude: -118.2437,
      address: 'Los Angeles, CA, USA',
      city: 'Los Angeles',
      state: 'CA',
      country: 'US',
    },
    {
      latitude: 41.8781,
      longitude: -87.6298,
      address: 'Chicago, IL, USA',
      city: 'Chicago',
      state: 'IL',
      country: 'US',
    },
    {
      latitude: 29.7604,
      longitude: -95.3698,
      address: 'Houston, TX, USA',
      city: 'Houston',
      state: 'TX',
      country: 'US',
    },
    {
      latitude: 33.4484,
      longitude: -112.0740,
      address: 'Phoenix, AZ, USA',
      city: 'Phoenix',
      state: 'AZ',
      country: 'US',
    },
    {
      latitude: 39.9526,
      longitude: -75.1652,
      address: 'Philadelphia, PA, USA',
      city: 'Philadelphia',
      state: 'PA',
      country: 'US',
    },
    {
      latitude: 29.4241,
      longitude: -98.4936,
      address: 'San Antonio, TX, USA',
      city: 'San Antonio',
      state: 'TX',
      country: 'US',
    },
    {
      latitude: 32.7767,
      longitude: -96.7970,
      address: 'Dallas, TX, USA',
      city: 'Dallas',
      state: 'TX',
      country: 'US',
    },
    {
      latitude: 37.3382,
      longitude: -121.8863,
      address: 'San Jose, CA, USA',
      city: 'San Jose',
      state: 'CA',
      country: 'US',
    },
    {
      latitude: 30.2672,
      longitude: -97.7431,
      address: 'Austin, TX, USA',
      city: 'Austin',
      state: 'TX',
      country: 'US',
    },
    {
      latitude: 43.6532,
      longitude: -79.3832,
      address: 'Toronto, ON, Canada',
      city: 'Toronto',
      state: 'ON',
      country: 'CA',
    },
    {
      latitude: 45.5017,
      longitude: -73.5673,
      address: 'Montreal, QC, Canada',
      city: 'Montreal',
      state: 'QC',
      country: 'CA',
    },
    {
      latitude: 49.2827,
      longitude: -123.1207,
      address: 'Vancouver, BC, Canada',
      city: 'Vancouver',
      state: 'BC',
      country: 'CA',
    },
    {
      latitude: 51.0447,
      longitude: -114.0719,
      address: 'Calgary, AB, Canada',
      city: 'Calgary',
      state: 'AB',
      country: 'CA',
    },
  ];
}