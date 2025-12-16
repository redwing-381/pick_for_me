// Application constants for Pick For Me

import type { PriceRange } from './types';

// =============================================================================
// API CONFIGURATION
// =============================================================================

export const API_ENDPOINTS = {
  YELP_AI: '/api/chat',
  LOCATION: '/api/location',
  BOOKING: '/api/booking',
} as const;

export const YELP_API_CONFIG = {
  BASE_URL: 'https://api.yelp.com',
  AI_ENDPOINT: '/ai/chat/v2',
  BUSINESS_ENDPOINT: '/v3/businesses',
  SEARCH_ENDPOINT: '/v3/businesses/search',
  TIMEOUT: 10000, // 10 seconds
  MAX_RETRIES: 3,
} as const;

// =============================================================================
// USER PREFERENCES
// =============================================================================

export const PRICE_RANGES: readonly PriceRange[] = ['$', '$$', '$$$', '$$$$'] as const;

export const PRICE_RANGE_LABELS = {
  '$': 'Under $15',
  '$$': '$15-30',
  '$$$': '$30-60',
  '$$$$': 'Above $60',
} as const;

export const CUISINE_TYPES = [
  'American',
  'Italian',
  'Chinese',
  'Mexican',
  'Japanese',
  'Indian',
  'Thai',
  'French',
  'Mediterranean',
  'Korean',
  'Vietnamese',
  'Greek',
  'Spanish',
  'Middle Eastern',
  'Seafood',
  'Steakhouse',
  'Pizza',
  'Sushi',
  'BBQ',
  'Vegetarian',
  'Vegan',
  'Fast Food',
  'Cafe',
  'Bakery',
  'Dessert',
] as const;

export const DIETARY_RESTRICTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Nut-Free',
  'Halal',
  'Kosher',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Low-Sodium',
] as const;

export const ATMOSPHERE_OPTIONS = [
  'Casual',
  'Fine Dining',
  'Family-Friendly',
  'Romantic',
  'Business',
  'Quick Bite',
  'Trendy',
  'Cozy',
  'Lively',
  'Quiet',
  'Outdoor Seating',
  'Bar Scene',
] as const;

// =============================================================================
// BOOKING CONFIGURATION
// =============================================================================

export const BOOKING_CONFIG = {
  MIN_PARTY_SIZE: 1,
  MAX_PARTY_SIZE: 20,
  DEFAULT_PARTY_SIZE: 2,
  ADVANCE_BOOKING_DAYS: 30,
  MIN_BOOKING_TIME_HOURS: 1, // Minimum 1 hour in advance
  BOOKING_TIMEOUT: 30000, // 30 seconds
} as const;

export const TIME_SLOTS = [
  '11:00', '11:30',
  '12:00', '12:30',
  '13:00', '13:30',
  '14:00', '14:30',
  '15:00', '15:30',
  '16:00', '16:30',
  '17:00', '17:30',
  '18:00', '18:30',
  '19:00', '19:30',
  '20:00', '20:30',
  '21:00', '21:30',
  '22:00',
] as const;

// =============================================================================
// LOCATION CONFIGURATION
// =============================================================================

export const LOCATION_CONFIG = {
  DEFAULT_RADIUS: 5000, // 5km in meters
  MAX_RADIUS: 25000, // 25km in meters
  GEOLOCATION_TIMEOUT: 10000, // 10 seconds
  GEOLOCATION_MAX_AGE: 300000, // 5 minutes
  SUPPORTED_COUNTRIES: ['US', 'CA'], // United States and Canada
} as const;

export const DEFAULT_LOCATIONS = {
  US: {
    latitude: 37.7749,
    longitude: -122.4194,
    address: 'San Francisco, CA',
    city: 'San Francisco',
    state: 'CA',
    country: 'US',
  },
  CA: {
    latitude: 43.6532,
    longitude: -79.3832,
    address: 'Toronto, ON',
    city: 'Toronto',
    state: 'ON',
    country: 'CA',
  },
} as const;

// =============================================================================
// UI CONFIGURATION
// =============================================================================

