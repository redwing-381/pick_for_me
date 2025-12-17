// Enhanced mock data system for comprehensive travel testing
// Provides realistic data for hotels, attractions, transportation, and booking scenarios

import type { Business, Location } from './types';

// =============================================================================
// MOCK DATA TYPES
// =============================================================================

export interface MockBookingScenario {
  id: string;
  name: string;
  description: string;
  category: 'hotels' | 'attractions' | 'transportation' | 'dining';
  availability: 'available' | 'limited' | 'unavailable';
  errorCondition?: 'payment_failed' | 'fully_booked' | 'system_error' | 'invalid_dates';
  successRate: number; // 0-1
  responseTime: number; // milliseconds
}

export interface MockAvailabilityPattern {
  timeSlots: string[];
  dates: string[];
  capacity: number;
  priceVariation: { min: number; max: number };
  seasonalMultiplier: number;
}

export interface EnhancedMockBusiness extends Business {
  // Additional travel-specific fields
  bookingScenarios: MockBookingScenario[];
  availabilityPattern: MockAvailabilityPattern;
  amenities: string[];
  pricePerNight?: number;
  ticketPrice?: number;
  farePrice?: number;
  duration?: string;
  schedule?: string;
  capacity?: number;
  operatingHours?: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  seasonalInfo?: {
    peakSeason: { start: string; end: string };
    offSeason: { start: string; end: string };
  };
  specialOffers?: Array<{
    name: string;
    description: string;
    discount: number;
    validUntil: string;
  }>;
}

// =============================================================================
// COMPREHENSIVE MOCK DATA GENERATORS
// =============================================================================

export class TravelMockDataGenerator {
  private static instance: TravelMockDataGenerator;
  private mockBusinesses: Map<string, EnhancedMockBusiness[]> = new Map();
  private bookingScenarios: MockBookingScenario[] = [];
  private errorConditions: string[] = [];

  private constructor() {
    this.initializeMockData();
    this.initializeBookingScenarios();
    this.initializeErrorConditions();
  }

  public static getInstance(): TravelMockDataGenerator {
    if (!TravelMockDataGenerator.instance) {
      TravelMockDataGenerator.instance = new TravelMockDataGenerator();
    }
    return TravelMockDataGenerator.instance;
  }

  // =============================================================================
  // INITIALIZATION METHODS
  // =============================================================================

  private initializeMockData(): void {
    this.mockBusinesses.set('hotels', this.generateHotelData());
    this.mockBusinesses.set('attractions', this.generateAttractionData());
    this.mockBusinesses.set('transportation', this.generateTransportationData());
    this.mockBusinesses.set('dining', this.generateDiningData());
  }

  private initializeBookingScenarios(): void {
    this.bookingScenarios = [
      // Successful scenarios
      {
        id: 'success_immediate',
        name: 'Immediate Confirmation',
        description: 'Booking confirmed instantly with no issues',
        category: 'hotels',
        availability: 'available',
        successRate: 1.0,
        responseTime: 500
      },
      {
        id: 'success_delayed',
        name: 'Delayed Confirmation',
        description: 'Booking requires manual confirmation',
        category: 'attractions',
        availability: 'available',
        successRate: 0.95,
        responseTime: 2000
      },
      {
        id: 'limited_availability',
        name: 'Limited Availability',
        description: 'Only a few slots remaining',
        category: 'transportation',
        availability: 'limited',
        successRate: 0.7,
        responseTime: 1000
      },
      
      // Error scenarios
      {
        id: 'payment_failed',
        name: 'Payment Processing Error',
        description: 'Payment gateway failure simulation',
        category: 'hotels',
        availability: 'available',
        errorCondition: 'payment_failed',
        successRate: 0.0,
        responseTime: 3000
      },
      {
        id: 'fully_booked',
        name: 'Fully Booked',
        description: 'No availability for requested dates',
        category: 'attractions',
        availability: 'unavailable',
        errorCondition: 'fully_booked',
        successRate: 0.0,
        responseTime: 800
      },
      {
        id: 'system_error',
        name: 'System Error',
        description: 'Internal system error during booking',
        category: 'transportation',
        availability: 'available',
        errorCondition: 'system_error',
        successRate: 0.0,
        responseTime: 5000
      },
      {
        id: 'invalid_dates',
        name: 'Invalid Date Range',
        description: 'Requested dates are invalid or in the past',
        category: 'dining',
        availability: 'available',
        errorCondition: 'invalid_dates',
        successRate: 0.0,
        responseTime: 200
      }
    ];
  }

