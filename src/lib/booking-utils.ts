// Booking utilities for Pick For Me application

import { 
  BookingInfo, 
  BookingResponse, 
  Business, 
  ContactInfo,
  BookingRequest 
} from './types';

// =============================================================================
// BOOKING CONFIRMATION UTILITIES
// =============================================================================

export interface BookingConfirmationData {
  booking: BookingInfo;
  business: Business;
  confirmationMessage: string;
  nextSteps: string[];
  contactInfo: {
    restaurantPhone: string;
    customerEmail: string;
  };
}

export function generateBookingConfirmation(
  booking: BookingInfo,
  business: Business
): BookingConfirmationData {
  const confirmationMessage = `Your reservation at ${business.name} has been confirmed for ${formatBookingDate(booking.date)} at ${formatBookingTime(booking.time)} for ${booking.partySize} ${booking.partySize === 1 ? 'person' : 'people'}.`;

  const nextSteps = [
    'A confirmation email has been sent to your email address',
    'Please arrive 10-15 minutes early for your reservation',
    'Bring a valid ID for verification',
    'Contact the restaurant if you need to make changes or cancel'
  ];

  // Add special requests to next steps if any
  if (booking.specialRequests) {
    nextSteps.push(`Your special request: "${booking.specialRequests}" has been noted`);
  }

  return {
    booking,
    business,
    confirmationMessage,
    nextSteps,
    contactInfo: {
      restaurantPhone: business.display_phone || business.phone,
      customerEmail: booking.userContact.email
    }
  };
}

export function formatBookingDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatBookingTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

// =============================================================================
// BOOKING ERROR HANDLING
// =============================================================================

export interface BookingErrorInfo {
  type: 'validation' | 'availability' | 'booking' | 'network' | 'unknown';
  title: string;
  message: string;
  suggestions: string[];
  canRetry: boolean;
  requiresPhoneCall: boolean;
  phoneNumber?: string;
  alternativeTimes?: string[];
  alternativeDates?: string[];
}

export function analyzeBookingError(response: BookingResponse): BookingErrorInfo {
  if (response.success) {
    throw new Error('Cannot analyze error for successful booking response');
  }

  const error = response.error!;
  
  switch (error.code) {
    case 'NO_ONLINE_RESERVATIONS':
      return {
        type: 'availability',
        title: 'Phone Reservation Required',
        message: 'This restaurant requires phone reservations and doesn\'t support online booking.',
        suggestions: [
          'Call the restaurant directly to make a reservation',
          'Ask about their availability and booking policies',
          'Mention any special requests when you call'
        ],
        canRetry: false,
        requiresPhoneCall: true,
        phoneNumber: response.phoneNumber
      };

    case 'TIME_UNAVAILABLE':
      return {
        type: 'availability',
        title: 'Requested Time Not Available',
        message: error.message,
        suggestions: [
          'Try one of the suggested alternative times',
          'Consider a different date',
          'Call the restaurant for more options'
        ],
        canRetry: true,
        requiresPhoneCall: false,
        alternativeTimes: response.alternativeTimes
      };

    case 'BOOKING_FAILED':
      return {
        type: 'booking',
        title: 'Booking Could Not Be Completed',
        message: error.message,
        suggestions: [
          'Try again in a few minutes',
          'Try a different time slot',
          'Call the restaurant directly'
        ],
        canRetry: true,
        requiresPhoneCall: true,
        phoneNumber: response.phoneNumber,
        alternativeTimes: response.alternativeTimes
      };

    case 'AVAILABILITY_CHECK_FAILED':
      return {
        type: 'network',
        title: 'Unable to Check Availability',
        message: 'We couldn\'t check availability at this time due to a technical issue.',
        suggestions: [
          'Check your internet connection',
          'Try again in a few minutes',
          'Call the restaurant directly'
        ],
        canRetry: true,
        requiresPhoneCall: true,
        phoneNumber: response.phoneNumber
      };

    default:
      return {
        type: 'unknown',
        title: 'Booking Error',
        message: error.message || 'An unexpected error occurred while processing your booking.',
        suggestions: [
          'Try again in a few minutes',
          'Check your information and try again',
          'Contact the restaurant directly'
        ],
        canRetry: true,
        requiresPhoneCall: true,
        phoneNumber: response.phoneNumber
      };
  }
}

// =============================================================================
// BOOKING VALIDATION UTILITIES
// =============================================================================

export interface BookingValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: string[];
}