export const UI_CONFIG = {
  MAX_MESSAGES: 100,
  MESSAGE_BATCH_SIZE: 20,
  TYPING_DELAY: 1000, // 1 second
  AUTO_SCROLL_DELAY: 100,
  DEBOUNCE_DELAY: 300,
  TOAST_DURATION: 5000, // 5 seconds
} as const;

export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
} as const;

// =============================================================================
// SEARCH CONFIGURATION
// =============================================================================

export const SEARCH_CONFIG = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 50,
  MIN_RATING: 3.0,
  SORT_OPTIONS: ['best_match', 'rating', 'review_count', 'distance'] as const,
  DEFAULT_SORT: 'best_match' as const,
} as const;

// =============================================================================
// ERROR MESSAGES
// =============================================================================

export const ERROR_MESSAGES = {
  LOCATION_PERMISSION_DENIED: 'Location access denied. Please enter your location manually.',
  LOCATION_UNAVAILABLE: 'Unable to detect your location. Please try again or enter manually.',
  LOCATION_TIMEOUT: 'Location detection timed out. Please enter your location manually.',
  INVALID_LOCATION: 'Please enter a valid location.',
  
  API_NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  API_TIMEOUT: 'Request timed out. Please try again.',
  API_SERVER_ERROR: 'Server error. Please try again later.',
  API_RATE_LIMIT: 'Too many requests. Please wait a moment and try again.',
  
  BOOKING_FAILED: 'Booking failed. Please try again or call the restaurant directly.',
  BOOKING_UNAVAILABLE: 'No availability for the selected time. Please choose a different time.',
  BOOKING_INVALID_DATA: 'Please check your booking information and try again.',
  
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_PHONE: 'Please enter a valid phone number.',
  INVALID_PARTY_SIZE: 'Party size must be between 1 and 20 people.',
  INVALID_TIME: 'Please select a valid time.',
  INVALID_DATE: 'Please select a valid date.',
  
  GENERIC_ERROR: 'Something went wrong. Please try again.',
} as const;

// =============================================================================
// SUCCESS MESSAGES
// =============================================================================

export const SUCCESS_MESSAGES = {
  LOCATION_DETECTED: 'Location detected successfully!',
  BOOKING_CONFIRMED: 'Your reservation has been confirmed!',
  PREFERENCES_SAVED: 'Your preferences have been saved.',
} as const;

// =============================================================================
// CONVERSATION PROMPTS
// =============================================================================

export const CONVERSATION_PROMPTS = {
  WELCOME: "Hi! I'm here to help you find the perfect restaurant and make a reservation. What are you in the mood for today?",
  LOCATION_REQUEST: "I'll need to know your location to find nearby restaurants. Can I detect your location or would you prefer to enter it manually?",
  PREFERENCES_CLARIFICATION: "Let me ask a few questions to find the perfect match for you.",
  DECISION_MADE: "Based on your preferences, I've found the perfect restaurant for you!",
  BOOKING_CONFIRMATION: "Great choice! Let me help you make a reservation.",
  BOOKING_SUCCESS: "Perfect! Your reservation is confirmed. You should receive a confirmation email shortly.",
  BOOKING_ALTERNATIVE: "That time isn't available, but I found some alternative times that might work.",
  NO_RESULTS: "I couldn't find any restaurants matching your criteria. Would you like to adjust your preferences?",
} as const;

// =============================================================================
// REGEX PATTERNS
// =============================================================================

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_US: /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
  TIME_24H: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  POSTAL_CODE_US: /^\d{5}(-\d{4})?$/,
  POSTAL_CODE_CA: /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/,
} as const;

// =============================================================================
// LOCAL STORAGE KEYS
// =============================================================================

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'pick-for-me-preferences',
  USER_LOCATION: 'pick-for-me-location',
  CONVERSATION_HISTORY: 'pick-for-me-conversation',
  THEME: 'pick-for-me-theme',
  CONTACT_INFO: 'pick-for-me-contact',
} as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURE_FLAGS = {
  ENABLE_VOICE_INPUT: false,
  ENABLE_DARK_MODE: true,
  ENABLE_LOCATION_HISTORY: true,
  ENABLE_PREFERENCE_LEARNING: true,
  ENABLE_SOCIAL_SHARING: false,
  ENABLE_ANALYTICS: true,
} as const;