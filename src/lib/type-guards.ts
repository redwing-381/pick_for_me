// Type guards and validation utilities for Pick For Me application

import type {
  Location,
  Business,
  ConversationMessage,
  UserPreferences,
  PriceRange,
  BookingStatus,
  ConversationStage,
  YelpAIResponse,
  BookingResponse
} from './types';
import { isValidCoordinates as validateCoordinates } from './location-utils';

// =============================================================================
// LOCATION TYPE GUARDS
// =============================================================================

export function isValidLocation(location: unknown): location is Location {
  return (
    typeof location === 'object' &&
    location !== null &&
    typeof (location as Location).latitude === 'number' &&
    typeof (location as Location).longitude === 'number' &&
    Math.abs((location as Location).latitude) <= 90 &&
    Math.abs((location as Location).longitude) <= 180 &&
    // Address is optional, but if provided should be a string
    (!(location as Location).address || typeof (location as Location).address === 'string') &&
    // City and state are optional for basic location validation
    (!(location as Location).city || typeof (location as Location).city === 'string') &&
    (!(location as Location).state || typeof (location as Location).state === 'string')
  );
}

export function isValidCoordinates(lat: number, lng: number): boolean {
  return validateCoordinates(lat, lng);
}

// =============================================================================
// BUSINESS TYPE GUARDS
// =============================================================================

export function isValidBusiness(business: unknown): business is Business {
  return (
    typeof business === 'object' &&
    business !== null &&
    typeof (business as Business).id === 'string' &&
    typeof (business as Business).name === 'string' &&
    typeof (business as Business).rating === 'number' &&
    (business as Business).rating >= 0 &&
    (business as Business).rating <= 5 &&
    typeof (business as Business).phone === 'string' &&
    typeof (business as Business).location === 'object'
  );
}

export function hasReservations(business: Business): boolean {
  return (
    business.reservationUrl !== undefined ||
    business.transactions.includes('restaurant_reservation') ||
    business.phone !== ''
  );
}

// =============================================================================
// MESSAGE TYPE GUARDS
// =============================================================================

export function isValidMessage(message: unknown): message is ConversationMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    typeof (message as ConversationMessage).id === 'string' &&
    typeof (message as ConversationMessage).content === 'string' &&
    ['user', 'assistant'].includes((message as ConversationMessage).role) &&
    (message as ConversationMessage).timestamp instanceof Date
  );
}

export function isUserMessage(message: ConversationMessage): boolean {
  return message.role === 'user';
}

export function isAssistantMessage(message: ConversationMessage): boolean {
  return message.role === 'assistant';
}

// =============================================================================
// PREFERENCES TYPE GUARDS
// =============================================================================

export function isValidPriceRange(price: unknown): price is PriceRange {
  return typeof price === 'string' && ['$', '$$', '$$$', '$$$$'].includes(price);
}

export function isValidUserPreferences(preferences: unknown): preferences is UserPreferences {
  if (typeof preferences !== 'object' || preferences === null) {
    return false;
  }
  
  const pref = preferences as UserPreferences;
  
  return (
    Array.isArray(pref.cuisineTypes) &&
    Array.isArray(pref.dietaryRestrictions) &&
    typeof pref.atmosphere === 'string' &&
    typeof pref.partySize === 'number' &&
    pref.partySize > 0 &&
    pref.partySize <= 20 &&
    isValidPriceRange(pref.priceRange)
  );
}

// =============================================================================
// STATUS TYPE GUARDS
// =============================================================================

export function isValidBookingStatus(status: unknown): status is BookingStatus {
  return (
    typeof status === 'string' &&
    ['idle', 'checking_availability', 'booking', 'confirmed', 'failed', 'cancelled'].includes(status)
  );
}

export function isValidConversationStage(stage: unknown): stage is ConversationStage {
  return (
    typeof stage === 'string' &&
    ['initial', 'gathering_preferences', 'location_detection', 'searching', 'decision_made', 'booking', 'completed'].includes(stage)
  );
}

// =============================================================================
// API RESPONSE TYPE GUARDS
// =============================================================================

export function isValidYelpAIResponse(response: unknown): response is YelpAIResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof (response as YelpAIResponse).message === 'string'
  );
}

export function isValidBookingResponse(response: unknown): response is BookingResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    typeof (response as BookingResponse).success === 'boolean'
  );
}

// =============================================================================
// VALIDATION UTILITIES
// =============================================================================

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePhoneNumber(phone: string): boolean {
  // Basic phone number validation (US format)
  const phoneRegex = /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

export function validatePartySize(size: number): boolean {
  return Number.isInteger(size) && size > 0 && size <= 20;
}

export function validateTimeString(time: string): boolean {
  // Validate time in HH:MM format
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

export function validateDateString(date: string): boolean {
  // Validate date in YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function sanitizeUserInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}

export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateBookingId(): string {
  return `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// CONTACT INFO TYPE GUARDS
// =============================================================================

export function isValidContactInfo(contact: unknown): contact is import('./types').ContactInfo {
  return (
    typeof contact === 'object' &&
    contact !== null &&
    typeof (contact as any).name === 'string' &&
    (contact as any).name.trim().length > 0 &&
    typeof (contact as any).phone === 'string' &&
    validatePhoneNumber((contact as any).phone) &&
    typeof (contact as any).email === 'string' &&
    validateEmail((contact as any).email)
  );
}