  private initializeErrorConditions(): void {
    this.errorConditions = [
      'network_timeout',
      'server_overload',
      'invalid_request',
      'authentication_failed',
      'rate_limit_exceeded',
      'service_unavailable',
      'data_validation_error',
      'external_api_failure'
    ];
  }

  // =============================================================================
  // HOTEL DATA GENERATION
  // =============================================================================

  private generateHotelData(): EnhancedMockBusiness[] {
    const hotelTypes = [
      { type: 'luxury', priceRange: '$$$', basePrice: 300 },
      { type: 'business', priceRange: '$$', basePrice: 150 },
      { type: 'budget', priceRange: '$', basePrice: 80 },
      { type: 'boutique', priceRange: '$$$', basePrice: 250 },
      { type: 'resort', priceRange: '$$$$', basePrice: 400 }
    ];

    const hotelNames = [
      'Grand Plaza Hotel', 'Business Center Inn', 'Budget Stay Express',
      'Boutique Garden Hotel', 'Oceanview Resort', 'Downtown Marriott',
      'Historic Inn & Suites', 'Modern Loft Hotel', 'Airport Comfort Inn',
      'Luxury Towers Hotel', 'Family Resort & Spa', 'Executive Business Hotel'
    ];

    const amenities = [
      'Free WiFi', 'Pool', 'Gym', 'Restaurant', 'Valet Parking',
      'Room Service', 'Business Center', 'Spa', 'Pet Friendly',
      'Airport Shuttle', 'Concierge', 'Laundry Service', 'Bar/Lounge',
      'Meeting Rooms', 'Continental Breakfast', 'Hot Tub', 'Tennis Court'
    ];

    return hotelNames.map((name, index) => {
      const hotelType = hotelTypes[index % hotelTypes.length];
      const selectedAmenities = this.selectRandomItems(amenities, 4, 8);
      
      return {
        id: `hotel_${index + 1}`,
        name,
        rating: 3.5 + Math.random() * 1.5,
        review_count: Math.floor(Math.random() * 2000) + 100,
        price: hotelType.priceRange,
        categories: [{ alias: 'hotel', title: 'Hotel' }],
        location: this.generateMockLocation(`${index + 1} Hotel Street`),
        coordinates: this.generateMockCoordinates(),
        photos: this.generateMockPhotos('hotel', 3),
        phone: this.generateMockPhone(),
        display_phone: this.generateMockDisplayPhone(),
        url: `https://example.com/hotel-${index + 1}`,
        image_url: `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center&q=80`,
        is_closed: false,
        transactions: ['booking_available', 'online_reservation'],
        
        // Enhanced travel-specific fields
        bookingScenarios: this.selectRandomItems(this.bookingScenarios.filter(s => s.category === 'hotels'), 2, 4),
        availabilityPattern: {
          timeSlots: ['Check-in: 3:00 PM', 'Check-out: 11:00 AM'],
          dates: this.generateAvailableDates(30),
          capacity: Math.floor(Math.random() * 200) + 50,
          priceVariation: { min: hotelType.basePrice * 0.8, max: hotelType.basePrice * 1.3 },
          seasonalMultiplier: 1.0 + (Math.random() * 0.5)
        },
        amenities: selectedAmenities,
        pricePerNight: hotelType.basePrice + Math.floor(Math.random() * 100),
        operatingHours: {
          'monday': { open: '00:00', close: '23:59' },
          'tuesday': { open: '00:00', close: '23:59' },
          'wednesday': { open: '00:00', close: '23:59' },
          'thursday': { open: '00:00', close: '23:59' },
          'friday': { open: '00:00', close: '23:59' },
          'saturday': { open: '00:00', close: '23:59' },
          'sunday': { open: '00:00', close: '23:59' }
        },
        seasonalInfo: {
          peakSeason: { start: '2024-06-01', end: '2024-08-31' },
          offSeason: { start: '2024-11-01', end: '2024-03-31' }
        },
        specialOffers: this.generateSpecialOffers()
      };
    });
  }

