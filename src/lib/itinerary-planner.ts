// Itinerary planning system for multi-day travel coordination
// Handles activity scheduling, accommodation optimization, and travel logistics

import { 
  Business, 
  Location, 
  TravelItinerary, 
  ItineraryDay, 
  PlannedActivity, 
  TransportationPlan,
  TravelContext,
  UserPreferences
} from './types';
import { DecisionEngine } from './decision-engine';
import { getBookingOrchestrator } from './booking-orchestrator';

// =============================================================================
// ITINERARY PLANNING TYPES
// =============================================================================

export interface ItineraryRequest {
  destination: Location;
  startDate: Date;
  endDate: Date;
  groupSize: number;
  budget?: {
    min: number;
    max: number;
    currency: string;
  };
  preferences: UserPreferences;
  interests?: string[];
  travelStyle?: 'budget' | 'mid-range' | 'luxury' | 'adventure' | 'cultural';
  accommodationPreference?: 'hotel' | 'hostel' | 'apartment' | 'any';
}

export interface ItineraryResponse {
  success: boolean;
  itinerary?: TravelItinerary;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  alternatives?: Partial<TravelItinerary>[];
}

export interface ActivitySuggestion {
  business: Business;
  category: 'dining' | 'attraction' | 'accommodation' | 'transportation' | 'entertainment';
  priority: number;
  estimatedDuration: number; // in minutes
  bestTimeSlots: string[];
  cost?: number;
  reasoning: string;
}

export interface DayPlanningConstraints {
  date: Date;
  accommodation?: Business;
  fixedActivities?: PlannedActivity[];
  availableHours: {
    start: string;
    end: string;
  };
  budget?: number;
  transportationMode: 'walking' | 'public' | 'car' | 'mixed';
}

export interface ItineraryOptimizationResult {
  optimizedItinerary: TravelItinerary;
  improvements: string[];
  totalTravelTime: number;
  totalCost: number;
  balanceScore: number;
}

// =============================================================================
// ITINERARY PLANNER CLASS
// =============================================================================

export class ItineraryPlanner {
  private decisionEngine = DecisionEngine.getInstance();
  private bookingOrchestrator = getBookingOrchestrator();
  
  // =============================================================================
  // MAIN ITINERARY GENERATION
  // =============================================================================
  
  async generateItinerary(request: ItineraryRequest): Promise<ItineraryResponse> {
    try {
      console.log(`Generating itinerary for ${request.destination.city} from ${request.startDate.toDateString()} to ${request.endDate.toDateString()}`);
      
      // Validate request
      const validation = this.validateItineraryRequest(request);
      if (!validation.isValid) {
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid itinerary request',
            details: validation.errors.join(', ')
          }
        };
      }
      
      // Calculate trip duration
      const tripDays = Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (tripDays > 14) {
        return {
          success: false,
          error: {
            code: 'TRIP_TOO_LONG',
            message: 'Itinerary planning is limited to 14 days maximum',
            details: `Requested ${tripDays} days`
          }
        };
      }
      
      // Step 1: Find optimal accommodation
      const accommodation = await this.selectOptimalAccommodation(request);
      
      // Step 2: Generate activity suggestions for the destination
      const activitySuggestions = await this.generateActivitySuggestions(request);
      
      // Step 3: Create day-by-day itinerary
      const days = await this.planDailyActivities(request, accommodation, activitySuggestions);
      
      // Step 4: Optimize the itinerary
      const itinerary: TravelItinerary = {
        id: this.generateItineraryId(),
        name: `${request.destination.city} ${tripDays}-Day Trip`,
        destination: request.destination,
        days,
        totalEstimatedCost: this.calculateTotalCost(days, accommodation)
      };
      
      const optimizedResult = await this.optimizeItinerary(itinerary, request);
      
