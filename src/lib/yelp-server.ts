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
  
  // Mock business data - location-aware
  const mockBusinesses: Business[] = [
    {
      id: 'mock-restaurant-1',
      name: 'The Perfect Bistro',
      rating: 4.5,
      review_count: 324,
      price: '$$',
      categories: [
        { alias: 'french', title: 'French' },
        { alias: 'bistros', title: 'Bistros' }
      ],
      location: {
        address1: '123 Main St',
        city: location?.city || 'San Francisco',
        state: location?.state || 'CA',
        zip_code: '94102',
        country: 'US',
        display_address: ['123 Main St', 'San Francisco, CA 94102']
      },
      coordinates: {
        latitude: location?.latitude || 37.7749,
        longitude: location?.longitude || -122.4194
      },
      photos: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'
      ],
      phone: '+14155551234',
      display_phone: '(415) 555-1234',
      url: 'https://www.yelp.com/biz/the-perfect-bistro',
      image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
      is_closed: false,
      distance: 0.5,
      transactions: ['restaurant_reservation', 'delivery'],
      reservationUrl: 'https://www.yelp.com/reservations/the-perfect-bistro',
      hours: [{
        open: [
          { is_overnight: false, start: '1100', end: '2200', day: 0 },
          { is_overnight: false, start: '1100', end: '2200', day: 1 },
          { is_overnight: false, start: '1100', end: '2200', day: 2 },
          { is_overnight: false, start: '1100', end: '2200', day: 3 },
          { is_overnight: false, start: '1100', end: '2300', day: 4 },
          { is_overnight: false, start: '1100', end: '2300', day: 5 },
          { is_overnight: false, start: '1000', end: '2200', day: 6 }
        ],
        hours_type: 'REGULAR',
        is_open_now: true
      }]
    },
    {
      id: 'mock-restaurant-2',
      name: 'Cozy Corner Cafe',
      rating: 4.2,
      review_count: 156,
      price: '$',
      categories: [
        { alias: 'cafes', title: 'Cafes' },
        { alias: 'breakfast_brunch', title: 'Breakfast & Brunch' }
      ],
      location: {
        address1: '456 Oak Ave',
        city: location?.city || 'San Francisco',
        state: location?.state || 'CA',
        zip_code: '94103',
        country: 'US',
        display_address: ['456 Oak Ave', 'San Francisco, CA 94103']
      },
      coordinates: {
        latitude: (location?.latitude || 37.7749) + 0.01,
        longitude: (location?.longitude || -122.4194) + 0.01
      },
      photos: [
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400'
      ],
      phone: '+14155555678',
      display_phone: '(415) 555-5678',
      url: 'https://www.yelp.com/biz/cozy-corner-cafe',
      image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
      is_closed: false,
      distance: 0.8,
      transactions: ['pickup', 'delivery'],
      hours: [{
        open: [
          { is_overnight: false, start: '0700', end: '1500', day: 0 },
          { is_overnight: false, start: '0700', end: '1500', day: 1 },
          { is_overnight: false, start: '0700', end: '1500', day: 2 },
          { is_overnight: false, start: '0700', end: '1500', day: 3 },
          { is_overnight: false, start: '0700', end: '1500', day: 4 },
          { is_overnight: false, start: '0700', end: '1500', day: 5 },
          { is_overnight: false, start: '0800', end: '1400', day: 6 }
        ],
        hours_type: 'REGULAR',
        is_open_now: true
      }]
    }
  ];

  // Generate response based on user message and location
  let responseMessage = location 
    ? `I found some great options near ${location.city || location.address}! ` 
    : "I found some great options for you! ";
  let selectedBusinesses = mockBusinesses;

  if (userMessage.toLowerCase().includes('italian')) {
    responseMessage = location 
      ? `I found some excellent Italian restaurants near ${location.city || location.address}! ` 
      : "I found some excellent Italian restaurants for you! ";
    selectedBusinesses = mockBusinesses.map(b => ({
      ...b,
      categories: [{ alias: 'italian', title: 'Italian' }],
      name: b.name.replace('Bistro', 'Italian Kitchen').replace('Cafe', 'Pizzeria')
    }));
  } else if (userMessage.toLowerCase().includes('cheap') || userMessage.toLowerCase().includes('budget')) {
    responseMessage = "Here are some great budget-friendly options! ";
    selectedBusinesses = mockBusinesses.filter(b => b.price === '$');
  } else if (userMessage.toLowerCase().includes('fancy') || userMessage.toLowerCase().includes('fine dining')) {
    responseMessage = "I found some upscale dining options for you! ";
    selectedBusinesses = mockBusinesses.map(b => ({ ...b, price: '$$$' as const }));
  }

  const locationContext = location 
    ? ` The closest option is ${selectedBusinesses[0].name}, just ${selectedBusinesses[0].distance} miles away.`
    : '';

  return {
    message: responseMessage + "Based on your preferences" + (location ? ` and location in ${location.city || location.address}` : '') + ", I'd recommend " + selectedBusinesses[0].name + ". It has excellent reviews and fits what you're looking for perfectly!" + locationContext,
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