import { NextRequest, NextResponse } from 'next/server';
import type { Location } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    // Use Nominatim geocoding service with rate limiting
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'PickForMe/1.0 (contact@pickforme.app)',
        },
      }
    );

    if (!response.ok) {
      console.error('Geocoding service error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Geocoding service unavailable', locations: [] },
        { status: 200 } // Return 200 with empty array instead of error
      );
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ locations: [] });
    }

    // Process results without additional API calls to avoid rate limiting
    const locations: Location[] = data.slice(0, 5).map((result: any) => {
      const address = result.address || {};
      
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        address: result.display_name,
        city: address.city || address.town || address.village || address.municipality || 'Unknown',
        state: address.state || address.region || address.county || address.province || 'Unknown',
        zipCode: address.postcode || undefined,
        country: address.country_code?.toUpperCase() || 'Unknown',
      };
    });

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Geocoding error:', error);
    return NextResponse.json(
      { locations: [] }, // Return empty array instead of error
      { status: 200 }
    );
  }
}
