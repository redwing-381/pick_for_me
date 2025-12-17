// Autonomous decision-making engine for restaurant selection

import type {
  Business,
  UserPreferences,
  Location,
  DecisionRequest,
  DecisionResponse,
  DecisionFactor,
  ConversationContext,
  TravelContext
} from './types';

// =============================================================================
// TRAVEL DECISION TYPES
// =============================================================================

export type TravelCategory = 'dining' | 'accommodation' | 'attractions' | 'transportation' | 'entertainment';

export interface TravelDecisionRequest extends DecisionRequest {
  category: TravelCategory;
  travelContext?: TravelContext;
}

export interface TravelDecisionResponse extends DecisionResponse {
  category: TravelCategory;
}

// =============================================================================
// DECISION ENGINE CORE
// =============================================================================

export class DecisionEngine {
  private static instance: DecisionEngine | null = null;

  static getInstance(): DecisionEngine {
    if (!DecisionEngine.instance) {
      DecisionEngine.instance = new DecisionEngine();
    }
    return DecisionEngine.instance;
  }

  /**
   * Main travel decision-making method that handles all travel categories
   */
  async selectBestTravelOption(request: TravelDecisionRequest): Promise<TravelDecisionResponse> {
    const { businesses, userPreferences, location, conversationContext, category, travelContext } = request;

    if (!businesses || businesses.length === 0) {
      throw new Error(`No ${category} options provided for decision making`);
    }

    // If only one option, return it with basic reasoning
    if (businesses.length === 1) {
      return {
        selectedBusiness: businesses[0],
        reasoning: `I selected ${businesses[0].name} as it's the only ${category} option that matches your criteria.`,
        confidence: 0.8,
        alternatives: [],
        factors: this.calculateTravelFactors(businesses[0], category, userPreferences, location, travelContext),
        category
      };
    }

    // Score all options based on category
    const scoredBusinesses = businesses.map(business => ({
      business,
      score: this.calculateTravelScore(business, category, userPreferences, location, conversationContext, travelContext),
      factors: this.calculateTravelFactors(business, category, userPreferences, location, travelContext)
    }));

    // Sort by score (highest first)
    scoredBusinesses.sort((a, b) => b.score - a.score);

    const selected = scoredBusinesses[0];
    const alternatives = scoredBusinesses.slice(1, 4).map(item => item.business); // Top 3 alternatives

    // Generate category-specific reasoning
    const reasoning = this.generateTravelReasoning(
      selected.business,
      selected.factors,
      category,
      userPreferences,
      travelContext,
      conversationContext
    );

    // Calculate confidence based on score difference
    const confidence = this.calculateConfidence(scoredBusinesses);

    return {
      selectedBusiness: selected.business,
      reasoning,
      confidence,
      alternatives,
      factors: selected.factors,
      category
    };
  }

  /**
   * Main decision-making method that selects the best restaurant (legacy method)
   */
  async selectBestRestaurant(request: DecisionRequest): Promise<DecisionResponse> {
    const { businesses, userPreferences, location, conversationContext } = request;

    if (!businesses || businesses.length === 0) {
      throw new Error('No restaurants provided for decision making');
    }

    // If only one restaurant, return it with basic reasoning
    if (businesses.length === 1) {
      return {
        selectedBusiness: businesses[0],
        reasoning: `I selected ${businesses[0].name} as it's the only option that matches your criteria.`,
        confidence: 0.8,
        alternatives: [],
        factors: this.calculateFactors(businesses[0], userPreferences, location)
      };
    }

    // Score all restaurants
    const scoredBusinesses = businesses.map(business => ({
      business,
      score: this.calculateBusinessScore(business, userPreferences, location, conversationContext),
      factors: this.calculateFactors(business, userPreferences, location)
    }));

    // Sort by score (highest first)
    scoredBusinesses.sort((a, b) => b.score - a.score);

    const selected = scoredBusinesses[0];
    const alternatives = scoredBusinesses.slice(1, 4).map(item => item.business); // Top 3 alternatives

    // Generate reasoning
    const reasoning = this.generateReasoning(
      selected.business,
      selected.factors,
      userPreferences,
      conversationContext
    );

    // Calculate confidence based on score difference
    const confidence = this.calculateConfidence(scoredBusinesses);

    return {
      selectedBusiness: selected.business,
      reasoning,
      confidence,
      alternatives,
      factors: selected.factors
    };
  }

