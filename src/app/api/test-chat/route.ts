import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test the chat API with a sample request
    const testRequest = {
      message: "Find me a good Italian restaurant nearby for dinner tonight",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: "San Francisco, CA"
      },
      user_preferences: {
        cuisine_types: ["italian"],
        price_range: "$$",
        dietary_restrictions: []
      },
      session_id: `test_session_${Date.now()}`
    };

    // Make request to our chat API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest)
    });

    const result = await response.json();

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      test_request: testRequest,
      api_response: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API test error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test chat API',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}