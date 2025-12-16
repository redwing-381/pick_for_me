import { NextRequest, NextResponse } from 'next/server';
import { runYelpClientTests } from '@/lib/yelp-test';
import type { Location } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Optional location for testing
    let location: Location | undefined;
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    if (lat && lng) {
      location = {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        address: `${lat}, ${lng}`,
        city: 'Test City',
        state: 'Test State',
        country: 'US',
      };
    }

    console.log('Running Yelp client tests...');
    const testResults = await runYelpClientTests(location);

    return NextResponse.json({
      success: testResults.overall,
      message: testResults.overall ? 'All tests passed' : 'Some tests failed',
      results: testResults.results,
      timestamp: new Date().toISOString(),
      environment: {
        hasApiKey: !!process.env.YELP_API_KEY && process.env.YELP_API_KEY !== 'your_yelp_api_key_here',
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error('Yelp client test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Test execution failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, location } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    const { testYelpAIChat } = await import('@/lib/yelp-test');
    const result = await testYelpAIChat(message, location);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      response: result.response,
      error: result.error,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Yelp AI test error:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'Yelp AI test failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}