  /**
   * Calculate overall score for a business
   */
  private calculateBusinessScore(
    business: Business,
    preferences: UserPreferences,
    location: Location,
    context?: ConversationContext
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Rating factor (30% weight)
    const ratingWeight = 0.3;
    const ratingScore = this.normalizeRating(business.rating);
    totalScore += ratingScore * ratingWeight;
    totalWeight += ratingWeight;

    // Price preference factor (25% weight)
    const priceWeight = 0.25;
    const priceScore = this.calculatePriceScore(business.price, preferences.priceRange);
    totalScore += priceScore * priceWeight;
    totalWeight += priceWeight;

    // Distance factor (20% weight)
    const distanceWeight = 0.2;
    const distanceScore = this.calculateDistanceScore(business.distance || 0);
    totalScore += distanceScore * distanceWeight;
    totalWeight += distanceWeight;

    // Cuisine preference factor (15% weight)
    const cuisineWeight = 0.15;
    const cuisineScore = this.calculateCuisineScore(business.categories, preferences.cuisineTypes);
    totalScore += cuisineScore * cuisineWeight;
    totalWeight += cuisineWeight;

    // Review count factor (10% weight) - popularity indicator
    const popularityWeight = 0.1;
    const popularityScore = this.calculatePopularityScore(business.review_count);
    totalScore += popularityScore * popularityWeight;
    totalWeight += popularityWeight;

    // Context-based adjustments
    if (context) {
      const contextAdjustment = this.calculateContextAdjustment(business, context);
      totalScore += contextAdjustment * 0.1; // 10% adjustment
    }

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate individual decision factors for transparency
   */
  private calculateFactors(
    business: Business,
    preferences: UserPreferences,
    location: Location
  ): DecisionFactor[] {
    const factors: DecisionFactor[] = [];

    // Rating factor
    factors.push({
      name: 'Rating',
      weight: 0.3,
      score: this.normalizeRating(business.rating),
      description: `${business.rating}/5 stars with ${business.review_count} reviews`
    });

    // Price factor
    factors.push({
      name: 'Price Match',
      weight: 0.25,
      score: this.calculatePriceScore(business.price, preferences.priceRange),
      description: `${business.price} price range (preference: ${preferences.priceRange})`
    });

    // Distance factor
    factors.push({
      name: 'Distance',
      weight: 0.2,
      score: this.calculateDistanceScore(business.distance || 0),
      description: business.distance ? `${business.distance.toFixed(1)} miles away` : 'Distance unknown'
    });

    // Cuisine factor
    factors.push({
      name: 'Cuisine Match',
      weight: 0.15,
      score: this.calculateCuisineScore(business.categories, preferences.cuisineTypes),
      description: `Serves ${business.categories.map(c => c.title).join(', ')}`
    });

    // Popularity factor
    factors.push({
      name: 'Popularity',
      weight: 0.1,
      score: this.calculatePopularityScore(business.review_count),
      description: `${business.review_count} reviews indicate popularity`
    });

    return factors;
  }

  /**
   * Generate human-readable reasoning for the selection
   */
  private generateReasoning(
    business: Business,
    factors: DecisionFactor[],
    preferences: UserPreferences,
    context?: ConversationContext
  ): string {
    const topFactors = factors
      .sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
      .slice(0, 3);

    let reasoning = `I selected ${business.name} because it excels in several key areas: `;

    const reasons: string[] = [];

    topFactors.forEach(factor => {
      if (factor.score > 0.7) {
        switch (factor.name) {
          case 'Rating':
            reasons.push(`it has excellent ratings (${business.rating}/5 stars)`);
            break;
          case 'Price Match':
            reasons.push(`it matches your budget preference (${business.price})`);
            break;
          case 'Distance':
            reasons.push(`it's conveniently located nearby`);
            break;
          case 'Cuisine Match':
            reasons.push(`it serves your preferred cuisine`);
            break;
          case 'Popularity':
            reasons.push(`it's well-reviewed by many customers`);
            break;
        }
      }
    });

    if (reasons.length > 0) {
      reasoning += reasons.join(', ') + '.';
    } else {
      reasoning += 'it provides the best overall balance of quality, location, and value.';
    }

    // Add context-specific reasoning
    if (context?.stage === 'decision_made') {
      reasoning += ' This choice aligns with your previous preferences in our conversation.';
    }

    return reasoning;
  }

  /**
   * Calculate confidence based on score distribution
   */
  private calculateConfidence(scoredBusinesses: Array<{ score: number }>): number {
    if (scoredBusinesses.length < 2) return 0.8;

    const topScore = scoredBusinesses[0].score;
    const secondScore = scoredBusinesses[1].score;
    const scoreDifference = topScore - secondScore;

    // Higher difference = higher confidence
    // Scale from 0.5 (low confidence) to 0.95 (high confidence)
    const confidence = Math.min(0.95, 0.5 + (scoreDifference * 2));
    return Math.max(0.5, confidence);
  }

  // =============================================================================
  // TRAVEL-SPECIFIC SCORING METHODS
  // =============================================================================

  /**
   * Calculate score for travel options based on category
   */
  private calculateTravelScore(
    business: Business,
    category: TravelCategory,
    preferences: UserPreferences,
    location: Location,
    context?: ConversationContext,
    travelContext?: TravelContext
  ): number {
    switch (category) {
      case 'dining':
        return this.calculateBusinessScore(business, preferences, location, context);
      case 'accommodation':
        return this.calculateAccommodationScore(business, preferences, location, travelContext);
      case 'attractions':
        return this.calculateAttractionScore(business, preferences, location, travelContext);
      case 'transportation':
        return this.calculateTransportationScore(business, preferences, location, travelContext);
      case 'entertainment':
        return this.calculateEntertainmentScore(business, preferences, location, travelContext);
      default:
        return this.calculateBusinessScore(business, preferences, location, context);
    }
  }

  /**
   * Calculate factors for travel options based on category
   */
  private calculateTravelFactors(
    business: Business,
    category: TravelCategory,
    preferences: UserPreferences,
    location: Location,
    travelContext?: TravelContext
  ): DecisionFactor[] {
    switch (category) {
      case 'dining':
        return this.calculateFactors(business, preferences, location);
      case 'accommodation':
        return this.calculateAccommodationFactors(business, preferences, location, travelContext);
      case 'attractions':
        return this.calculateAttractionFactors(business, preferences, location, travelContext);
      case 'transportation':
        return this.calculateTransportationFactors(business, preferences, location, travelContext);
      case 'entertainment':
        return this.calculateEntertainmentFactors(business, preferences, location, travelContext);
      default:
        return this.calculateFactors(business, preferences, location);
    }
  }

  /**
   * Generate travel-specific reasoning
   */
  private generateTravelReasoning(
    business: Business,
    factors: DecisionFactor[],
    category: TravelCategory,
    preferences: UserPreferences,
    travelContext?: TravelContext,
    context?: ConversationContext
  ): string {
    const topFactors = factors
      .sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
      .slice(0, 3);

    let reasoning = '';

    switch (category) {
      case 'accommodation':
        reasoning = this.generateAccommodationReasoning(business, topFactors, travelContext);
        break;
      case 'attractions':
        reasoning = this.generateAttractionReasoning(business, topFactors, travelContext);
        break;
      case 'transportation':
        reasoning = this.generateTransportationReasoning(business, topFactors, travelContext);
        break;
      case 'entertainment':
        reasoning = this.generateEntertainmentReasoning(business, topFactors, travelContext);
        break;
      default:
        reasoning = this.generateReasoning(business, factors, preferences, context);
    }

    // Add travel-specific context
    if (travelContext?.travelStyle) {
      reasoning += ` This choice perfectly matches your ${travelContext.travelStyle} travel preferences.`;
    }

    if (travelContext?.groupSize && travelContext.groupSize > 1) {
      reasoning += ` It's also well-suited for your group of ${travelContext.groupSize}.`;
    }

    return reasoning;
  }

  private generateAccommodationReasoning(
    business: Business,
    topFactors: DecisionFactor[],
    travelContext?: TravelContext
  ): string {
    let reasoning = `I selected ${business.name} as your accommodation because `;
    const reasons: string[] = [];

    topFactors.forEach(factor => {
      if (factor.score > 0.7) {
        switch (factor.name) {
          case 'Rating':
            reasons.push(`it has outstanding guest reviews (${business.rating}/5 stars)`);
            break;
          case 'Budget Match':
            reasons.push(`the pricing fits perfectly within your budget range`);
            break;
          case 'Location':
            reasons.push(`it's ideally located for easy access to attractions`);
            break;
          case 'Amenities':
            reasons.push(`it offers excellent amenities and services`);
            break;
        }
      }
    });

    if (reasons.length > 0) {
      reasoning += reasons.join(', ') + '.';
    } else {
      reasoning += 'it offers the best combination of comfort, location, and value.';
    }

    return reasoning;
  }

  private generateAttractionReasoning(
    business: Business,
    topFactors: DecisionFactor[],
    travelContext?: TravelContext
  ): string {
    let reasoning = `I chose ${business.name} as your must-visit attraction because `;
    const reasons: string[] = [];

    topFactors.forEach(factor => {
      if (factor.score > 0.7) {
        switch (factor.name) {
          case 'Rating':
            reasons.push(`visitors consistently rate it highly (${business.rating}/5 stars)`);
            break;
          case 'Interest Match':
            reasons.push(`it perfectly aligns with your interests`);
            break;
          case 'Distance':
            reasons.push(`it's conveniently accessible from your location`);
            break;
          case 'Popularity':
            reasons.push(`it's a beloved destination with many positive reviews`);
            break;
        }
      }
    });

    if (reasons.length > 0) {
      reasoning += reasons.join(', ') + '.';
    } else {
      reasoning += 'it offers an exceptional experience that matches what you\'re looking for.';
    }

    return reasoning;
  }

  private generateTransportationReasoning(
    business: Business,
    topFactors: DecisionFactor[],
    travelContext?: TravelContext
  ): string {
    let reasoning = `I recommend ${business.name} for your transportation needs because `;
    const reasons: string[] = [];

    topFactors.forEach(factor => {
      if (factor.score > 0.7) {
        switch (factor.name) {
          case 'Convenience':
            reasons.push(`it offers the most convenient access and connections`);
            break;
          case 'Distance':
            reasons.push(`it's easily reachable from your current location`);
            break;
          case 'Rating':
            reasons.push(`it maintains high service quality standards`);
            break;
          case 'Service Quality':
            reasons.push(`travelers consistently praise its reliable service`);
            break;
        }
      }
    });

    if (reasons.length > 0) {
      reasoning += reasons.join(', ') + '.';
    } else {
      reasoning += 'it provides the most reliable and efficient transportation option.';
    }

    return reasoning;
  }

  private generateEntertainmentReasoning(
    business: Business,
    topFactors: DecisionFactor[],
    travelContext?: TravelContext
  ): string {
    let reasoning = `I selected ${business.name} for your entertainment because `;
    const reasons: string[] = [];

    topFactors.forEach(factor => {
      if (factor.score > 0.7) {
        switch (factor.name) {
          case 'Rating':
            reasons.push(`it's highly rated by visitors (${business.rating}/5 stars)`);
            break;
          case 'Entertainment Match':
            reasons.push(`it offers exactly the type of entertainment you're seeking`);
            break;
          case 'Price':
            reasons.push(`the pricing is reasonable for the quality of experience`);
            break;
          case 'Distance':
            reasons.push(`it's conveniently located for easy access`);
            break;
          case 'Popularity':
            reasons.push(`it's a popular venue with consistently great shows`);
            break;
        }
      }
    });

    if (reasons.length > 0) {
      reasoning += reasons.join(', ') + '.';
    } else {
      reasoning += 'it promises an outstanding entertainment experience.';
    }

    return reasoning;
  }

  // =============================================================================
  // ACCOMMODATION SCORING
  // =============================================================================

  private calculateAccommodationScore(
    business: Business,
    preferences: UserPreferences,
    location: Location,
    travelContext?: TravelContext
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Rating factor (35% weight)
    const ratingWeight = 0.35;
    const ratingScore = this.normalizeRating(business.rating);
    totalScore += ratingScore * ratingWeight;
    totalWeight += ratingWeight;

    // Price/budget factor (30% weight)
    const priceWeight = 0.3;
    const priceScore = this.calculateAccommodationPriceScore(business.price, travelContext?.travelStyle);
    totalScore += priceScore * priceWeight;
    totalWeight += priceWeight;

    // Location factor (20% weight)
    const locationWeight = 0.2;
    const locationScore = this.calculateDistanceScore(business.distance || 0);
    totalScore += locationScore * locationWeight;
    totalWeight += locationWeight;

    // Amenities factor (15% weight)
    const amenitiesWeight = 0.15;
    const amenitiesScore = this.calculateAmenitiesScore(business.categories);
    totalScore += amenitiesScore * amenitiesWeight;
    totalWeight += amenitiesWeight;

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculateAccommodationFactors(
    business: Business,
    preferences: UserPreferences,
    location: Location,
    travelContext?: TravelContext
  ): DecisionFactor[] {
    return [
      {
        name: 'Rating',
        weight: 0.35,
        score: this.normalizeRating(business.rating),
        description: `Excellent ${business.rating}/5 star rating with ${business.review_count} reviews`
      },
      {
        name: 'Budget Match',
        weight: 0.3,
        score: this.calculateAccommodationPriceScore(business.price, travelContext?.travelStyle),
        description: `${business.price} pricing fits your ${travelContext?.travelStyle || 'preferred'} budget`
      },
      {
        name: 'Location',
        weight: 0.2,
        score: this.calculateDistanceScore(business.distance || 0),
        description: business.distance ? `Conveniently located ${business.distance.toFixed(1)} miles away` : 'Great location'
      },
      {
        name: 'Amenities',
        weight: 0.15,
        score: this.calculateAmenitiesScore(business.categories),
        description: `Offers ${business.categories.map(c => c.title).join(', ')}`
      }
    ];
  }

  // =============================================================================
  // ATTRACTION SCORING
  // =============================================================================

  private calculateAttractionScore(
    business: Business,
    preferences: UserPreferences,
    location: Location,
    travelContext?: TravelContext
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Rating factor (30% weight)
    const ratingWeight = 0.3;
    const ratingScore = this.normalizeRating(business.rating);
    totalScore += ratingScore * ratingWeight;
    totalWeight += ratingWeight;

    // Interest match factor (25% weight)
    const interestWeight = 0.25;
    const interestScore = this.calculateInterestScore(business.categories, travelContext?.interests);
    totalScore += interestScore * interestWeight;
    totalWeight += interestWeight;

    // Distance factor (25% weight)
    const distanceWeight = 0.25;
    const distanceScore = this.calculateDistanceScore(business.distance || 0);
    totalScore += distanceScore * distanceWeight;
    totalWeight += distanceWeight;

    // Popularity factor (20% weight)
    const popularityWeight = 0.2;
    const popularityScore = this.calculatePopularityScore(business.review_count);
    totalScore += popularityScore * popularityWeight;
    totalWeight += popularityWeight;

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculateAttractionFactors(
    business: Business,
    preferences: UserPreferences,
    location: Location,
    travelContext?: TravelContext
  ): DecisionFactor[] {
    return [
      {
        name: 'Rating',
        weight: 0.3,
        score: this.normalizeRating(business.rating),
        description: `Highly rated ${business.rating}/5 stars`
      },
      {
        name: 'Interest Match',
        weight: 0.25,
        score: this.calculateInterestScore(business.categories, travelContext?.interests),
        description: `Matches your interests in ${business.categories.map(c => c.title).join(', ')}`
      },
      {
        name: 'Distance',
        weight: 0.25,
        score: this.calculateDistanceScore(business.distance || 0),
        description: business.distance ? `${business.distance.toFixed(1)} miles away` : 'Accessible location'
      },
      {
        name: 'Popularity',
        weight: 0.2,
        score: this.calculatePopularityScore(business.review_count),
        description: `Popular with ${business.review_count} visitor reviews`
      }
    ];
  }

  // =============================================================================
  // TRANSPORTATION SCORING
  // =============================================================================

  private calculateTransportationScore(
    business: Business,
    preferences: UserPreferences,
    location: Location,
    travelContext?: TravelContext
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Convenience factor (40% weight)
    const convenienceWeight = 0.4;
    const convenienceScore = this.calculateConvenienceScore(business.categories);
    totalScore += convenienceScore * convenienceWeight;
    totalWeight += convenienceWeight;

    // Distance factor (30% weight)
    const distanceWeight = 0.3;
    const distanceScore = this.calculateDistanceScore(business.distance || 0);
    totalScore += distanceScore * distanceWeight;
    totalWeight += distanceWeight;

    // Rating factor (20% weight)
    const ratingWeight = 0.2;
    const ratingScore = this.normalizeRating(business.rating);
    totalScore += ratingScore * ratingWeight;
    totalWeight += ratingWeight;

    // Service quality factor (10% weight)
    const serviceWeight = 0.1;
    const serviceScore = this.calculatePopularityScore(business.review_count);
    totalScore += serviceScore * serviceWeight;
    totalWeight += serviceWeight;

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculateTransportationFactors(
    business: Business,
    preferences: UserPreferences,
    location: Location,
    travelContext?: TravelContext
  ): DecisionFactor[] {
    return [
      {
        name: 'Convenience',
        weight: 0.4,
        score: this.calculateConvenienceScore(business.categories),
        description: `Convenient ${business.categories.map(c => c.title).join(', ')} access`
      },
      {
        name: 'Distance',
        weight: 0.3,
        score: this.calculateDistanceScore(business.distance || 0),
        description: business.distance ? `${business.distance.toFixed(1)} miles from your location` : 'Accessible location'
      },
      {
        name: 'Rating',
        weight: 0.2,
        score: this.normalizeRating(business.rating),
        description: `${business.rating}/5 star service rating`
      },
      {
        name: 'Service Quality',
        weight: 0.1,
        score: this.calculatePopularityScore(business.review_count),
        description: `Reliable service with ${business.review_count} reviews`
      }
    ];
  }

  // =============================================================================
  // ENTERTAINMENT SCORING
  // =============================================================================

  private calculateEntertainmentScore(
    business: Business,
    preferences: UserPreferences,
    location: Location,
    travelContext?: TravelContext
  ): number {
    let totalScore = 0;
    let totalWeight = 0;

    // Rating factor (30% weight)
    const ratingWeight = 0.3;
    const ratingScore = this.normalizeRating(business.rating);
    totalScore += ratingScore * ratingWeight;
    totalWeight += ratingWeight;

    // Entertainment type match (25% weight)
    const typeWeight = 0.25;
    const typeScore = this.calculateInterestScore(business.categories, travelContext?.interests);
    totalScore += typeScore * typeWeight;
    totalWeight += typeWeight;

    // Price factor (20% weight)
    const priceWeight = 0.2;
    const priceScore = this.calculatePriceScore(business.price, preferences.priceRange);
    totalScore += priceScore * priceWeight;
    totalWeight += priceWeight;

    // Distance factor (15% weight)
    const distanceWeight = 0.15;
    const distanceScore = this.calculateDistanceScore(business.distance || 0);
    totalScore += distanceScore * distanceWeight;
    totalWeight += distanceWeight;

    // Popularity factor (10% weight)
    const popularityWeight = 0.1;
    const popularityScore = this.calculatePopularityScore(business.review_count);
    totalScore += popularityScore * popularityWeight;
    totalWeight += popularityWeight;

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  private calculateEntertainmentFactors(
    business: Business,
    preferences: UserPreferences,
    location: Location,
    travelContext?: TravelContext
  ): DecisionFactor[] {
    return [
      {
        name: 'Rating',
        weight: 0.3,
        score: this.normalizeRating(business.rating),
        description: `Excellent ${business.rating}/5 star entertainment venue`
      },
      {
        name: 'Entertainment Match',
        weight: 0.25,
        score: this.calculateInterestScore(business.categories, travelContext?.interests),
        description: `Perfect for ${business.categories.map(c => c.title).join(', ')} entertainment`
      },
      {
        name: 'Price',
        weight: 0.2,
        score: this.calculatePriceScore(business.price, preferences.priceRange),
        description: `${business.price} pricing fits your budget`
      },
      {
        name: 'Distance',
        weight: 0.15,
        score: this.calculateDistanceScore(business.distance || 0),
        description: business.distance ? `${business.distance.toFixed(1)} miles away` : 'Great location'
      },
      {
        name: 'Popularity',
        weight: 0.1,
        score: this.calculatePopularityScore(business.review_count),
        description: `Popular venue with ${business.review_count} reviews`
      }
    ];
  }

  // =============================================================================
  // TRAVEL-SPECIFIC HELPER METHODS
  // =============================================================================

  private calculateAccommodationPriceScore(businessPrice: string, travelStyle?: string): number {
    const priceMap: { [key: string]: number } = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
    const businessLevel = priceMap[businessPrice] || 2;

    // Map travel style to preferred price level
    let preferredLevel = 2; // default mid-range
    switch (travelStyle) {
      case 'budget':
        preferredLevel = 1;
        break;
      case 'luxury':
        preferredLevel = 4;
        break;
      case 'mid-range':
        preferredLevel = 2;
        break;
      default:
        preferredLevel = 2;
    }

    const difference = Math.abs(businessLevel - preferredLevel);
    return Math.max(0, 1 - (difference * 0.25));
  }

  private calculateInterestScore(
    businessCategories: Array<{ alias: string; title: string }>,
    interests?: string[]
  ): number {
    if (!interests || interests.length === 0) return 0.7; // Neutral if no interests specified

    const businessTypes = businessCategories.map(c => c.title.toLowerCase()).join(' ');
    const matchCount = interests.filter(interest => 
      businessTypes.includes(interest.toLowerCase())
    ).length;

    return Math.min(1.0, matchCount / Math.max(1, interests.length) + 0.3);
  }

  private calculateAmenitiesScore(categories: Array<{ alias: string; title: string }>): number {
    // Simple scoring based on category diversity and quality indicators
    const qualityIndicators = ['luxury', 'premium', 'full-service', 'resort', 'boutique'];
    const categoryTitles = categories.map(c => c.title.toLowerCase()).join(' ');
    
    let score = 0.5; // Base score
    
    // Bonus for quality indicators
    qualityIndicators.forEach(indicator => {
      if (categoryTitles.includes(indicator)) {
        score += 0.1;
      }
    });

    return Math.min(1.0, score);
  }

  private calculateConvenienceScore(categories: Array<{ alias: string; title: string }>): number {
    // Score based on transportation convenience
    const convenienceTypes = ['airport', 'train', 'subway', 'bus', 'central'];
    const categoryTitles = categories.map(c => c.title.toLowerCase()).join(' ');
    
    let score = 0.5; // Base score
    
    convenienceTypes.forEach(type => {
      if (categoryTitles.includes(type)) {
        score += 0.15;
      }
    });

    return Math.min(1.0, score);
  }

  // =============================================================================
  // SCORING HELPER METHODS
  // =============================================================================

  private normalizeRating(rating: number): number {
    // Convert 0-5 rating to 0-1 score
    return Math.max(0, Math.min(1, rating / 5));
  }

  private calculatePriceScore(businessPrice: string, preferredPrice: string): number {
    const priceMap: { [key: string]: number } = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
    const businessLevel = priceMap[businessPrice] || 2;
    const preferredLevel = priceMap[preferredPrice] || 2;

    // Perfect match = 1.0, each level away reduces score
    const difference = Math.abs(businessLevel - preferredLevel);
    return Math.max(0, 1 - (difference * 0.3));
  }

  private calculateDistanceScore(distance: number): number {
    if (distance === 0) return 0.8; // Unknown distance gets neutral score

    // Closer is better, but with diminishing returns
    // 0-0.5 miles = 1.0, 0.5-1 mile = 0.9, 1-2 miles = 0.7, etc.
    if (distance <= 0.5) return 1.0;
    if (distance <= 1.0) return 0.9;
    if (distance <= 2.0) return 0.7;
    if (distance <= 5.0) return 0.5;
    return 0.3;
  }

  private calculateCuisineScore(
    businessCategories: Array<{ alias: string; title: string }>,
    preferredCuisines: string[]
  ): number {
    if (!preferredCuisines || preferredCuisines.length === 0) return 0.8; // Neutral if no preference

    const businessCuisines = businessCategories.map(c => c.alias.toLowerCase());
    const matchCount = preferredCuisines.filter(pref => 
      businessCuisines.some(bc => bc.includes(pref.toLowerCase()) || pref.toLowerCase().includes(bc))
    ).length;

    return Math.min(1.0, matchCount / Math.max(1, preferredCuisines.length));
  }

  private calculatePopularityScore(reviewCount: number): number {
    // Logarithmic scale for review count
    // 0-10 reviews = low, 50+ reviews = good, 200+ = excellent
    if (reviewCount <= 10) return 0.3;
    if (reviewCount <= 50) return 0.6;
    if (reviewCount <= 200) return 0.8;
    return 1.0;
  }

  private calculateContextAdjustment(
    business: Business,
    context: ConversationContext
  ): number {
    let adjustment = 0;

    // Boost score if business matches conversation context
    if (context.lastUserQuery) {
      const query = context.lastUserQuery.toLowerCase();
      const businessName = business.name.toLowerCase();
      const categories = business.categories.map(c => c.title.toLowerCase()).join(' ');

      // Simple keyword matching for context relevance
      if (query.includes('fancy') || query.includes('upscale')) {
        if (business.price === '$$$' || business.price === '$$$$') adjustment += 0.2;
      }
      
      if (query.includes('cheap') || query.includes('budget')) {
        if (business.price === '$' || business.price === '$$') adjustment += 0.2;
      }

      if (query.includes('quick') || query.includes('fast')) {
        if (categories.includes('fast') || categories.includes('casual')) adjustment += 0.1;
      }
    }

    return Math.max(-0.2, Math.min(0.2, adjustment));
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Handle cases where no suitable travel options are found
 */
export async function handleNoSuitableTravelOptions(
  businesses: Business[],
  category: TravelCategory,
  preferences: UserPreferences,
  travelContext?: TravelContext
): Promise<TravelDecisionResponse> {
  // If we have businesses but none are "suitable", still pick the best one
  if (businesses.length > 0) {
    const engine = DecisionEngine.getInstance();
    // Create a minimal location for scoring
    const defaultLocation: Location = {
      latitude: 0,
      longitude: 0,
      address: 'Unknown',
      city: 'Unknown',
      state: 'Unknown'
    };

    return await engine.selectBestTravelOption({
      businesses,
      userPreferences: preferences,
      location: defaultLocation,
      category,
      travelContext
    });
  }

  // Truly no options available
  throw new Error(`No ${category} options found matching your criteria. Please try adjusting your preferences or location.`);
}

/**
 * Handle cases where no suitable options are found (legacy method)
 */
export async function handleNoSuitableOptions(
  businesses: Business[],
  preferences: UserPreferences
): Promise<DecisionResponse> {
  // If we have businesses but none are "suitable", still pick the best one
  if (businesses.length > 0) {
    const engine = DecisionEngine.getInstance();
    // Create a minimal location for scoring
    const defaultLocation: Location = {
      latitude: 0,
      longitude: 0,
      address: 'Unknown',
      city: 'Unknown',
      state: 'Unknown'
    };

    return await engine.selectBestRestaurant({
      businesses,
      userPreferences: preferences,
      location: defaultLocation
    });
  }

  // Truly no options available
  throw new Error('No restaurants found matching your criteria. Please try adjusting your preferences or location.');
}

/**
 * Quick decision for single travel option
 */
export function makeQuickTravelDecision(business: Business, category: TravelCategory): TravelDecisionResponse {
  return {
    selectedBusiness: business,
    reasoning: `${business.name} is a great ${category} choice with ${business.rating}/5 stars and ${business.review_count} reviews.`,
    confidence: 0.8,
    alternatives: [],
    factors: [
      {
        name: 'Rating',
        weight: 1.0,
        score: business.rating / 5,
        description: `${business.rating}/5 stars`
      }
    ],
    category
  };
}

/**
 * Quick decision for single restaurant (legacy method)
 */
export function makeQuickDecision(business: Business): DecisionResponse {
  return {
    selectedBusiness: business,
    reasoning: `${business.name} is a great choice with ${business.rating}/5 stars and ${business.review_count} reviews.`,
    confidence: 0.8,
    alternatives: [],
    factors: [
      {
        name: 'Rating',
        weight: 1.0,
        score: business.rating / 5,
        description: `${business.rating}/5 stars`
      }
    ]
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const decisionEngine = DecisionEngine.getInstance();
export default decisionEngine;