  // =============================================================================
  // ATTRACTION DATA GENERATION
  // =============================================================================

  private generateAttractionData(): EnhancedMockBusiness[] {
    const attractionTypes = [
      { type: 'museum', category: 'Museum', basePrice: 25 },
      { type: 'park', category: 'Park', basePrice: 15 },
      { type: 'landmark', category: 'Landmark', basePrice: 20 },
      { type: 'entertainment', category: 'Entertainment', basePrice: 35 },
      { type: 'tour', category: 'Tour', basePrice: 45 }
    ];

    const attractionNames = [
      'City Art Museum', 'Central Park', 'Historic Landmark Tower',
      'Adventure Theme Park', 'Guided City Tour', 'Science Discovery Center',
      'Botanical Gardens', 'Observatory & Planetarium', 'Cultural Heritage Site',
      'Waterfront Aquarium', 'Mountain Scenic Overlook', 'Interactive Tech Museum'
    ];

    const attractionAmenities = [
      'Guided Tours', 'Audio Guide', 'Gift Shop', 'Cafe', 'Parking',
      'Wheelchair Accessible', 'Photography Allowed', 'Group Discounts',
      'Educational Programs', 'Interactive Exhibits', 'Multilingual Support',
      'Online Tickets', 'Mobile App', 'Locker Rental'
    ];

    return attractionNames.map((name, index) => {
      const attractionType = attractionTypes[index % attractionTypes.length];
      const selectedAmenities = this.selectRandomItems(attractionAmenities, 3, 7);
      
      return {
        id: `attraction_${index + 1}`,
        name,
        rating: 4.0 + Math.random() * 1.0,
        review_count: Math.floor(Math.random() * 5000) + 200,
        price: this.getPriceRange(attractionType.basePrice),
        categories: [{ alias: attractionType.type, title: attractionType.category }],
        location: this.generateMockLocation(`${index + 1} Attraction Blvd`),
        coordinates: this.generateMockCoordinates(),
        photos: this.generateMockPhotos('attraction', 4),
        phone: this.generateMockPhone(),
        display_phone: this.generateMockDisplayPhone(),
        url: `https://example.com/attraction-${index + 1}`,
        image_url: `https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&crop=center&q=80`,
        is_closed: false,
        transactions: ['tickets_available', 'online_booking'],
        
        // Enhanced travel-specific fields
        bookingScenarios: this.selectRandomItems(this.bookingScenarios.filter(s => s.category === 'attractions'), 2, 3),
        availabilityPattern: {
          timeSlots: ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM', '5:00 PM'],
          dates: this.generateAvailableDates(60),
          capacity: Math.floor(Math.random() * 500) + 100,
          priceVariation: { min: attractionType.basePrice * 0.9, max: attractionType.basePrice * 1.2 },
          seasonalMultiplier: 1.0 + (Math.random() * 0.3)
        },
        amenities: selectedAmenities,
        ticketPrice: attractionType.basePrice + Math.floor(Math.random() * 20),
        duration: this.generateRandomDuration(),
        operatingHours: this.generateOperatingHours(),
        seasonalInfo: {
          peakSeason: { start: '2024-05-01', end: '2024-09-30' },
          offSeason: { start: '2024-12-01', end: '2024-02-28' }
        },
        specialOffers: this.generateSpecialOffers()
      };
    });
  }

