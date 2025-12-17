// Yelp API client utilities for Pick For Me application

import type { 
  YelpAIRequest, 
  YelpAIResponse, 
  Business, 
  Location,
  ApiResponse 
} from './types';
import { YELP_API_CONFIG, ERROR_MESSAGES } from './constants';
import { getMockTravelData } from './travel-mock-data';

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface YelpAPIClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface YelpSearchParams {
  location?: string;
  latitude?: number;
  longitude?: number;
  term?: string;
  categories?: string;
  price?: string;
  radius?: number;
  limit?: number;
  sort_by?: 'best_match' | 'rating' | 'review_count' | 'distance';
  open_now?: boolean;
}

export interface YelpBusinessDetailsParams {
  businessId: string;
}

export interface YelpReservationParams {
  businessId: string;
  partySize: number;
  date: string;
  time: string;
}

// =============================================================================
// RATE LIMITING
// =============================================================================

class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly timeWindow: number;

  constructor(maxRequests: number = 100, timeWindowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindowMs;
  }

  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the time window
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.timeWindow - (now - oldestRequest);
      
      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    this.requests.push(now);
  }
}

// =============================================================================
// YELP API CLIENT
// =============================================================================

export class YelpAPIClient {
  private config: Required<YelpAPIClientConfig>;
  private rateLimiter: RateLimiter;

  constructor(config: YelpAPIClientConfig) {
    this.config = {
      baseUrl: YELP_API_CONFIG.BASE_URL,
      timeout: YELP_API_CONFIG.TIMEOUT,
      maxRetries: YELP_API_CONFIG.MAX_RETRIES,
      retryDelay: 1000,
      ...config,
    };
    
    this.rateLimiter = new RateLimiter();
  }

