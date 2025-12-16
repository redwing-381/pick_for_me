// Autonomous decision-making engine for restaurant selection

import type {
  Business,
  UserPreferences,
  Location,
  DecisionRequest,
  DecisionResponse,
  DecisionFactor,
  ConversationContext
} from './types';

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
   * Main decision-making method that selects the best restaurant
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
 * Handle cases where no suitable options are found
 */
export function handleNoSuitableOptions(
  businesses: Business[],
  preferences: UserPreferences
): DecisionResponse {
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

    return engine.selectBestRestaurant({
      businesses,
      userPreferences: preferences,
      location: defaultLocation
    });
  }

  // Truly no options available
  throw new Error('No restaurants found matching your criteria. Please try adjusting your preferences or location.');
}

/**
 * Quick decision for single restaurant
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