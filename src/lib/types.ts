// Core data types for Pick For Me application

// =============================================================================
// USER AND PREFERENCES
// =============================================================================

export interface User {
  id: string;
  preferences: UserPreferences;
  location: Location | null;
}

export interface UserPreferences {
  cuisineTypes: string[];
  priceRange: PriceRange;
  dietaryRestrictions: string[];
  atmosphere: string;
  partySize: number;
}

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

// =============================================================================
// LOCATION
// =============================================================================

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zipCode?: string;
  country?: string;
}

export interface LocationDetectionState {
  isDetecting: boolean;
  hasPermission: boolean | null;
  error: string | null;
}

export interface EnhancedLocation extends Location {
  zipCode: string;
  displayName: string;
  confidence: number;
  timezone?: string;
  localTime?: string;
}

export interface LocationDetails {
  formattedAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  timezone?: string;
  localTime?: string;
}

export interface LocationCacheEntry {
  location: EnhancedLocation;
  timestamp: number;
  expiresAt: number;
}

// =============================================================================
// BUSINESS AND RESTAURANT DATA
// =============================================================================

export interface Business {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  price: string;
  categories: BusinessCategory[];
  location: BusinessLocation;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  photos: string[];
  hours?: BusinessHours[];
  phone: string;
  display_phone: string;
  url: string;
  image_url: string;
  is_closed: boolean;
  distance?: number;
  transactions: string[];
  reservationUrl?: string;
}

export interface BusinessCategory {
  alias: string;
  title: string;
}

export interface BusinessLocation {
  address1: string;
  address2?: string;
  address3?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  display_address: string[];
  cross_streets?: string;
}

export interface BusinessHours {
  open: Array<{
    is_overnight: boolean;
    start: string;
    end: string;
    day: number;
  }>;
  hours_type: string;
  is_open_now: boolean;
}

// =============================================================================
// CONVERSATION AND MESSAGING
// =============================================================================

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  businesses?: Business[];
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  selectedBusiness?: Business;
  bookingInfo?: BookingInfo;
  userPreferences?: Partial<UserPreferences>;
  location?: Location;
  reasoning?: string;
  suggested_actions?: string[];
  interactive_suggestions?: InteractiveSuggestion[];
  requires_clarification?: boolean;
}

export interface InteractiveSuggestion {
  id: string;
  text: string;
  action: 'query' | 'book' | 'explore' | 'clarify';
  data?: any;
  category?: 'travel' | 'dining' | 'accommodation' | 'transportation' | 'attraction';
}

export interface ConversationState {
  messages: ConversationMessage[];
  isLoading: boolean;
  error: string | null;
  context: ConversationContext;
}

export interface ConversationContext {
  lastUserQuery: string;
  extractedPreferences: Partial<UserPreferences>;
  clarificationNeeded: boolean;
  stage: ConversationStage;
  travelContext?: TravelContext;
  interactionHistory: InteractionHistoryEntry[];
}

export interface TravelContext {
  destination?: Location;
  travelDates?: {
    startDate: Date;
    endDate: Date;
  };
  groupSize?: number;
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  travelStyle?: 'budget' | 'mid-range' | 'luxury' | 'adventure' | 'cultural';
  interests?: string[];
  currentItinerary?: TravelItinerary;
}

export interface TravelItinerary {
  id: string;
  name: string;
  destination: Location;
  days: ItineraryDay[];
  totalEstimatedCost?: number;
}

export interface ItineraryDay {
  date: Date;
  activities: PlannedActivity[];
  accommodation?: Business;
  meals: Business[];
  transportation?: TransportationPlan[];
  notes?: string;
}

export interface PlannedActivity {
  time: string;
  duration: number;
  activity: Business;
  category: 'dining' | 'attraction' | 'accommodation' | 'transportation' | 'entertainment';
  bookingRequired: boolean;
  bookingStatus: 'pending' | 'confirmed' | 'failed';
}

export interface TransportationPlan {
  type: 'flight' | 'train' | 'bus' | 'car' | 'taxi' | 'walking';
  from: Location;
  to: Location;
  departureTime: string;
  arrivalTime: string;
  cost?: number;
  bookingInfo?: BookingInfo;
}

export interface InteractionHistoryEntry {
  timestamp: Date;
  type: 'suggestion_clicked' | 'business_selected' | 'booking_attempted' | 'preference_updated';
  data: any;
}

export type ConversationStage = 
  | 'initial'
  | 'gathering_preferences'
  | 'location_detection'
  | 'searching'
  | 'decision_made'
  | 'booking'
  | 'completed'
  | 'travel_planning'
  | 'itinerary_building'
  | 'multi_category_search'
  | 'travel_booking';

