// Yelp API client utilities for Pick For Me application

import type { 
  YelpAIRequest, 
  YelpAIResponse, 
  Business, 
  Location,
  ApiResponse 
} from './types';
import { YELP_API_CONFIG, ERROR_MESSAGES } from './constants';

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