  // =============================================================================
  // CORE REQUEST METHODS
  // =============================================================================

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<ApiResponse<T>> {
    try {
      // Apply rate limiting
      await this.rateLimiter.waitIfNeeded();

      const url = `${this.config.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers,
        },
        signal: AbortSignal.timeout(this.config.timeout),
      });

      if (!response.ok) {
        return this.handleErrorResponse(response, endpoint, options, retryCount);
      }

      const data = await response.json();
      return { success: true, data };

    } catch (error) {
      return this.handleRequestError(error, endpoint, options, retryCount);
    }
  }

  private async handleErrorResponse<T>(
    response: Response,
    endpoint: string,
    options: RequestInit,
    retryCount: number
  ): Promise<ApiResponse<T>> {
    const status = response.status;
    
    // Handle rate limiting (429)
    if (status === 429 && retryCount < this.config.maxRetries) {
      const retryAfter = response.headers.get('Retry-After');
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : this.config.retryDelay * Math.pow(2, retryCount);
      
      console.log(`Rate limited, retrying after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.makeRequest(endpoint, options, retryCount + 1);
    }

    // Handle server errors (5xx) with retry
    if (status >= 500 && retryCount < this.config.maxRetries) {
      const delay = this.config.retryDelay * Math.pow(2, retryCount);
      console.log(`Server error ${status}, retrying after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.makeRequest(endpoint, options, retryCount + 1);
    }

    // Parse error response
    let errorMessage = ERROR_MESSAGES.API_SERVER_ERROR;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.description || errorData.message || errorMessage;
    } catch {
      // Use default error message if parsing fails
    }

    return {
      success: false,
      error: {
        message: errorMessage,
        code: status.toString(),
        details: { status, endpoint },
      },
    };
  }

  private async handleRequestError<T>(
    error: any,
    endpoint: string,
    options: RequestInit,
    retryCount: number
  ): Promise<ApiResponse<T>> {
    // Handle timeout
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      if (retryCount < this.config.maxRetries) {
        const delay = this.config.retryDelay * Math.pow(2, retryCount);
        console.log(`Request timeout, retrying after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(endpoint, options, retryCount + 1);
      }
      
      return {
        success: false,
        error: {
          message: ERROR_MESSAGES.API_TIMEOUT,
          code: 'TIMEOUT',
          details: error,
        },
      };
    }

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        success: false,
        error: {
          message: ERROR_MESSAGES.API_NETWORK_ERROR,
          code: 'NETWORK_ERROR',
          details: error,
        },
      };
    }

    // Generic error
    return {
      success: false,
      error: {
        message: ERROR_MESSAGES.GENERIC_ERROR,
        code: 'UNKNOWN_ERROR',
        details: error,
      },
    };
  }

  // =============================================================================
  // TRAVEL QUERY SUPPORT
  // =============================================================================

  private generateMockTravelData(category: string, location: any): Business[] {
    const locationName = location?.city || 'Unknown City';
    
    switch (category) {
      case 'accommodation':
        return [
          {
            id: 'hotel_mock_1',
            name: `Grand ${locationName} Hotel`,
            rating: 4.5,
            review_count: 1250,
            price: '$$$',
            categories: [{ alias: 'hotel', title: 'Hotel' }],
            location: {
              address1: '123 Main Street',
              city: locationName,
              state: location?.state || 'State',
              zip_code: location?.zipCode || '12345',
              country: 'US',
              display_address: [`123 Main Street`, `${locationName}, ${location?.state || 'State'} ${location?.zipCode || '12345'}`]
            },
            coordinates: {
              latitude: location?.latitude || 40.7128,
              longitude: location?.longitude || -74.0060
            },
            photos: ['https://example.com/hotel1.jpg'],
            phone: '+1-555-0123',
            display_phone: '(555) 012-3456',
            url: 'https://example.com/hotel1',
            image_url: 'https://example.com/hotel1.jpg',
            is_closed: false,
            transactions: ['booking_available']
          }
        ];
        
      case 'attractions':
        return [
          {
            id: 'attraction_mock_1',
            name: `${locationName} Museum of Art`,
            rating: 4.6,
            review_count: 2100,
            price: '$$',
            categories: [{ alias: 'museum', title: 'Art Museum' }],
            location: {
              address1: '789 Culture Blvd',
              city: locationName,
              state: location?.state || 'State',
              zip_code: location?.zipCode || '12345',
              country: 'US',
              display_address: [`789 Culture Blvd`, `${locationName}, ${location?.state || 'State'} ${location?.zipCode || '12345'}`]
            },
            coordinates: {
              latitude: (location?.latitude || 40.7128) + 0.02,
              longitude: (location?.longitude || -74.0060) + 0.02
            },
            photos: ['https://example.com/museum1.jpg'],
            phone: '+1-555-0125',
            display_phone: '(555) 012-3458',
            url: 'https://example.com/museum1',
            image_url: 'https://example.com/museum1.jpg',
            is_closed: false,
            transactions: ['tickets_available']
          }
        ];
        
      case 'transportation':
        return [
          {
            id: 'transport_mock_1',
            name: `${locationName} International Airport`,
            rating: 3.9,
            review_count: 5200,
            price: 'N/A',
            categories: [{ alias: 'airport', title: 'Airport' }],
            location: {
              address1: '1 Airport Way',
              city: locationName,
              state: location?.state || 'State',
              zip_code: location?.zipCode || '12345',
              country: 'US',
              display_address: [`1 Airport Way`, `${locationName}, ${location?.state || 'State'} ${location?.zipCode || '12345'}`]
            },
            coordinates: {
              latitude: (location?.latitude || 40.7128) + 0.1,
              longitude: (location?.longitude || -74.0060) + 0.1
            },
            photos: ['https://example.com/airport1.jpg'],
            phone: '+1-555-0127',
            display_phone: '(555) 012-3460',
            url: 'https://example.com/airport1',
            image_url: 'https://example.com/airport1.jpg',
            is_closed: false,
            transactions: ['flight_booking']
          }
        ];
        
      case 'entertainment':
        return [
          {
            id: 'entertainment_mock_1',
            name: `The ${locationName} Theater`,
            rating: 4.7,
            review_count: 980,
            price: '$$$',
            categories: [{ alias: 'theater', title: 'Theater' }],
            location: {
              address1: '200 Broadway',
              city: locationName,
              state: location?.state || 'State',
              zip_code: location?.zipCode || '12345',
              country: 'US',
              display_address: [`200 Broadway`, `${locationName}, ${location?.state || 'State'} ${location?.zipCode || '12345'}`]
            },
            coordinates: {
              latitude: (location?.latitude || 40.7128) + 0.005,
              longitude: (location?.longitude || -74.0060) - 0.005
            },
            photos: ['https://example.com/theater1.jpg'],
            phone: '+1-555-0129',
            display_phone: '(555) 012-3462',
            url: 'https://example.com/theater1',
            image_url: 'https://example.com/theater1.jpg',
            is_closed: false,
            transactions: ['show_tickets']
          }
        ];
        
      default:
        return [];
    }
  }

  // =============================================================================
  // YELP AI API METHODS
  // =============================================================================

  async chatWithAI(request: YelpAIRequest): Promise<ApiResponse<YelpAIResponse>> {
    // Convert our format to Yelp AI API format
    const lastMessage = request.messages[request.messages.length - 1];
    
    // Format location for Yelp AI API
    let locationString = '';
    if (request.location) {
      if (request.location.address) {
        locationString = request.location.address;
      } else if (request.location.city && request.location.state) {
        locationString = `${request.location.city}, ${request.location.state}`;
      } else if (request.location.latitude && request.location.longitude) {
        locationString = `${request.location.latitude},${request.location.longitude}`;
      }
    }
    
    const yelpRequest = {
      query: lastMessage.content + (locationString ? ` near ${locationString}` : ''),
      location: locationString || undefined
    };

    const response = await this.makeRequest<any>(
      YELP_API_CONFIG.AI_ENDPOINT,
      {
        method: 'POST',
        body: JSON.stringify(yelpRequest),
      }
    );

    if (!response.success) {
      return response;
    }

    // Convert Yelp AI response to our format
    const yelpData = response.data;
    const businesses = yelpData.entities?.[0]?.businesses?.map((biz: any) => ({
      id: biz.id,
      name: biz.name,
      rating: biz.rating,
      review_count: biz.review_count,
      price: biz.price || '$',
      categories: biz.categories || [],
      location: {
        address1: biz.location.address1,
        address2: biz.location.address2,
        city: biz.location.city,
        state: biz.location.state,
        zip_code: biz.location.zip_code,
        country: biz.location.country,
        display_address: biz.location.formatted_address?.split('\n') || []
      },
      coordinates: biz.coordinates,
      photos: biz.contextual_info?.photos?.map((p: any) => p.original_url) || [],
      phone: biz.phone || '',
      display_phone: biz.phone || '',
      url: biz.url,
      image_url: biz.contextual_info?.photos?.[0]?.original_url || '',
      is_closed: false,
      transactions: biz.contextual_info?.accepts_reservations_through_yelp ? ['restaurant_reservation'] : [],
      reservationUrl: biz.contextual_info?.accepts_reservations_through_yelp ? biz.url : undefined
    })) || [];

    const convertedResponse: YelpAIResponse = {
      message: yelpData.response?.text || 'I found some great options for you!',
      businesses,
      suggested_actions: ['Make a reservation', 'Get directions', 'View menu'],
      requires_clarification: false,
      timestamp: new Date().toISOString()
    };

    return {
      success: true,
      data: convertedResponse
    };
  }

  async handleTravelQuery(
    query: string, 
    category: string, 
    location?: Location
  ): Promise<ApiResponse<YelpAIResponse>> {
    // For non-dining queries, use enhanced mock data system
    // In a real implementation, this would integrate with various travel APIs
    
    if (category === 'dining') {
      // Use regular Yelp AI API for dining queries
      return this.chatWithAI({
        messages: [{ role: 'user', content: query }],
        location
      });
    }
    
    // Use enhanced mock data system for other travel categories
    const mockBusinesses = this.getEnhancedMockTravelData(category, location, query);
    const locationName = location?.city || 'your area';
    
    let responseMessage = '';
    let suggestedActions: string[] = [];
    
    switch (category) {
      case 'accommodation':
        responseMessage = `I found some great accommodation options in ${locationName}!`;
        suggestedActions = ['Check availability', 'Compare prices', 'See amenities', 'Book now'];
        break;
      case 'attractions':
        responseMessage = `Here are some amazing attractions to explore in ${locationName}!`;
        suggestedActions = ['Get tickets', 'Check hours', 'Plan visit', 'See more attractions'];
        break;
      case 'transportation':
        responseMessage = `Here are transportation options in ${locationName}!`;
        suggestedActions = ['Check schedules', 'Book tickets', 'Get directions', 'Compare prices'];
        break;
      case 'entertainment':
        responseMessage = `I found some great entertainment options in ${locationName}!`;
        suggestedActions = ['Get tickets', 'Check showtimes', 'See upcoming events', 'Make reservations'];
        break;
      default:
        responseMessage = `Here are some travel options in ${locationName}!`;
        suggestedActions = ['Learn more', 'Get directions', 'Check availability', 'Plan visit'];
    }
    
    const travelResponse: YelpAIResponse = {
      message: responseMessage,
      businesses: mockBusinesses,
      suggested_actions: suggestedActions,
      requires_clarification: false,
      timestamp: new Date().toISOString()
    };
    
    return {
      success: true,
      data: travelResponse
    };
  }

  // Enhanced mock data integration
  private getEnhancedMockTravelData(category: string, location?: Location, query?: string): Business[] {
    // Map category names to our enhanced system
    const categoryMap: Record<string, string> = {
      'accommodation': 'hotels',
      'attractions': 'attractions',
      'transportation': 'transportation',
      'entertainment': 'attractions', // Entertainment is part of attractions
      'dining': 'dining'
    };
    
    const mappedCategory = categoryMap[category] || 'hotels';
    
    // Extract filters from query if possible
    const filters: any = {};
    if (query) {
      const lowerQuery = query.toLowerCase();
      
      // Price range detection
      if (lowerQuery.includes('budget') || lowerQuery.includes('cheap')) {
        filters.priceRange = '$';
      } else if (lowerQuery.includes('luxury') || lowerQuery.includes('expensive')) {
        filters.priceRange = '$$$$';
      } else if (lowerQuery.includes('mid-range') || lowerQuery.includes('moderate')) {
        filters.priceRange = '$$';
      }
      
      // Rating detection
      if (lowerQuery.includes('highly rated') || lowerQuery.includes('best')) {
        filters.rating = 4.0;
      }
      
      // Amenity detection
      const amenityKeywords = ['pool', 'gym', 'wifi', 'parking', 'restaurant', 'spa'];
      const detectedAmenities = amenityKeywords.filter(amenity => lowerQuery.includes(amenity));
      if (detectedAmenities.length > 0) {
        filters.amenities = detectedAmenities;
      }
    }
    
    const mockBusinesses = getMockTravelData(mappedCategory as any, location, filters);
    
    // Convert enhanced mock businesses to standard Business format
    return mockBusinesses.map((business: any) => ({
      id: business.id,
      name: business.name,
      rating: business.rating,
      review_count: business.review_count,
      price: business.price,
      categories: business.categories,
      location: business.location,
      coordinates: business.coordinates,
      photos: business.photos,
      phone: business.phone,
      display_phone: business.display_phone,
      url: business.url,
      image_url: business.image_url,
      is_closed: business.is_closed,
      transactions: business.transactions,
      reservationUrl: business.reservationUrl
    }));
  }

  // =============================================================================
  // TRAVEL-SPECIFIC SEARCH METHODS
  // =============================================================================

  async searchAccommodations(params: YelpSearchParams & {
    accommodationType?: 'hotel' | 'hostel' | 'vacation_rental' | 'resort';
    priceRange?: 'budget' | 'mid-range' | 'luxury';
  }): Promise<ApiResponse<{ businesses: Business[] }>> {
    // For now, return mock data
    // In a real implementation, this would integrate with hotel booking APIs
    const mockData = this.generateMockTravelData('accommodation', {
      city: params.location,
      latitude: params.latitude,
      longitude: params.longitude
    });
    
    return {
      success: true,
      data: { businesses: mockData }
    };
  }

  async searchAttractions(params: YelpSearchParams & {
    attractionType?: 'museum' | 'park' | 'landmark' | 'entertainment';
  }): Promise<ApiResponse<{ businesses: Business[] }>> {
    // For now, return mock data
    // In a real implementation, this would integrate with attraction APIs
    const mockData = this.generateMockTravelData('attractions', {
      city: params.location,
      latitude: params.latitude,
      longitude: params.longitude
    });
    
    return {
      success: true,
      data: { businesses: mockData }
    };
  }

  async searchTransportation(params: YelpSearchParams & {
    transportType?: 'flight' | 'train' | 'bus' | 'local';
  }): Promise<ApiResponse<{ businesses: Business[] }>> {
    // For now, return mock data
    // In a real implementation, this would integrate with transportation APIs
    const mockData = this.generateMockTravelData('transportation', {
      city: params.location,
      latitude: params.latitude,
      longitude: params.longitude
    });
    
    return {
      success: true,
      data: { businesses: mockData }
    };
  }

  async searchEntertainment(params: YelpSearchParams & {
    entertainmentType?: 'theater' | 'music' | 'nightlife' | 'events';
  }): Promise<ApiResponse<{ businesses: Business[] }>> {
    // For now, return mock data
    // In a real implementation, this would integrate with entertainment APIs
    const mockData = this.generateMockTravelData('entertainment', {
      city: params.location,
      latitude: params.latitude,
      longitude: params.longitude
    });
    
    return {
      success: true,
      data: { businesses: mockData }
    };
  }

  // =============================================================================
  // BUSINESS SEARCH METHODS
  // =============================================================================

  async searchBusinesses(params: YelpSearchParams): Promise<ApiResponse<{ businesses: Business[] }>> {
    const searchParams = new URLSearchParams();
    
    // Add location parameters
    if (params.latitude && params.longitude) {
      searchParams.append('latitude', params.latitude.toString());
      searchParams.append('longitude', params.longitude.toString());
    } else if (params.location) {
      searchParams.append('location', params.location);
    }

    // Add other search parameters
    if (params.term) searchParams.append('term', params.term);
    if (params.categories) searchParams.append('categories', params.categories);
    if (params.price) searchParams.append('price', params.price);
    if (params.radius) searchParams.append('radius', params.radius.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params.open_now !== undefined) searchParams.append('open_now', params.open_now.toString());

    return this.makeRequest<{ businesses: Business[] }>(
      `${YELP_API_CONFIG.SEARCH_ENDPOINT}?${searchParams.toString()}`
    );
  }

  async getBusinessDetails(params: YelpBusinessDetailsParams): Promise<ApiResponse<Business>> {
    return this.makeRequest<Business>(
      `${YELP_API_CONFIG.BUSINESS_ENDPOINT}/${params.businessId}`
    );
  }

  // =============================================================================
  // RESERVATION METHODS
  // =============================================================================

  async checkReservationAvailability(params: YelpReservationParams): Promise<ApiResponse<{
    available_times: string[];
    booking_url?: string;
  }>> {
    // This would integrate with Yelp's reservation system
    // For now, return a mock response
    return {
      success: true,
      data: {
        available_times: ['18:00', '18:30', '19:00', '19:30', '20:00'],
        booking_url: `https://www.yelp.com/reservations/${params.businessId}`,
      },
    };
  }

  async makeReservation(params: YelpReservationParams & {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
  }): Promise<ApiResponse<{
    confirmation_id: string;
    status: 'confirmed' | 'pending';
  }>> {
    // This would integrate with Yelp's reservation system
    // For now, return a mock response
    return {
      success: true,
      data: {
        confirmation_id: `RES_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'confirmed' as const,
      },
    };
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  async healthCheck(): Promise<ApiResponse<{ status: string }>> {
    return this.makeRequest<{ status: string }>('/health', {
      method: 'GET',
    });
  }

  updateConfig(newConfig: Partial<YelpAPIClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): YelpAPIClientConfig {
    return { ...this.config };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let yelpClientInstance: YelpAPIClient | null = null;

export function createYelpClient(config: YelpAPIClientConfig): YelpAPIClient {
  return new YelpAPIClient(config);
}

export function getYelpClient(): YelpAPIClient {
  if (!yelpClientInstance) {
    const apiKey = process.env.YELP_API_KEY;
    if (!apiKey) {
      throw new Error('YELP_API_KEY environment variable is required');
    }
    
    yelpClientInstance = new YelpAPIClient({ apiKey });
  }
  
  return yelpClientInstance;
}

// =============================================================================
// TRAVEL QUERY HELPERS
// =============================================================================

export function categorizeTravelQuery(query: string): {
  category: 'dining' | 'accommodation' | 'attractions' | 'transportation' | 'entertainment' | 'general';
  confidence: number;
} {
  const content = query.toLowerCase();
  
  // Accommodation keywords
  if (content.includes('hotel') || content.includes('accommodation') || content.includes('stay') || 
      content.includes('lodge') || content.includes('resort') || content.includes('airbnb')) {
    return { category: 'accommodation', confidence: 0.9 };
  }
  
  // Attraction keywords
  if (content.includes('museum') || content.includes('attraction') || content.includes('tourist') ||
      content.includes('sightseeing') || content.includes('landmark') || content.includes('visit') ||
      content.includes('things to do') || content.includes('places to see')) {
    return { category: 'attractions', confidence: 0.8 };
  }
  
  // Transportation keywords
  if (content.includes('flight') || content.includes('train') || content.includes('bus') ||
      content.includes('transport') || content.includes('airport') || content.includes('ticket') ||
      content.includes('how to get')) {
    return { category: 'transportation', confidence: 0.8 };
  }
  
  // Entertainment keywords
  if (content.includes('theater') || content.includes('show') || content.includes('concert') ||
      content.includes('nightlife') || content.includes('entertainment') || content.includes('music') ||
      content.includes('bar') || content.includes('club')) {
    return { category: 'entertainment', confidence: 0.7 };
  }
  
  // Dining keywords (existing functionality)
  if (content.includes('restaurant') || content.includes('food') || content.includes('eat') ||
      content.includes('dining') || content.includes('cuisine') || content.includes('meal')) {
    return { category: 'dining', confidence: 0.9 };
  }
  
  return { category: 'general', confidence: 0.3 };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function formatYelpBusiness(yelpBusiness: any): Business {
  return {
    id: yelpBusiness.id,
    name: yelpBusiness.name,
    rating: yelpBusiness.rating,
    review_count: yelpBusiness.review_count,
    price: yelpBusiness.price || '$',
    categories: yelpBusiness.categories || [],
    location: yelpBusiness.location,
    coordinates: yelpBusiness.coordinates,
    photos: yelpBusiness.photos || [],
    hours: yelpBusiness.hours,
    phone: yelpBusiness.phone || '',
    display_phone: yelpBusiness.display_phone || '',
    url: yelpBusiness.url,
    image_url: yelpBusiness.image_url,
    is_closed: yelpBusiness.is_closed || false,
    distance: yelpBusiness.distance,
    transactions: yelpBusiness.transactions || [],
    reservationUrl: yelpBusiness.reservation_url,
  };
}

export function createYelpAIRequest(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  location?: Location
): YelpAIRequest {
  const request: YelpAIRequest = {
    messages: messages.map((msg, index) => ({
      role: msg.role,
      content: msg.content,
      timestamp: new Date().toISOString(),
    })),
  };

  if (location) {
    request.location = location;
  }

  return request;
}

// =============================================================================
// ERROR HANDLING UTILITIES
// =============================================================================

export function isYelpAPIError(error: any): error is { message: string; code: string; details?: any } {
  return error && typeof error.message === 'string' && typeof error.code === 'string';
}

export function getErrorMessage(error: any): string {
  if (isYelpAPIError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return ERROR_MESSAGES.GENERIC_ERROR;
}