      return {
        success: true,
        itinerary: optimizedResult.optimizedItinerary
      };
      
    } catch (error) {
      console.error('Itinerary generation error:', error);
      return {
        success: false,
        error: {
          code: 'GENERATION_ERROR',
          message: 'Failed to generate itinerary',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
  
  // =============================================================================
  // ACCOMMODATION SELECTION
  // =============================================================================
  
  private async selectOptimalAccommodation(request: ItineraryRequest): Promise<Business | undefined> {
    try {
      // Mock accommodation selection - in real implementation, this would use the decision engine
      // to find the best hotel based on location, budget, and preferences
      
      const mockAccommodation: Business = {
        id: `hotel-${request.destination.city.toLowerCase().replace(/\s+/g, '-')}`,
        name: `Central ${request.destination.city} Hotel`,
        rating: 4.2,
        review_count: 456,
        price: request.budget ? this.getBudgetPriceRange(request.budget) : '$$',
        categories: [
          { alias: 'hotels', title: 'Hotels' },
          { alias: 'accommodation', title: 'Accommodation' }
        ],
        location: {
          address1: '123 Central Ave',
          city: request.destination.city,
          state: request.destination.state,
          zip_code: request.destination.zipCode || '00000',
          country: request.destination.country || 'US',
          display_address: [`123 Central Ave`, `${request.destination.city}, ${request.destination.state}`]
        },
        coordinates: {
          latitude: request.destination.latitude,
          longitude: request.destination.longitude
        },
        photos: ['https://via.placeholder.com/400x300'],
        phone: '+1234567890',
        display_phone: '(123) 456-7890',
        url: 'https://example.com',
        image_url: 'https://via.placeholder.com/400x300',
        is_closed: false,
        transactions: ['hotel_reservation'],
        distance: 0
      };
      
      return mockAccommodation;
      
    } catch (error) {
      console.error('Accommodation selection error:', error);
      return undefined;
    }
  }
  
  // =============================================================================
  // ACTIVITY SUGGESTION GENERATION
  // =============================================================================
  
  private async generateActivitySuggestions(request: ItineraryRequest): Promise<ActivitySuggestion[]> {
    try {
      // Mock activity suggestions - in real implementation, this would query
      // the Yelp API for attractions, restaurants, and activities in the destination
      
      const mockSuggestions: ActivitySuggestion[] = [
        {
          business: this.createMockBusiness('attraction', 'City Art Museum', request.destination),
          category: 'attraction',
          priority: 9,
          estimatedDuration: 180, // 3 hours
          bestTimeSlots: ['10:00', '14:00'],
          cost: 25,
          reasoning: 'Highly rated cultural attraction with excellent reviews'
        },
        {
          business: this.createMockBusiness('dining', 'Local Bistro', request.destination),
          category: 'dining',
          priority: 8,
          estimatedDuration: 90, // 1.5 hours
          bestTimeSlots: ['12:00', '18:00', '19:00'],
          cost: 45,
          reasoning: 'Popular local restaurant with authentic cuisine'
        },
        {
          business: this.createMockBusiness('attraction', 'Historic Downtown Walking Tour', request.destination),
          category: 'attraction',
          priority: 7,
          estimatedDuration: 120, // 2 hours
          bestTimeSlots: ['09:00', '15:00'],
          cost: 15,
          reasoning: 'Great way to explore the city and learn about local history'
        },
        {
          business: this.createMockBusiness('entertainment', 'Evening Jazz Club', request.destination),
          category: 'entertainment',
          priority: 6,
          estimatedDuration: 150, // 2.5 hours
          bestTimeSlots: ['20:00', '21:00'],
          cost: 35,
          reasoning: 'Authentic local entertainment experience'
        },
        {
          business: this.createMockBusiness('attraction', 'Scenic Waterfront Park', request.destination),
          category: 'attraction',
          priority: 5,
          estimatedDuration: 60, // 1 hour
          bestTimeSlots: ['08:00', '16:00', '17:00'],
          cost: 0,
          reasoning: 'Beautiful outdoor space for relaxation and photos'
        }
      ];
      
      // Filter suggestions based on interests and preferences
      return this.filterSuggestionsByPreferences(mockSuggestions, request);
      
    } catch (error) {
      console.error('Activity suggestion generation error:', error);
      return [];
    }
  }
  
  // =============================================================================
  // DAILY ACTIVITY PLANNING
  // =============================================================================
  
  private async planDailyActivities(
    request: ItineraryRequest, 
    accommodation: Business | undefined, 
    suggestions: ActivitySuggestion[]
  ): Promise<ItineraryDay[]> {
    const days: ItineraryDay[] = [];
    const currentDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
    
    while (currentDate <= endDate) {
      const dayConstraints: DayPlanningConstraints = {
        date: new Date(currentDate),
        accommodation,
        availableHours: {
          start: '08:00',
          end: '22:00'
        },
        budget: request.budget ? request.budget.max / Math.ceil((endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)) : undefined,
        transportationMode: 'mixed'
      };
      
      const dayPlan = await this.planSingleDay(dayConstraints, suggestions, request);
      days.push(dayPlan);
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }
  
  private async planSingleDay(
    constraints: DayPlanningConstraints, 
    suggestions: ActivitySuggestion[], 
    request: ItineraryRequest
  ): Promise<ItineraryDay> {
    const activities: PlannedActivity[] = [];
    const meals: Business[] = [];
    const transportation: TransportationPlan[] = [];
    
    // Plan morning activity (9:00-12:00)
    const morningActivity = this.selectActivityForTimeSlot(suggestions, '09:00', 180);
    if (morningActivity) {
      activities.push({
        time: '09:00',
        duration: morningActivity.estimatedDuration,
        activity: morningActivity.business,
        category: morningActivity.category,
        bookingRequired: morningActivity.category === 'attraction',
        bookingStatus: 'pending'
      });
    }
    
    // Plan lunch (12:00-13:30)
    const lunchSuggestion = suggestions.find(s => s.category === 'dining' && s.bestTimeSlots.includes('12:00'));
    if (lunchSuggestion) {
      meals.push(lunchSuggestion.business);
      activities.push({
        time: '12:00',
        duration: 90,
        activity: lunchSuggestion.business,
        category: 'dining',
        bookingRequired: true,
        bookingStatus: 'pending'
      });
    }
    
    // Plan afternoon activity (14:00-17:00)
    const afternoonActivity = this.selectActivityForTimeSlot(suggestions, '14:00', 180);
    if (afternoonActivity && afternoonActivity !== morningActivity) {
      activities.push({
        time: '14:00',
        duration: afternoonActivity.estimatedDuration,
        activity: afternoonActivity.business,
        category: afternoonActivity.category,
        bookingRequired: afternoonActivity.category === 'attraction',
        bookingStatus: 'pending'
      });
    }
    
    // Plan dinner (18:00-20:00)
    const dinnerSuggestion = suggestions.find(s => 
      s.category === 'dining' && 
      s.bestTimeSlots.some(slot => ['18:00', '19:00'].includes(slot)) &&
      s !== lunchSuggestion
    );
    if (dinnerSuggestion) {
      meals.push(dinnerSuggestion.business);
      activities.push({
        time: '18:00',
        duration: 120,
        activity: dinnerSuggestion.business,
        category: 'dining',
        bookingRequired: true,
        bookingStatus: 'pending'
      });
    }
    
    // Plan evening activity (20:30-23:00)
    const eveningActivity = suggestions.find(s => 
      s.category === 'entertainment' && 
      s.bestTimeSlots.some(slot => ['20:00', '21:00'].includes(slot))
    );
    if (eveningActivity) {
      activities.push({
        time: '20:30',
        duration: eveningActivity.estimatedDuration,
        activity: eveningActivity.business,
        category: 'entertainment',
        bookingRequired: true,
        bookingStatus: 'pending'
      });
    }
    
    return {
      date: constraints.date,
      activities,
      accommodation: constraints.accommodation,
      meals,
      transportation,
      notes: `Day ${Math.floor((constraints.date.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1} in ${request.destination.city}`
    };
  }
  
  // =============================================================================
  // ITINERARY OPTIMIZATION
  // =============================================================================
  
  async optimizeItinerary(itinerary: TravelItinerary, request: ItineraryRequest): Promise<ItineraryOptimizationResult> {
    try {
      // Calculate travel times between activities
      const totalTravelTime = this.calculateTotalTravelTime(itinerary);
      
      // Calculate total cost
      const totalCost = this.calculateTotalCost(itinerary.days, itinerary.days[0]?.accommodation);
      
      // Calculate balance score (variety of activities, rest time, etc.)
      const balanceScore = this.calculateBalanceScore(itinerary);
      
      // Generate optimization improvements
      const improvements = this.generateOptimizationSuggestions(itinerary, totalTravelTime, balanceScore);
      
      // Apply optimizations (for now, return the original itinerary)
      const optimizedItinerary = { ...itinerary };
      
      return {
        optimizedItinerary,
        improvements,
        totalTravelTime,
        totalCost,
        balanceScore
      };
      
    } catch (error) {
      console.error('Itinerary optimization error:', error);
      return {
        optimizedItinerary: itinerary,
        improvements: [],
        totalTravelTime: 0,
        totalCost: 0,
        balanceScore: 0.5
      };
    }
  }
  
  // =============================================================================
  // ITINERARY MODIFICATION
  // =============================================================================
  
  async modifyItinerary(
    itinerary: TravelItinerary, 
    modifications: {
      addActivity?: { day: number; activity: ActivitySuggestion; time: string };
      removeActivity?: { day: number; activityIndex: number };
      replaceActivity?: { day: number; activityIndex: number; newActivity: ActivitySuggestion };
      changeAccommodation?: Business;
    }
  ): Promise<TravelItinerary> {
    const modifiedItinerary = { ...itinerary };
    
    if (modifications.addActivity) {
      const { day, activity, time } = modifications.addActivity;
      if (modifiedItinerary.days[day]) {
        const newPlannedActivity: PlannedActivity = {
          time,
          duration: activity.estimatedDuration,
          activity: activity.business,
          category: activity.category,
          bookingRequired: activity.category === 'attraction' || activity.category === 'dining',
          bookingStatus: 'pending'
        };
        modifiedItinerary.days[day].activities.push(newPlannedActivity);
        modifiedItinerary.days[day].activities.sort((a, b) => a.time.localeCompare(b.time));
      }
    }
    
    if (modifications.removeActivity) {
      const { day, activityIndex } = modifications.removeActivity;
      if (modifiedItinerary.days[day] && modifiedItinerary.days[day].activities[activityIndex]) {
        modifiedItinerary.days[day].activities.splice(activityIndex, 1);
      }
    }
    
    if (modifications.replaceActivity) {
      const { day, activityIndex, newActivity } = modifications.replaceActivity;
      if (modifiedItinerary.days[day] && modifiedItinerary.days[day].activities[activityIndex]) {
        const newPlannedActivity: PlannedActivity = {
          time: modifiedItinerary.days[day].activities[activityIndex].time,
          duration: newActivity.estimatedDuration,
          activity: newActivity.business,
          category: newActivity.category,
          bookingRequired: newActivity.category === 'attraction' || newActivity.category === 'dining',
          bookingStatus: 'pending'
        };
        modifiedItinerary.days[day].activities[activityIndex] = newPlannedActivity;
      }
    }
    
    if (modifications.changeAccommodation) {
      modifiedItinerary.days.forEach(day => {
        day.accommodation = modifications.changeAccommodation;
      });
    }
    
    // Recalculate total cost
    modifiedItinerary.totalEstimatedCost = this.calculateTotalCost(modifiedItinerary.days, modifiedItinerary.days[0]?.accommodation);
    
    return modifiedItinerary;
  }
  
  // =============================================================================
  // HELPER METHODS
  // =============================================================================
  
  private validateItineraryRequest(request: ItineraryRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!request.destination || !request.destination.city) {
      errors.push('Valid destination is required');
    }
    
    if (!request.startDate || !request.endDate) {
      errors.push('Start and end dates are required');
    }
    
    if (request.startDate && request.endDate && request.startDate >= request.endDate) {
      errors.push('End date must be after start date');
    }
    
    if (!request.groupSize || request.groupSize < 1 || request.groupSize > 20) {
      errors.push('Group size must be between 1 and 20 people');
    }
    
    if (request.startDate && request.startDate < new Date()) {
      errors.push('Start date cannot be in the past');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private createMockBusiness(category: string, name: string, location: Location): Business {
    return {
      id: `${category}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      rating: 4.0 + Math.random() * 1.0,
      review_count: Math.floor(Math.random() * 500) + 50,
      price: ['$', '$$', '$$$'][Math.floor(Math.random() * 3)],
      categories: [
        { alias: category, title: category.charAt(0).toUpperCase() + category.slice(1) }
      ],
      location: {
        address1: `${Math.floor(Math.random() * 999) + 1} ${name} St`,
        city: location.city,
        state: location.state,
        zip_code: location.zipCode || '00000',
        country: location.country || 'US',
        display_address: [`${Math.floor(Math.random() * 999) + 1} ${name} St`, `${location.city}, ${location.state}`]
      },
      coordinates: {
        latitude: location.latitude + (Math.random() - 0.5) * 0.01,
        longitude: location.longitude + (Math.random() - 0.5) * 0.01
      },
      photos: ['https://via.placeholder.com/400x300'],
      phone: '+1234567890',
      display_phone: '(123) 456-7890',
      url: 'https://example.com',
      image_url: 'https://via.placeholder.com/400x300',
      is_closed: false,
      transactions: [],
      distance: Math.random() * 2
    };
  }
  
  private filterSuggestionsByPreferences(suggestions: ActivitySuggestion[], request: ItineraryRequest): ActivitySuggestion[] {
    return suggestions.filter(suggestion => {
      // Filter by budget if specified
      if (request.budget && suggestion.cost && suggestion.cost > request.budget.max / 3) {
        return false;
      }
      
      // Filter by interests if specified
      if (request.interests && request.interests.length > 0) {
        const hasMatchingInterest = request.interests.some(interest => 
          suggestion.business.name.toLowerCase().includes(interest.toLowerCase()) ||
          suggestion.business.categories.some(cat => cat.title.toLowerCase().includes(interest.toLowerCase()))
        );
        if (!hasMatchingInterest && suggestion.priority < 8) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  private selectActivityForTimeSlot(suggestions: ActivitySuggestion[], timeSlot: string, maxDuration: number): ActivitySuggestion | undefined {
    return suggestions
      .filter(s => 
        s.bestTimeSlots.includes(timeSlot) && 
        s.estimatedDuration <= maxDuration &&
        s.category === 'attraction'
      )
      .sort((a, b) => b.priority - a.priority)[0];
  }
  
  private calculateTotalTravelTime(itinerary: TravelItinerary): number {
    // Mock calculation - in real implementation, this would calculate actual travel times
    return itinerary.days.reduce((total, day) => {
      return total + (day.activities.length - 1) * 15; // 15 minutes between activities
    }, 0);
  }
  
  private calculateTotalCost(days: ItineraryDay[], accommodation?: Business): number {
    let totalCost = 0;
    
    // Add accommodation cost (mock calculation)
    if (accommodation) {
      const nightlyRate = accommodation.price === '$' ? 100 : accommodation.price === '$$' ? 200 : 300;
      totalCost += nightlyRate * days.length;
    }
    
    // Add activity costs (mock calculation)
    days.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.category === 'dining') {
          totalCost += activity.activity.price === '$' ? 25 : activity.activity.price === '$$' ? 50 : 75;
        } else if (activity.category === 'attraction') {
          totalCost += 20;
        } else if (activity.category === 'entertainment') {
          totalCost += 35;
        }
      });
    });
    
    return totalCost;
  }
  
  private calculateBalanceScore(itinerary: TravelItinerary): number {
    let score = 0.5; // Base score
    
    // Check for variety of activities
    const categories = new Set<string>();
    itinerary.days.forEach(day => {
      day.activities.forEach(activity => {
        categories.add(activity.category);
      });
    });
    
    score += (categories.size - 1) * 0.1; // Bonus for variety
    
    // Check for reasonable pacing (not too many activities per day)
    const avgActivitiesPerDay = itinerary.days.reduce((sum, day) => sum + day.activities.length, 0) / itinerary.days.length;
    if (avgActivitiesPerDay >= 3 && avgActivitiesPerDay <= 5) {
      score += 0.2; // Good pacing
    }
    
    return Math.min(1.0, Math.max(0.0, score));
  }
  
  private generateOptimizationSuggestions(itinerary: TravelItinerary, travelTime: number, balanceScore: number): string[] {
    const suggestions: string[] = [];
    
    if (travelTime > 120) { // More than 2 hours of travel per day
      suggestions.push('Consider grouping activities by location to reduce travel time');
    }
    
    if (balanceScore < 0.6) {
      suggestions.push('Add more variety to activities for a more balanced experience');
    }
    
    const avgActivitiesPerDay = itinerary.days.reduce((sum, day) => sum + day.activities.length, 0) / itinerary.days.length;
    if (avgActivitiesPerDay > 5) {
      suggestions.push('Consider reducing activities per day to allow for more relaxation');
    }
    
    if (avgActivitiesPerDay < 3) {
      suggestions.push('Consider adding more activities to make the most of your trip');
    }
    
    return suggestions;
  }
  
  private getBudgetPriceRange(budget: { min: number; max: number }): string {
    if (budget.max <= 100) return '$';
    if (budget.max <= 200) return '$$';
    if (budget.max <= 300) return '$$$';
    return '$$$$';
  }
  
  private generateItineraryId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ITIN_${timestamp}_${random}`.toUpperCase();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let itineraryPlannerInstance: ItineraryPlanner | null = null;

export function getItineraryPlanner(): ItineraryPlanner {
  if (!itineraryPlannerInstance) {
    itineraryPlannerInstance = new ItineraryPlanner();
  }
  return itineraryPlannerInstance;
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export async function generateTravelItinerary(request: ItineraryRequest): Promise<ItineraryResponse> {
  const planner = getItineraryPlanner();
  return await planner.generateItinerary(request);
}

export async function optimizeTravelItinerary(itinerary: TravelItinerary, request: ItineraryRequest): Promise<ItineraryOptimizationResult> {
  const planner = getItineraryPlanner();
  return await planner.optimizeItinerary(itinerary, request);
}

export async function modifyTravelItinerary(
  itinerary: TravelItinerary, 
  modifications: Parameters<ItineraryPlanner['modifyItinerary']>[1]
): Promise<TravelItinerary> {
  const planner = getItineraryPlanner();
  return await planner.modifyItinerary(itinerary, modifications);
}