  // =============================================================================
  // TRANSPORTATION DATA GENERATION
  // =============================================================================

  private generateTransportationData(): EnhancedMockBusiness[] {
    const transportTypes = [
      { type: 'airport_shuttle', category: 'Airport Shuttle', basePrice: 25 },
      { type: 'city_bus', category: 'Public Transit', basePrice: 3 },
      { type: 'taxi_service', category: 'Taxi Service', basePrice: 15 },
      { type: 'rental_car', category: 'Car Rental', basePrice: 45 },
      { type: 'train_service', category: 'Train', basePrice: 35 }
    ];

    const transportNames = [
      'Airport Express Shuttle', 'Metro City Bus', 'Yellow Cab Company',
      'Premium Car Rental', 'Regional Train Service', 'Ride Share Network',
      'Luxury Transport Service', 'Budget Bus Lines', 'Electric Scooter Share',
      'Bike Rental Station', 'Ferry Service', 'Helicopter Tours'
    ];

    const transportAmenities = [
      'WiFi', 'Air Conditioning', 'Luggage Storage', 'GPS Tracking',
      'Mobile App', 'Real-time Updates', 'Wheelchair Accessible',
      'Pet Friendly', 'Multiple Payment Options', 'Customer Support',
      'Insurance Included', 'Flexible Booking', 'Group Discounts'
    ];

    return transportNames.map((name, index) => {
      const transportType = transportTypes[index % transportTypes.length];
      const selectedAmenities = this.selectRandomItems(transportAmenities, 3, 6);
      
      return {
        id: `transport_${index + 1}`,
        name,
        rating: 3.8 + Math.random() * 1.2,
        review_count: Math.floor(Math.random() * 1500) + 50,
        price: this.getPriceRange(transportType.basePrice),
        categories: [{ alias: transportType.type, title: transportType.category }],
        location: this.generateMockLocation(`${index + 1} Transport Hub`),
        coordinates: this.generateMockCoordinates(),
        photos: this.generateMockPhotos('transport', 2),
        phone: this.generateMockPhone(),
        display_phone: this.generateMockDisplayPhone(),
        url: `https://example.com/transport-${index + 1}`,
        image_url: `https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=300&fit=crop&crop=center&q=80`,
        is_closed: false,
        transactions: ['booking_available', 'mobile_payment'],
        
        // Enhanced travel-specific fields
        bookingScenarios: this.selectRandomItems(this.bookingScenarios.filter(s => s.category === 'transportation'), 2, 3),
        availabilityPattern: {
          timeSlots: this.generateTransportSchedule(),
          dates: this.generateAvailableDates(90),
          capacity: Math.floor(Math.random() * 100) + 20,
          priceVariation: { min: transportType.basePrice * 0.8, max: transportType.basePrice * 1.5 },
          seasonalMultiplier: 1.0 + (Math.random() * 0.2)
        },
        amenities: selectedAmenities,
        farePrice: transportType.basePrice + Math.floor(Math.random() * 15),
        schedule: this.generateTransportScheduleDescription(),
        capacity: Math.floor(Math.random() * 100) + 20,
        operatingHours: this.generateTransportOperatingHours(),
        specialOffers: this.generateSpecialOffers()
      };
    });
  }

  // =============================================================================
  // DINING DATA GENERATION (Enhanced)
  // =============================================================================

