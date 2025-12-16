import { NextRequest, NextResponse } from 'next/server';
import type { Location } from '@/lib/types';
import { isValidCoordinates } from '@/lib/location-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '');
    const lng = parseFloat(searchParams.get('lng') || '');

    if (!isValidCoordinates(lat, lng)) {
      return NextResponse.json(
        { error: 'Invalid coordinates provided' },
        { status: 400 }
      );
    }

    // Use a geocoding service to reverse geocode coordinates
    // For now, we'll use a mock implementation
    // In production, you would integrate with Google Maps, MapBox, or similar service
    const location = await reverseGeocodeCoordinates(lat, lng);

    return NextResponse.json({
      success: true,
      location,
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return NextResponse.json(
      { error: 'Failed to reverse geocode coordinates' },
      { status: 500 }
    );
  }
}

async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<Location> {
  // Mock implementation - in production, integrate with a real geocoding service
  // This is a simplified version that provides basic location data
  
  // Determine approximate region based on coordinates
  let city = 'Unknown City';
  let state = 'Unknown State';
  let country = 'US';
  let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  // Simple region detection for major US cities (mock data)
  if (lat >= 37.7 && lat <= 37.8 && lng >= -122.5 && lng <= -122.4) {
    city = 'San Francisco';
    state = 'CA';
    address = 'San Francisco, CA, USA';
  } else if (lat >= 40.7 && lat <= 40.8 && lng >= -74.1 && lng <= -73.9) {
    city = 'New York';
    state = 'NY';
    address = 'New York, NY, USA';
  } else if (lat >= 34.0 && lat <= 34.1 && lng >= -118.3 && lng <= -118.2) {
    city = 'Los Angeles';
    state = 'CA';
    address = 'Los Angeles, CA, USA';
  } else if (lat >= 41.8 && lat <= 41.9 && lng >= -87.7 && lng <= -87.6) {
    city = 'Chicago';
    state = 'IL';
    address = 'Chicago, IL, USA';
  } else if (lat >= 29.7 && lat <= 29.8 && lng >= -95.4 && lng <= -95.3) {
    city = 'Houston';
    state = 'TX';
    address = 'Houston, TX, USA';
  } else if (lat >= 43.6 && lat <= 43.7 && lng >= -79.4 && lng <= -79.3) {
    city = 'Toronto';
    state = 'ON';
    country = 'CA';
    address = 'Toronto, ON, Canada';
  }

  // In production, you would make an API call like this:
  /*
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );
  
  if (!response.ok) {
    throw new Error('Geocoding API request failed');
  }
  
  const data = await response.json();
  
  if (data.status !== 'OK' || !data.results.length) {
    throw new Error('No results found');
  }
  
  const result = data.results[0];
  // Parse the result to extract city, state, country, etc.
  */

  return {
    latitude: lat,
    longitude: lng,
    address,
    city,
    state,
    country,
  };
}