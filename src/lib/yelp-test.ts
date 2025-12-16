// Test utilities for Yelp API client

import { getServerYelpClient, handleYelpAIRequest, createMockYelpAIResponse } from './yelp-server';
import { createYelpAIRequest } from './yelp-client';
import type { Location, YelpAIRequest } from './types';

// =============================================================================
// TEST FUNCTIONS
// =============================================================================

export async function testYelpConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    const client = getServerYelpClient();
    const healthCheck = await client.healthCheck();
    
    return {
      success: healthCheck.success,
      message: healthCheck.success ? 'Yelp API connection successful' : 'Yelp API connection failed',
      details: healthCheck,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to Yelp API',
      details: error,
    };
  }
}

export async function testYelpAIChat(
  message: string = "Find me a good Italian restaurant nearby",
  location?: Location
): Promise<{
  success: boolean;
  message: string;
  response?: any;
  error?: any;
}> {
  try {
    const request = createYelpAIRequest([
      { role: 'user', content: message }
    ], location);

    const response = await handleYelpAIRequest(request);
    
    return {
      success: true,
      message: 'Yelp AI chat test successful',
      response,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Yelp AI chat test failed',
      error,
    };
  }
}

export async function testBusinessSearch(location?: Location): Promise<{
  success: boolean;
  message: string;
  businesses?: any[];
  error?: any;
}> {
  try {
    const client = getServerYelpClient();
    const searchParams = location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      term: 'restaurants',
      limit: 5,
    } : {
      location: 'San Francisco, CA',
      term: 'restaurants',
      limit: 5,
    };

    const response = await client.searchBusinesses(searchParams);
    
    if (response.success) {
      return {
        success: true,
        message: `Found ${response.data.businesses.length} businesses`,
        businesses: response.data.businesses,
      };
    } else {
      return {
        success: false,
        message: 'Business search failed',
        error: response.error,
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Business search test failed',
      error,
    };
  }
}

export function testMockData(): {
  success: boolean;
  message: string;
  mockResponse: any;
} {
  try {
    const mockResponse = createMockYelpAIResponse(
      "Find me a good Italian restaurant",
      {
        latitude: 37.7749,
        longitude: -122.4194,
        address: 'San Francisco, CA',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
      }
    );

    return {
      success: true,
      message: 'Mock data generation successful',
      mockResponse,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Mock data generation failed',
      mockResponse: error,
    };
  }
}

// =============================================================================
// COMPREHENSIVE TEST SUITE
// =============================================================================

export async function runYelpClientTests(location?: Location): Promise<{
  overall: boolean;
  results: Array<{
    test: string;
    success: boolean;
    message: string;
    details?: any;
  }>;
}> {
  const results = [];
  
  // Test 1: Mock data generation
  console.log('Testing mock data generation...');
  const mockTest = testMockData();
  results.push({
    test: 'Mock Data Generation',
    success: mockTest.success,
    message: mockTest.message,
    details: mockTest.mockResponse,
  });

  // Test 2: Yelp AI Chat (will use mock if no API key)
  console.log('Testing Yelp AI chat...');
  const chatTest = await testYelpAIChat(
    "I'm looking for a good Italian restaurant for dinner tonight",
    location
  );
  results.push({
    test: 'Yelp AI Chat',
    success: chatTest.success,
    message: chatTest.message,
    details: chatTest.response || chatTest.error,
  });

  // Test 3: Business search (will use mock if no API key)
  console.log('Testing business search...');
  const searchTest = await testBusinessSearch(location);
  results.push({
    test: 'Business Search',
    success: searchTest.success,
    message: searchTest.message,
    details: searchTest.businesses || searchTest.error,
  });

  // Test 4: Connection test (only if API key is available)
  if (process.env.YELP_API_KEY && process.env.YELP_API_KEY !== 'your_yelp_api_key_here') {
    console.log('Testing Yelp API connection...');
    const connectionTest = await testYelpConnection();
    results.push({
      test: 'API Connection',
      success: connectionTest.success,
      message: connectionTest.message,
      details: connectionTest.details,
    });
  } else {
    results.push({
      test: 'API Connection',
      success: true,
      message: 'Skipped (using mock data)',
      details: 'No API key configured, using mock responses',
    });
  }

  const overall = results.every(result => result.success);
  
  return { overall, results };
}