// =============================================================================
// BOOKING AND RESERVATIONS
// =============================================================================

export interface BookingInfo {
  confirmationId: string;
  restaurantName: string;
  restaurantId: string;
  date: string;
  time: string;
  partySize: number;
  status: BookingStatus;
  userContact: ContactInfo;
  specialRequests?: string;
}

export type BookingStatus = 
  | 'idle' 
  | 'checking_availability' 
  | 'booking' 
  | 'confirmed' 
  | 'failed' 
  | 'cancelled';

export interface ContactInfo {
  name: string;
  phone: string;
  email: string;
}

export interface ReservationInfo {
  available_times: string[];
  booking_url?: string;
  requires_phone?: boolean;
  party_size_limit?: number;
  advance_booking_days?: number;
}

// =============================================================================
// APPLICATION STATE
// =============================================================================

export interface AppState {
  conversation: ConversationState;
  user: UserState;
  selection: SelectionState;
  ui: UIState;
}

export interface UserState {
  location: Location | null;
  locationDetection: LocationDetectionState;
  preferences: UserPreferences;
  contact: ContactInfo | null;
}

export interface SelectionState {
  currentBusiness: Business | null;
  alternatives: Business[];
  searchResults: Business[];
  bookingStatus: BookingStatus;
  currentBooking: BookingInfo | null;
}

export interface UIState {
  isLocationInputOpen: boolean;
  isBookingModalOpen: boolean;
  showAlternatives: boolean;
  theme: 'light' | 'dark';
}

// =============================================================================
// API INTERFACES - YELP AI API
// =============================================================================

export interface YelpAIRequest {
  messages: YelpAIMessage[];
  location?: Location;
  user_id?: string;
  session_id?: string;
}

export interface YelpAIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface YelpAIResponse {
  message: string;
  businesses?: Business[];
  reservation_info?: ReservationInfo;
  suggested_actions?: string[];
  requires_clarification?: boolean;
  clarification_questions?: string[];
  timestamp?: string;
}

export interface YelpBusiness {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  price: string;
  categories: Array<{
    alias: string;
    title: string;
  }>;
  location: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    display_address: string[];
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  photos: string[];
  phone: string;
  display_phone: string;
  url: string;
  image_url: string;
  is_closed: boolean;
  distance?: number;
}

// =============================================================================
// API INTERFACES - DECISION ENGINE
// =============================================================================

export interface DecisionRequest {
  userPreferences: UserPreferences;
  location: Location;
  businesses: Business[];
  conversationContext?: ConversationContext;
}

export interface DecisionResponse {
  selectedBusiness: Business;
  reasoning: string;
  confidence: number;
  alternatives?: Business[];
  factors: DecisionFactor[];
}

export interface DecisionFactor {
  name: string;
  weight: number;
  score: number;
  description: string;
}

// =============================================================================
// API INTERFACES - BOOKING
// =============================================================================

export interface BookingRequest {
  business: Business;
  partySize: number;
  preferredTime: string;
  preferredDate: string;
  userContact: ContactInfo;
  specialRequests?: string;
}

export interface BookingResponse {
  success: boolean;
  confirmationId?: string;
  bookingDetails?: BookingInfo;
  alternativeTimes?: string[];
  alternativeDates?: string[];
  error?: BookingError;
  requiresPhoneCall?: boolean;
  phoneNumber?: string;
}

export interface BookingError {
  code: string;
  message: string;
  details?: string;
  retryable: boolean;
}

// =============================================================================
// API INTERFACES - LOCATION
// =============================================================================

export interface LocationRequest {
  query?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface LocationResponse {
  location: Location;
  suggestions?: Location[];
  confidence: number;
}

// =============================================================================
// COMPONENT PROPS INTERFACES
// =============================================================================

export interface ChatInterfaceProps {
  messages: ConversationMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export interface RestaurantCardProps {
  restaurant: Business;
  onBook?: (restaurant: Business) => void;
  onSelect?: (restaurant: Business) => void;
  showBookingButton?: boolean;
  isSelected?: boolean;
}

export interface LocationInputProps {
  onLocationChange: (result: { location: Location | null; error: string | null }) => void;
  currentLocation: Location | null;
  isDetecting: boolean;
  error?: string | null;
  onDetectLocation: () => void;
}

export interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  onConfirmBooking: (bookingRequest: BookingRequest) => void;
  isLoading: boolean;
  error?: string | null;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type ApiResponse<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
};

export type LoadingState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// =============================================================================
// TYPE UTILITIES
// =============================================================================

// Constants are now exported from ./constants.ts to avoid naming conflicts