export function validateBookingRequest(request: Partial<BookingRequest>): BookingValidationResult {
  const errors: Record<string, string> = {};
  const warnings: string[] = [];

  // Validate business
  if (!request.business) {
    errors.business = 'Restaurant information is required';
  }

  // Validate party size
  if (!request.partySize) {
    errors.partySize = 'Party size is required';
  } else if (request.partySize < 1 || request.partySize > 20) {
    errors.partySize = 'Party size must be between 1 and 20 people';
  } else if (request.partySize > 8) {
    warnings.push('Large parties may require special arrangements. Consider calling the restaurant.');
  }

  // Validate date
  if (!request.preferredDate) {
    errors.preferredDate = 'Date is required';
  } else {
    const requestedDate = new Date(request.preferredDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (requestedDate < today) {
      errors.preferredDate = 'Date cannot be in the past';
    }
    
    // Check if date is more than 60 days in the future
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    if (requestedDate > maxDate) {
      warnings.push('Reservations more than 60 days in advance may not be available.');
    }
    
    // Check if it's a weekend
    const dayOfWeek = requestedDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      warnings.push('Weekend reservations may be more difficult to secure.');
    }
  }

  // Validate time
  if (!request.preferredTime) {
    errors.preferredTime = 'Time is required';
  } else {
    const [hours] = request.preferredTime.split(':').map(Number);
    if (hours < 11 || hours > 22) {
      warnings.push('Reservations outside normal dining hours may not be available.');
    }
  }

  // Validate contact info
  if (!request.userContact) {
    errors.userContact = 'Contact information is required';
  } else {
    if (!request.userContact.name?.trim()) {
      errors.customerName = 'Name is required';
    }
    
    if (!request.userContact.phone?.trim()) {
      errors.customerPhone = 'Phone number is required';
    }
    
    if (!request.userContact.email?.trim()) {
      errors.customerEmail = 'Email address is required';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings
  };
}

// =============================================================================
// BOOKING STATUS UTILITIES
// =============================================================================

export function getBookingStatusMessage(status: string): string {
  switch (status) {
    case 'idle':
      return 'Ready to book';
    case 'checking_availability':
      return 'Checking availability...';
    case 'booking':
      return 'Processing your reservation...';
    case 'confirmed':
      return 'Reservation confirmed';
    case 'failed':
      return 'Booking failed';
    case 'cancelled':
      return 'Reservation cancelled';
    default:
      return 'Unknown status';
  }
}

export function isBookingInProgress(status: string): boolean {
  return ['checking_availability', 'booking'].includes(status);
}

export function isBookingComplete(status: string): boolean {
  return ['confirmed', 'failed', 'cancelled'].includes(status);
}

// =============================================================================
// ALTERNATIVE SUGGESTIONS
// =============================================================================

export function generateAlternativeTimeSlots(requestedTime: string, count: number = 5): string[] {
  const [hours, minutes] = requestedTime.split(':').map(Number);
  const alternatives: string[] = [];
  
  // Generate times around the requested time
  for (let offset = -90; offset <= 90; offset += 30) {
    if (offset === 0) continue; // Skip the original time
    
    const newMinutes = minutes + offset;
    const newHours = hours + Math.floor(newMinutes / 60);
    const finalMinutes = ((newMinutes % 60) + 60) % 60;
    const finalHours = ((newHours % 24) + 24) % 24;
    
    // Only suggest reasonable dining hours (11:00 - 22:30)
    if (finalHours >= 11 && (finalHours < 22 || (finalHours === 22 && finalMinutes <= 30))) {
      const timeString = `${finalHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
      alternatives.push(timeString);
    }
  }
  
  return alternatives.sort().slice(0, count);
}

export function generateAlternativeDates(requestedDate: string, count: number = 3): string[] {
  const baseDate = new Date(requestedDate);
  const alternatives: string[] = [];
  
  // Suggest next few days
  for (let i = 1; i <= count + 2; i++) {
    const altDate = new Date(baseDate);
    altDate.setDate(altDate.getDate() + i);
    
    // Skip if it would be more than 7 days out
    if (i > 7) break;
    
    alternatives.push(altDate.toISOString().split('T')[0]);
  }
  
  return alternatives.slice(0, count);
}

// =============================================================================
// BOOKING ANALYTICS
// =============================================================================

export interface BookingMetrics {
  totalAttempts: number;
  successRate: number;
  averagePartySize: number;
  popularTimes: string[];
  commonErrors: string[];
}

// This would be implemented with actual analytics in a production system
export function getBookingMetrics(): BookingMetrics {
  return {
    totalAttempts: 0,
    successRate: 0,
    averagePartySize: 2.5,
    popularTimes: ['19:00', '19:30', '20:00', '18:30', '20:30'],
    commonErrors: ['TIME_UNAVAILABLE', 'NO_ONLINE_RESERVATIONS']
  };
}