  private generateDiningData(): EnhancedMockBusiness[] {
    const cuisineTypes = [
      { type: 'italian', category: 'Italian', basePrice: 35 },
      { type: 'asian', category: 'Asian Fusion', basePrice: 28 },
      { type: 'american', category: 'American', basePrice: 25 },
      { type: 'french', category: 'French', basePrice: 55 },
      { type: 'mexican', category: 'Mexican', basePrice: 20 }
    ];

    const restaurantNames = [
      'Bella Vista Italian', 'Dragon Palace Asian', 'All-American Grill',
      'Le Petit Bistro', 'Casa Mexico Cantina', 'Seafood Harbor',
      'Mountain View Steakhouse', 'Garden Fresh Cafe', 'Urban Kitchen',
      'Sunset Rooftop Bar', 'Family Diner', 'Gourmet Food Truck'
    ];

    const diningAmenities = [
      'Outdoor Seating', 'Full Bar', 'Wine List', 'Private Dining',
      'Takeout Available', 'Delivery', 'Vegan Options', 'Gluten-Free Menu',
      'Live Music', 'Happy Hour', 'Brunch', 'Late Night Dining',
      'Reservations Recommended', 'Group Friendly', 'Date Night Spot'
    ];

    return restaurantNames.map((name, index) => {
      const cuisineType = cuisineTypes[index % cuisineTypes.length];
      const selectedAmenities = this.selectRandomItems(diningAmenities, 4, 8);
      
      return {
        id: `restaurant_${index + 1}`,
        name,
        rating: 3.5 + Math.random() * 1.5,
        review_count: Math.floor(Math.random() * 3000) + 100,
        price: this.getPriceRange(cuisineType.basePrice),
        categories: [{ alias: cuisineType.type, title: cuisineType.category }],
        location: this.generateMockLocation(`${index + 1} Restaurant Row`),
        coordinates: this.generateMockCoordinates(),
        photos: this.generateMockPhotos('restaurant', 5),
        phone: this.generateMockPhone(),
        display_phone: this.generateMockDisplayPhone(),
        url: `https://example.com/restaurant-${index + 1}`,
        image_url: `https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&crop=center&q=80`,
        is_closed: false,
        transactions: ['restaurant_reservation', 'delivery', 'pickup'],
        
        // Enhanced travel-specific fields
        bookingScenarios: this.selectRandomItems(this.bookingScenarios.filter(s => s.category === 'dining'), 2, 3),
        availabilityPattern: {
          timeSlots: ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'],
          dates: this.generateAvailableDates(14),
          capacity: Math.floor(Math.random() * 150) + 50,
          priceVariation: { min: cuisineType.basePrice * 0.9, max: cuisineType.basePrice * 1.3 },
          seasonalMultiplier: 1.0 + (Math.random() * 0.2)
        },
        amenities: selectedAmenities,
        operatingHours: this.generateRestaurantHours(),
        specialOffers: this.generateSpecialOffers()
      };
    });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  private selectRandomItems<T>(items: T[], min: number, max: number): T[] {
    const count = Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffled = [...items].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  private generateMockLocation(address: string): any {
    const cities = ['San Francisco', 'New York', 'Los Angeles', 'Chicago', 'Miami', 'Seattle'];
    const states = ['CA', 'NY', 'CA', 'IL', 'FL', 'WA'];
    const cityIndex = Math.floor(Math.random() * cities.length);
    
    return {
      address1: address,
      city: cities[cityIndex],
      state: states[cityIndex],
      zip_code: `${Math.floor(Math.random() * 90000) + 10000}`,
      country: 'US',
      display_address: [address, `${cities[cityIndex]}, ${states[cityIndex]} ${Math.floor(Math.random() * 90000) + 10000}`]
    };
  }

  private generateMockCoordinates(): { latitude: number; longitude: number } {
    // Generate coordinates for major US cities
    const baseCoords = [
      { lat: 37.7749, lng: -122.4194 }, // San Francisco
      { lat: 40.7128, lng: -74.0060 },  // New York
      { lat: 34.0522, lng: -118.2437 }, // Los Angeles
      { lat: 41.8781, lng: -87.6298 },  // Chicago
      { lat: 25.7617, lng: -80.1918 },  // Miami
      { lat: 47.6062, lng: -122.3321 }  // Seattle
    ];
    
    const base = baseCoords[Math.floor(Math.random() * baseCoords.length)];
    return {
      latitude: base.lat + (Math.random() - 0.5) * 0.1,
      longitude: base.lng + (Math.random() - 0.5) * 0.1
    };
  }

  private generateMockPhotos(category: string, count: number): string[] {
    const photoUrls = {
      hotel: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b'
      ],
      attraction: [
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176'
      ],
      transport: [
        'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957',
        'https://images.unsplash.com/photo-1570125909232-eb263c188f7e',
        'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'
      ],
      restaurant: [
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5'
      ]
    };
    
    const urls = photoUrls[category as keyof typeof photoUrls] || photoUrls.hotel;
    return Array.from({ length: count }, (_, i) => 
      `${urls[i % urls.length]}?w=400&h=300&fit=crop&crop=center&q=80&sig=${Math.random()}`
    );
  }

  private generateMockPhone(): string {
    return `+1-555-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  private generateMockDisplayPhone(): string {
    const areaCode = Math.floor(Math.random() * 900) + 100;
    const exchange = Math.floor(Math.random() * 900) + 100;
    const number = Math.floor(Math.random() * 9000) + 1000;
    return `(${areaCode}) ${exchange}-${number}`;
  }

  private getPriceRange(basePrice: number): string {
    if (basePrice < 20) return '$';
    if (basePrice < 40) return '$$';
    if (basePrice < 60) return '$$$';
    return '$$$$';
  }

  private generateAvailableDates(days: number): string[] {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    
    return dates;
  }

  private generateRandomDuration(): string {
    const durations = [
      '1 hour', '1.5 hours', '2 hours', '2.5 hours', '3 hours',
      '3.5 hours', '4 hours', 'Half day', 'Full day', '2 days'
    ];
    return durations[Math.floor(Math.random() * durations.length)];
  }

  private generateOperatingHours(): any {
    const hours = {
      'monday': { open: '09:00', close: '17:00' },
      'tuesday': { open: '09:00', close: '17:00' },
      'wednesday': { open: '09:00', close: '17:00' },
      'thursday': { open: '09:00', close: '17:00' },
      'friday': { open: '09:00', close: '18:00' },
      'saturday': { open: '10:00', close: '18:00' },
      'sunday': { open: '10:00', close: '16:00' }
    };
    
    // Randomly close on some days
    if (Math.random() < 0.2) {
      (hours.monday as any).closed = true;
    }
    
    return hours;
  }

  private generateTransportSchedule(): string[] {
    const schedules = [];
    for (let hour = 6; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        schedules.push(time);
      }
    }
    return schedules;
  }

  private generateTransportScheduleDescription(): string {
    const descriptions = [
      'Every 15 minutes',
      'Every 30 minutes',
      'Hourly service',
      'Peak hours: Every 10 minutes',
      'On-demand service',
      'Scheduled departures'
    ];
    return descriptions[Math.floor(Math.random() * descriptions.length)];
  }

  private generateTransportOperatingHours(): any {
    return {
      'monday': { open: '05:00', close: '23:00' },
      'tuesday': { open: '05:00', close: '23:00' },
      'wednesday': { open: '05:00', close: '23:00' },
      'thursday': { open: '05:00', close: '23:00' },
      'friday': { open: '05:00', close: '01:00' },
      'saturday': { open: '06:00', close: '01:00' },
      'sunday': { open: '07:00', close: '22:00' }
    };
  }

  private generateRestaurantHours(): any {
    return {
      'monday': { open: '11:00', close: '22:00' },
      'tuesday': { open: '11:00', close: '22:00' },
      'wednesday': { open: '11:00', close: '22:00' },
      'thursday': { open: '11:00', close: '23:00' },
      'friday': { open: '11:00', close: '24:00' },
      'saturday': { open: '10:00', close: '24:00' },
      'sunday': { open: '10:00', close: '21:00' }
    };
  }

  private generateSpecialOffers(): Array<{ name: string; description: string; discount: number; validUntil: string }> {
    const offers = [
      {
        name: 'Early Bird Special',
        description: 'Book 7 days in advance and save',
        discount: 0.15,
        validUntil: '2024-12-31'
      },
      {
        name: 'Weekend Getaway',
        description: 'Special weekend rates',
        discount: 0.20,
        validUntil: '2024-06-30'
      },
      {
        name: 'Group Discount',
        description: 'Save when booking for 4 or more',
        discount: 0.10,
        validUntil: '2024-12-31'
      }
    ];
    
    return this.selectRandomItems(offers, 0, 2);
  }

  // =============================================================================
  // PUBLIC API METHODS
  // =============================================================================

  public getMockBusinesses(category: string, location?: Location, filters?: any): EnhancedMockBusiness[] {
    const businesses = this.mockBusinesses.get(category) || [];
    
    // Apply location filtering if provided
    let filteredBusinesses = businesses;
    if (location?.city) {
      filteredBusinesses = businesses.filter(b => 
        b.location.city.toLowerCase().includes(location.city!.toLowerCase())
      );
    }
    
    // Apply additional filters
    if (filters) {
      if (filters.priceRange) {
        filteredBusinesses = filteredBusinesses.filter(b => b.price === filters.priceRange);
      }
      if (filters.rating) {
        filteredBusinesses = filteredBusinesses.filter(b => b.rating >= filters.rating);
      }
      if (filters.amenities) {
        filteredBusinesses = filteredBusinesses.filter(b => 
          filters.amenities.some((amenity: string) => b.amenities.includes(amenity))
        );
      }
    }
    
    // Shuffle and limit results
    const shuffled = [...filteredBusinesses].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(10, shuffled.length));
  }

  public getBookingScenarios(category?: string): MockBookingScenario[] {
    if (category) {
      return this.bookingScenarios.filter(s => s.category === category);
    }
    return this.bookingScenarios;
  }

  public simulateBookingAttempt(businessId: string, scenario?: string): {
    success: boolean;
    confirmationId?: string;
    error?: string;
    responseTime: number;
    alternativeOptions?: any[];
  } {
    const startTime = Date.now();
    
    // Find the business
    let business: EnhancedMockBusiness | undefined;
    for (const [category, businesses] of Array.from(this.mockBusinesses.entries())) {
      business = businesses.find(b => b.id === businessId);
      if (business) break;
    }
    
    if (!business) {
      return {
        success: false,
        error: 'Business not found',
        responseTime: Date.now() - startTime
      };
    }
    
    // Select scenario
    let selectedScenario: MockBookingScenario;
    if (scenario) {
      selectedScenario = business.bookingScenarios.find(s => s.id === scenario) || business.bookingScenarios[0];
    } else {
      selectedScenario = business.bookingScenarios[Math.floor(Math.random() * business.bookingScenarios.length)];
    }
    
    // Simulate processing time
    const processingTime = selectedScenario.responseTime + (Math.random() * 1000);
    
    // Determine success based on scenario
    const isSuccessful = Math.random() < selectedScenario.successRate;
    
    if (isSuccessful) {
      return {
        success: true,
        confirmationId: `CONF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        responseTime: processingTime
      };
    } else {
      // Generate error based on scenario
      let errorMessage = 'Booking failed';
      let alternativeOptions: any[] = [];
      
      switch (selectedScenario.errorCondition) {
        case 'payment_failed':
          errorMessage = 'Payment processing failed. Please check your payment information.';
          break;
        case 'fully_booked':
          errorMessage = 'Sorry, no availability for the requested dates.';
          alternativeOptions = this.generateAlternativeOptions(business);
          break;
        case 'system_error':
          errorMessage = 'System temporarily unavailable. Please try again later.';
          break;
        case 'invalid_dates':
          errorMessage = 'Invalid date range. Please select valid future dates.';
          break;
        default:
          errorMessage = 'Booking could not be completed at this time.';
      }
      
      return {
        success: false,
        error: errorMessage,
        responseTime: processingTime,
        alternativeOptions: alternativeOptions.length > 0 ? alternativeOptions : undefined
      };
    }
  }

  public simulateErrorCondition(condition: string): {
    error: string;
    code: string;
    retryable: boolean;
    suggestedAction: string;
  } {
    const errorMap: Record<string, any> = {
      'network_timeout': {
        error: 'Request timed out. Please check your internet connection.',
        code: 'NETWORK_TIMEOUT',
        retryable: true,
        suggestedAction: 'Retry the request'
      },
      'server_overload': {
        error: 'Server is experiencing high traffic. Please try again later.',
        code: 'SERVER_OVERLOAD',
        retryable: true,
        suggestedAction: 'Wait a few minutes and retry'
      },
      'invalid_request': {
        error: 'Invalid request parameters provided.',
        code: 'INVALID_REQUEST',
        retryable: false,
        suggestedAction: 'Check request parameters'
      },
      'authentication_failed': {
        error: 'Authentication failed. Please check your credentials.',
        code: 'AUTH_FAILED',
        retryable: false,
        suggestedAction: 'Verify authentication credentials'
      },
      'rate_limit_exceeded': {
        error: 'Too many requests. Please slow down.',
        code: 'RATE_LIMITED',
        retryable: true,
        suggestedAction: 'Wait before making more requests'
      },
      'service_unavailable': {
        error: 'Service temporarily unavailable.',
        code: 'SERVICE_UNAVAILABLE',
        retryable: true,
        suggestedAction: 'Try again later'
      }
    };
    
    return errorMap[condition] || errorMap['service_unavailable'];
  }

  private generateAlternativeOptions(business: EnhancedMockBusiness): any[] {
    // Get similar businesses from the same category
    const category = Array.from(this.mockBusinesses.keys()).find(key => 
      this.mockBusinesses.get(key)?.some(b => b.id === business.id)
    );
    
    if (!category) return [];
    
    const similarBusinesses = this.mockBusinesses.get(category)?.filter(b => 
      b.id !== business.id && b.price === business.price
    ) || [];
    
    return similarBusinesses.slice(0, 3).map(b => ({
      id: b.id,
      name: b.name,
      rating: b.rating,
      price: b.price,
      availability: 'available'
    }));
  }

  public getAvailabilityPattern(businessId: string): MockAvailabilityPattern | null {
    for (const [category, businesses] of Array.from(this.mockBusinesses.entries())) {
      const business = businesses.find(b => b.id === businessId);
      if (business) {
        return business.availabilityPattern;
      }
    }
    return null;
  }

  public getAllCategories(): string[] {
    return Array.from(this.mockBusinesses.keys());
  }

  public getBusinessById(businessId: string): EnhancedMockBusiness | null {
    for (const [category, businesses] of Array.from(this.mockBusinesses.entries())) {
      const business = businesses.find(b => b.id === businessId);
      if (business) return business;
    }
    return null;
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const travelMockData = TravelMockDataGenerator.getInstance();

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export function getMockTravelData(
  category: 'hotels' | 'attractions' | 'transportation' | 'dining',
  location?: Location,
  filters?: any
): EnhancedMockBusiness[] {
  return travelMockData.getMockBusinesses(category, location, filters);
}

export function simulateBooking(businessId: string, scenario?: string) {
  return travelMockData.simulateBookingAttempt(businessId, scenario);
}

export function simulateError(condition: string) {
  return travelMockData.simulateErrorCondition(condition);
}

export function getBookingScenarios(category?: string) {
  return travelMockData.getBookingScenarios(category);
}