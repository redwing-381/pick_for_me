import { NextRequest, NextResponse } from 'next/server';
import type { Location } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude parameters are required' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Use Nominatim reverse geocoding service with proper headers
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'PickForMe/1.0 (contact@pickforme.app)',
        },
      }
    );

    if (!response.ok) {
      console.error('Reverse geocoding service error:', response.status, response.statusText);
      // Return a basic location with coordinates
      return NextResponse.json({
        location: {
          latitude,
          longitude,
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          city: 'Unknown',
          state: 'Unknown',
          zipCode: undefined,
          country: 'Unknown',
        }
      });
    }

    const data = await response.json();
    const address = data.address || {};

    const location: Location = {
      latitude,
      longitude,
      address: data.display_name || `${latitude}, ${longitude}`,
      city: address.city || address.town || address.village || address.municipality || 'Unknown',
      state: address.state || address.region || address.county || address.province || 'Unknown',
      zipCode: address.postcode || undefined,
      country: address.country_code?.toUpperCase() || 'Unknown',
    };

    return NextResponse.json({ location });
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    // Return a basic location with coordinates instead of error
    const latitude = parseFloat(request.nextUrl.searchParams.get('lat') || '0');
    const longitude = parseFloat(request.nextUrl.searchParams.get('lng') || '0');
    
    return NextResponse.json({
      location: {
        latitude,
        longitude,
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        city: 'Unknown',
        state: 'Unknown',
        zipCode: undefined,
        country: 'Unknown',
      }
    });
  }
}
