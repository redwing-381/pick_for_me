// Server-side Yelp API utilities for Next.js API routes

import { YelpAPIClient, createYelpClient } from './yelp-client';
import type { YelpAIRequest, YelpAIResponse, Business, Location } from './types';

// =============================================================================
// SERVER-SIDE YELP CLIENT
// =============================================================================

let serverYelpClient: YelpAPIClient | null = null;

export function getServerYelpClient(): YelpAPIClient {
  if (!serverYelpClient) {
    const apiKey = process.env.YELP_API_KEY;
    
    if (!apiKey) {
      throw new Error('YELP_API_KEY environment variable is required');
    }
    
    serverYelpClient = createYelpClient({
      apiKey,
      timeout: 15000, // Longer timeout for server requests
      maxRetries: 3,
      retryDelay: 1000,
    });
  }
  
  return serverYelpClient;
}

// =============================================================================
// MOCK YELP AI RESPONSES (for development)
// =============================================================================

export function createMockYelpAIResponse(
  userMessage: string,
  location?: Location
): YelpAIResponse {
  console.log('🎭 Creating mock response for:', userMessage);
  console.log('📍 Using location:', location?.address || 'No location provided');
  
  // Emergency fallback - no business data when Yelp API unavailable
  const fallbackBusinesses: Business[] = [];

  // Note: This is a fallback response when Yelp API is unavailable
  // In production, ensure YELP_API_KEY is properly configured
  const responseMessage = "I'm currently unable to connect to Yelp's services. Please try again later or ensure your API key is configured.";
  
  let selectedBusinesses = fallbackBusinesses;

  return {
    message: responseMessage,
    businesses: selectedBusinesses,
    reservation_info: {
      available_times: ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'],
      booking_url: selectedBusinesses[0].reservationUrl,
      requires_phone: false
    },
    suggested_actions: ['Make a reservation', 'Get directions', 'View menu'],
    requires_clarification: false
  };
}

// =============================================================================
// DEVELOPMENT MODE HELPERS
// =============================================================================

export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function shouldUseMockData(): boolean {
  // Only use mock data if no API key is provided
  return !process.env.YELP_API_KEY || process.env.YELP_API_KEY === 'your_yelp_api_key_here';
}

// =============================================================================
// API ROUTE HELPERS
// =============================================================================

export async function handleYelpAIRequest(
  request: YelpAIRequest
): Promise<YelpAIResponse> {
  try {
    if (shouldUseMockData()) {
      console.log('Using mock Yelp AI response (no API key provided)');
      const lastMessage = request.messages[request.messages.length - 1];
      const location = request.location ? {
        latitude: request.location.latitude,
        longitude: request.location.longitude,
        address: `${request.location.latitude}, ${request.location.longitude}`,
        city: 'Unknown',
        state: 'Unknown',
        country: 'US'
      } : undefined;
      
      return createMockYelpAIResponse(lastMessage.content, location);
    }

    const client = getServerYelpClient();
    const response = await client.chatWithAI(request);
    
    if (!response.success) {
      throw new Error(response.error.message);
    }
    
    return response.data;
  } catch (error) {
    console.error('Yelp AI request failed:', error);
    
    // Fallback to mock data on error
    const lastMessage = request.messages[request.messages.length - 1];
    const location = request.location ? {
      latitude: request.location.latitude,
      longitude: request.location.longitude,
      address: `${request.location.latitude}, ${request.location.longitude}`,
      city: 'Unknown',
      state: 'Unknown',
      country: 'US'
    } : undefined;
    
    return createMockYelpAIResponse(lastMessage.content, location);
  }
}

export async function handleBusinessSearch(params: {
  location?: string;
  latitude?: number;
  longitude?: number;
  term?: string;
  categories?: string;
  price?: string;
  limit?: number;
}): Promise<Business[]> {
  try {
    if (shouldUseMockData()) {
      console.log('Using mock business search results (no API key provided)');
      const mockResponse = createMockYelpAIResponse('search', params.latitude && params.longitude ? {
        latitude: params.latitude,
        longitude: params.longitude,
        address: `${params.latitude}, ${params.longitude}`,
        city: 'Unknown',
        state: 'Unknown',
        country: 'US'
      } : undefined);
      return mockResponse.businesses || [];
    }

    const client = getServerYelpClient();
    const response = await client.searchBusinesses(params);
    
    if (!response.success) {
      throw new Error(response.error.message);
    }
    
    return response.data.businesses;
  } catch (error) {
    console.error('Business search failed:', error);
    
    // Fallback to mock data on error
    const fallbackResponse = createMockYelpAIResponse('search');
    return fallbackResponse.businesses || [];
  }
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function validateYelpAIRequest(request: any): request is YelpAIRequest {
  return (
    request &&
    Array.isArray(request.messages) &&
    request.messages.length > 0 &&
    request.messages.every((msg: any) => 
      msg.role && 
      ['user', 'assistant'].includes(msg.role) && 
      typeof msg.content === 'string'
    )
  );
}

export function sanitizeYelpAIRequest(request: YelpAIRequest): YelpAIRequest {
  return {
    messages: request.messages.map(msg => ({
      ...msg,
      content: msg.content.trim().slice(0, 1000), // Limit message length
    })),
    location: request.location,
  };
}