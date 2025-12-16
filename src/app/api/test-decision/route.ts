import { NextResponse } from 'next/server';
import { Business, UserPreferences, Location } from '@/lib/types';

export async function GET() {
  try {
    // Create test data
    const testBusinesses: Business[] = [
      {
        id: 'test-restaurant-1',
        name: 'Mama Mia Italian Kitchen',
        rating: 4.5,
        review_count: 324,
        price: '$$',
        categories: [
          { alias: 'italian', title: 'Italian' },
          { alias: 'pizza', title: 'Pizza' }
        ],
        location: {
          address1: '123 Main St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94102',
          country: 'US',
          display_address: ['123 Main St', 'San Francisco, CA 94102']
        },
        coordinates: {
          latitude: 37.7749,
          longitude: -122.4194
        },
        photos: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'],
        phone: '+14155551234',
        display_phone: '(415) 555-1234',
        url: 'https://www.yelp.com/biz/mama-mia-italian',
        image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        is_closed: false,
        distance: 0.5,
        transactions: ['restaurant_reservation', 'delivery']
      },
      {
        id: 'test-restaurant-2',
        name: 'Budget Burger Joint',
        rating: 3.8,
        review_count: 156,
        price: '$',
        categories: [
          { alias: 'burgers', title: 'Burgers' },
          { alias: 'american', title: 'American' }
        ],
        location: {
          address1: '456 Oak Ave',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94103',
          country: 'US',
          display_address: ['456 Oak Ave', 'San Francisco, CA 94103']
        },
        coordinates: {
          latitude: 37.7849,
          longitude: -122.4094
        },
        photos: ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400'],
        phone: '+14155555678',
        display_phone: '(415) 555-5678',
        url: 'https://www.yelp.com/biz/budget-burger',
        image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
        is_closed: false,
        distance: 1.2,
        transactions: ['pickup', 'delivery']
      },
      {
        id: 'test-restaurant-3',
        name: 'Upscale French Bistro',
        rating: 4.8,
        review_count: 89,
        price: '$$$',
        categories: [
          { alias: 'french', title: 'French' },
          { alias: 'bistros', title: 'Bistros' }
        ],
        location: {
          address1: '789 Pine St',
          city: 'San Francisco',
          state: 'CA',
          zip_code: '94108',
          country: 'US',
          display_address: ['789 Pine St', 'San Francisco, CA 94108']
        },
        coordinates: {
          latitude: 37.7849,
          longitude: -122.4094
        },
        photos: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400'],
        phone: '+14155559999',
        display_phone: '(415) 555-9999',
        url: 'https://www.yelp.com/biz/upscale-french',
        image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
        is_closed: false,
        distance: 0.8,
        transactions: ['restaurant_reservation']
      }
    ];

    const testPreferences: UserPreferences = {
      cuisineTypes: ['italian'],
      priceRange: '$$',
      dietaryRestrictions: [],
      atmosphere: 'casual',
      partySize: 2
    };

    const testLocation: Location = {
      latitude: 37.7749,
      longitude: -122.4194,
      address: 'San Francisco, CA',
      city: 'San Francisco',
      state: 'CA'
    };

    // Test the decision API
    const decisionRequest = {
      businesses: testBusinesses,
      userPreferences: testPreferences,
      location: testLocation
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(decisionRequest)
    });

    const result = await response.json();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      test_scenario: {
        description: 'User wants Italian food, $$ price range, casual atmosphere',
        businesses_count: testBusinesses.length,
        expected_winner: 'Mama Mia Italian Kitchen (perfect cuisine and price match)'
      },
      test_data: {
        businesses: testBusinesses.map(b => ({
          name: b.name,
          rating: b.rating,
          price: b.price,
          cuisine: b.categories.map(c => c.title).join(', '),
          distance: b.distance
        })),
        preferences: testPreferences,
        location: testLocation
      },
      decision_result: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Decision test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test decision engine',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}