import { NextRequest, NextResponse } from 'next/server';
import { YelpAIRequest, YelpAIResponse, ConversationMessage, UserPreferences, ConversationContext, TravelContext } from '@/lib/types';
import { handleYelpAIRequest } from '@/lib/yelp-server';
import { isValidLocation } from '@/lib/type-guards';
import { decisionEngine } from '@/lib/decision-engine';

// =============================================================================
// TRAVEL QUERY CATEGORIZATION
// =============================================================================

type TravelCategory = 'dining' | 'accommodation' | 'attractions' | 'transportation' | 'entertainment' | 'logistics' | 'general';

interface TravelQueryAnalysis {
  category: TravelCategory;
  confidence: number;
  keywords: string[];
  intent: string;
}

function categorizeTravelQuery(message: string): TravelQueryAnalysis {
  const content = message.toLowerCase();
  
  // Define category keywords and patterns
  const categoryPatterns = {
    accommodation: {
      keywords: ['hotel', 'motel', 'hostel', 'airbnb', 'accommodation', 'stay', 'lodge', 'resort', 'inn', 'bed and breakfast', 'b&b', 'place to stay', 'room', 'suite'],
      patterns: [/where to stay/i, /place to sleep/i, /book.*room/i, /hotel.*near/i]
    },
    attractions: {
      keywords: ['museum', 'park', 'attraction', 'tourist', 'sightseeing', 'landmark', 'monument', 'gallery', 'zoo', 'aquarium', 'theater', 'show', 'concert', 'tour', 'visit', 'see', 'explore'],
      patterns: [/things to do/i, /places to visit/i, /tourist.*spot/i, /what to see/i, /attractions.*in/i]
    },
    transportation: {
      keywords: ['flight', 'train', 'bus', 'taxi', 'uber', 'lyft', 'car rental', 'transport', 'airport', 'station', 'ticket', 'travel', 'get there', 'how to get'],
      patterns: [/how to get to/i, /transportation.*to/i, /flight.*to/i, /train.*to/i, /bus.*to/i]
    },
    entertainment: {
      keywords: ['nightlife', 'bar', 'club', 'pub', 'brewery', 'casino', 'entertainment', 'music', 'dance', 'party', 'drinks', 'cocktails', 'live music'],
      patterns: [/night.*life/i, /where to drink/i, /bars.*near/i, /clubs.*in/i]
    },
    logistics: {
      keywords: ['visa', 'passport', 'currency', 'exchange', 'weather', 'climate', 'customs', 'embassy', 'insurance', 'vaccination', 'time zone', 'language', 'tip', 'advice'],
      patterns: [/travel.*advice/i, /what.*need/i, /visa.*requirement/i, /weather.*like/i]
    },
    dining: {
      keywords: ['restaurant', 'food', 'eat', 'dining', 'cuisine', 'meal', 'breakfast', 'lunch', 'dinner', 'cafe', 'coffee', 'pizza', 'burger', 'sushi', 'italian', 'chinese', 'mexican'],
      patterns: [/where to eat/i, /good.*food/i, /restaurant.*near/i, /place.*eat/i]
    }
  };

  let bestMatch: TravelQueryAnalysis = {
    category: 'general',
    confidence: 0,
    keywords: [],
    intent: 'general_inquiry'
  };

  // Check each category
  for (const [category, data] of Object.entries(categoryPatterns)) {
    let score = 0;
    const matchedKeywords: string[] = [];

    // Check keyword matches
    for (const keyword of data.keywords) {
      if (content.includes(keyword)) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    }

    // Check pattern matches (higher weight)
    for (const pattern of data.patterns) {
      if (pattern.test(content)) {
        score += 2;
      }
    }

    // Calculate confidence based on message length and matches
    const confidence = Math.min(score / Math.max(content.split(' ').length * 0.3, 1), 1);

    if (confidence > bestMatch.confidence) {
      bestMatch = {
        category: category as TravelCategory,
        confidence,
        keywords: matchedKeywords,
        intent: determineIntent(content, category as TravelCategory)
      };
    }
  }

  return bestMatch;
}

function determineIntent(message: string, category: TravelCategory): string {
  const content = message.toLowerCase();
  
  // Common intent patterns
  if (content.includes('book') || content.includes('reserve') || content.includes('buy')) {
    return 'booking';
  }
  if (content.includes('find') || content.includes('search') || content.includes('look for')) {
    return 'search';
  }
  if (content.includes('recommend') || content.includes('suggest') || content.includes('best')) {
    return 'recommendation';
  }
  if (content.includes('how') || content.includes('what') || content.includes('where')) {
    return 'information';
  }
  
  // Category-specific intents
  switch (category) {
    case 'accommodation':
      return content.includes('cheap') || content.includes('budget') ? 'budget_search' : 'accommodation_search';
    case 'attractions':
      return 'attraction_discovery';
    case 'transportation':
      return 'travel_planning';
    case 'entertainment':
      return 'entertainment_search';
    case 'logistics':
      return 'travel_advice';
    case 'dining':
      return 'restaurant_search';
    default:
      return 'general_inquiry';
  }
}

// =============================================================================
// CONTEXT PRESERVATION HELPERS
// =============================================================================

function extractPreferencesFromHistory(history: any[]): Partial<UserPreferences> {
  const preferences: Partial<UserPreferences> = {
    cuisineTypes: [],
    dietaryRestrictions: []
  };

  for (const message of history) {
    if (message.role === 'user') {
      const content = message.content.toLowerCase();
      
      // Extract cuisine preferences
      const cuisineKeywords = {
        italian: ['italian', 'pasta', 'pizza', 'risotto'],
        chinese: ['chinese', 'dim sum', 'noodles', 'stir fry'],
        mexican: ['mexican', 'tacos', 'burrito', 'salsa'],
        japanese: ['japanese', 'sushi', 'ramen', 'tempura'],
        indian: ['indian', 'curry', 'tandoor', 'biryani'],
        thai: ['thai', 'pad thai', 'tom yum', 'green curry'],
        french: ['french', 'bistro', 'croissant', 'baguette'],
        american: ['american', 'burger', 'bbq', 'steak']
      };

      for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
        if (keywords.some(keyword => content.includes(keyword))) {
          if (!preferences.cuisineTypes?.includes(cuisine)) {
            preferences.cuisineTypes?.push(cuisine);
          }
        }
      }

      // Extract price preferences
      if (content.includes('cheap') || content.includes('budget') || content.includes('affordable')) {
        preferences.priceRange = '$';
      } else if (content.includes('expensive') || content.includes('fancy') || content.includes('upscale')) {
        preferences.priceRange = '$$$';
      } else if (content.includes('moderate') || content.includes('mid-range')) {
        preferences.priceRange = '$$';
      }

      // Extract dietary restrictions
      const dietaryKeywords = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'kosher', 'halal'];
      for (const dietary of dietaryKeywords) {
        if (content.includes(dietary) && !preferences.dietaryRestrictions?.includes(dietary)) {
          preferences.dietaryRestrictions?.push(dietary);
        }
      }

      // Extract atmosphere preferences
      if (content.includes('romantic')) preferences.atmosphere = 'romantic';
      else if (content.includes('casual')) preferences.atmosphere = 'casual';
      else if (content.includes('family')) preferences.atmosphere = 'family';
      else if (content.includes('business')) preferences.atmosphere = 'business';
      else if (content.includes('upscale') || content.includes('fancy')) preferences.atmosphere = 'upscale';

      // Extract party size
      const partySizeMatch = content.match(/(\d+)\s*(people|person|pax)/);
      if (partySizeMatch) {
        preferences.partySize = parseInt(partySizeMatch[1]);
      }
    }
  }

  return preferences;
}

function extractTravelContextFromHistory(history: any[]): Partial<TravelContext> {
  const travelContext: Partial<TravelContext> = {
    interests: []
  };

  for (const message of history) {
    if (message.role === 'user') {
      const content = (message.content || '').toLowerCase();
      
      // Extract travel style
      if (content.includes('budget') || content.includes('cheap') || content.includes('backpack')) {
        travelContext.travelStyle = 'budget';
      } else if (content.includes('luxury') || content.includes('fancy') || content.includes('upscale')) {
        travelContext.travelStyle = 'luxury';
      } else if (content.includes('adventure') || content.includes('hiking') || content.includes('outdoor')) {
        travelContext.travelStyle = 'adventure';
      } else if (content.includes('cultural') || content.includes('museum') || content.includes('history')) {
        travelContext.travelStyle = 'cultural';
      } else if (content.includes('mid-range') || content.includes('moderate')) {
        travelContext.travelStyle = 'mid-range';
      }

      // Extract group size
      const groupSizeMatch = content.match(/(\d+)\s*(people|person|travelers|guests)/);
      if (groupSizeMatch) {
        travelContext.groupSize = parseInt(groupSizeMatch[1]);
      }

      // Extract interests
      const interestKeywords = [
        'food', 'dining', 'restaurants', 'cuisine',
        'museums', 'art', 'culture', 'history',
        'nightlife', 'bars', 'clubs', 'entertainment',
        'shopping', 'markets', 'boutiques',
        'nature', 'parks', 'hiking', 'outdoor',
        'beaches', 'water', 'swimming',
        'architecture', 'buildings', 'landmarks',
        'music', 'concerts', 'shows', 'theater'
      ];

      for (const interest of interestKeywords) {
        if (content.includes(interest) && !travelContext.interests?.includes(interest)) {
          travelContext.interests?.push(interest);
        }
      }

      // Extract budget information
      const budgetMatch = content.match(/budget.*?(\d+)/i) || content.match(/(\d+).*?budget/i);
      if (budgetMatch) {
        const amount = parseInt(budgetMatch[1]);
        travelContext.budget = {
          min: 0,
          max: amount,
          currency: 'USD'
        };
      }
    }
  }

  return travelContext;
}

function buildConversationContext(history: any[], currentMessage: string): ConversationContext {
  const lastUserMessages = history
    .filter((msg: any) => msg.role === 'user')
    .slice(-3) // Last 3 user messages for context
    .map((msg: any) => msg.content);

  const hasBusinessRecommendations = history.some((msg: any) => 
    msg.role === 'assistant' && msg.businesses && msg.businesses.length > 0
  );

  const needsClarification = detectClarificationNeeds(currentMessage, history);
  
  // Analyze the current query for travel category
  const queryAnalysis = categorizeTravelQuery(currentMessage);
  
  // Determine conversation stage based on query category
  let stage: ConversationContext['stage'] = 'searching';
  if (hasBusinessRecommendations) {
    stage = 'decision_made';
  } else if (queryAnalysis.category !== 'dining' && queryAnalysis.category !== 'general') {
    stage = 'travel_planning';
  }

  return {
    lastUserQuery: currentMessage,
    extractedPreferences: extractPreferencesFromHistory(history),
    clarificationNeeded: needsClarification,
    stage,
    travelContext: extractTravelContextFromHistory(history),
    interactionHistory: []
  };
}

function detectClarificationNeeds(message: string, history: any[]): boolean {
  const ambiguousTerms = [
    'something good', 'anything', 'whatever', 'surprise me', 'you choose',
    'not sure', 'maybe', 'i guess', 'whatever you think'
  ];

  const messageContent = message.toLowerCase();
  const isAmbiguous = ambiguousTerms.some(term => messageContent.includes(term));

  // Check if user is being vague after we've already made recommendations
  const hasRecommendations = history.some((msg: any) => 
    msg.role === 'assistant' && msg.businesses && msg.businesses.length > 0
  );

  const isVague = messageContent.length < 20 && !messageContent.includes('yes') && !messageContent.includes('no');

  return isAmbiguous || (hasRecommendations && isVague);
}

function generateClarifyingQuestions(preferences: Partial<UserPreferences>, context: ConversationContext): string[] {
  const questions: string[] = [];

  if (!preferences.cuisineTypes || preferences.cuisineTypes.length === 0) {
    questions.push("What type of cuisine are you in the mood for?");
  }

  if (!preferences.priceRange) {
    questions.push("What's your budget like - looking for something budget-friendly ($), moderate ($$), or upscale ($$$)?");
  }

  if (!preferences.atmosphere) {
    questions.push("What kind of atmosphere are you looking for - casual, romantic, family-friendly, or upscale?");
  }

  if (!preferences.partySize || preferences.partySize === 0) {
    questions.push("How many people will be dining?");
  }

  return questions.slice(0, 2); // Limit to 2 questions to avoid overwhelming
}

// =============================================================================
// TRAVEL QUERY HANDLERS
// =============================================================================

async function handleTravelQuery(
  analysis: TravelQueryAnalysis, 
  message: string, 
  location: any, 
  context: ConversationContext
): Promise<YelpAIResponse> {
  
  const { category, intent, keywords } = analysis;
  
  switch (category) {
    case 'accommodation':
      return handleAccommodationQuery(message, location, context);
    case 'attractions':
      return handleAttractionsQuery(message, location, context);
    case 'transportation':
      return handleTransportationQuery(message, location, context);
    case 'entertainment':
      return handleEntertainmentQuery(message, location, context);
    case 'logistics':
      return handleLogisticsQuery(message, location, context);
    default:
      return handleGeneralTravelQuery(message, location, context);
  }
}

async function handleAccommodationQuery(message: string, location: any, context: ConversationContext): Promise<YelpAIResponse> {
  const locationName = location?.city || 'your area';
  const content = message.toLowerCase();
  
  // Determine accommodation type preference
  let accommodationType = 'general';
  if (content.includes('hotel')) accommodationType = 'hotel';
  else if (content.includes('hostel')) accommodationType = 'hostel';
  else if (content.includes('airbnb') || content.includes('vacation rental')) accommodationType = 'vacation_rental';
  else if (content.includes('resort')) accommodationType = 'resort';
  
  // Mock accommodation data (in real implementation, would come from booking APIs)
  const mockAccommodations = [
    {
      id: 'hotel_1',
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
    },
    {
      id: 'hotel_2',
      name: `Budget Inn ${locationName}`,
      rating: 3.8,
      review_count: 890,
      price: '$',
      categories: [{ alias: 'hotel', title: 'Budget Hotel' }],
      location: {
        address1: '456 Budget Ave',
        city: locationName,
        state: location?.state || 'State',
        zip_code: location?.zipCode || '12345',
        country: 'US',
        display_address: [`456 Budget Ave`, `${locationName}, ${location?.state || 'State'} ${location?.zipCode || '12345'}`]
      },
      coordinates: {
        latitude: (location?.latitude || 40.7128) + 0.01,
        longitude: (location?.longitude || -74.0060) + 0.01
      },
      photos: ['https://example.com/hotel2.jpg'],
      phone: '+1-555-0124',
      display_phone: '(555) 012-3457',
      url: 'https://example.com/hotel2',
      image_url: 'https://example.com/hotel2.jpg',
      is_closed: false,
      transactions: ['booking_available']
    }
  ];
  
  let responseMessage = `I found some great accommodation options in ${locationName}! `;
  
  if (accommodationType === 'hotel') {
    responseMessage += "Here are some excellent hotels for your stay:";
  } else if (accommodationType === 'hostel') {
    responseMessage += "Here are some budget-friendly hostels:";
  } else if (accommodationType === 'vacation_rental') {
    responseMessage += "Here are some vacation rental options:";
  } else {
    responseMessage += "Here are some accommodation options to consider:";
  }
  
  return {
    message: responseMessage,
    businesses: mockAccommodations,
    suggested_actions: [
      'Check availability',
      'Compare prices',
      'See amenities',
      'Book now'
    ],
    requires_clarification: false,
    timestamp: new Date().toISOString()
  };
}

async function handleAttractionsQuery(message: string, location: any, context: ConversationContext): Promise<YelpAIResponse> {
  const locationName = location?.city || 'your area';
  const content = message.toLowerCase();
  
  // Mock attraction data
  const mockAttractions = [
    {
      id: 'attraction_1',
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
    },
    {
      id: 'attraction_2',
      name: `${locationName} Central Park`,
      rating: 4.4,
      review_count: 3500,
      price: 'Free',
      categories: [{ alias: 'park', title: 'Public Park' }],
      location: {
        address1: '100 Park Avenue',
        city: locationName,
        state: location?.state || 'State',
        zip_code: location?.zipCode || '12345',
        country: 'US',
        display_address: [`100 Park Avenue`, `${locationName}, ${location?.state || 'State'} ${location?.zipCode || '12345'}`]
      },
      coordinates: {
        latitude: (location?.latitude || 40.7128) - 0.01,
        longitude: (location?.longitude || -74.0060) - 0.01
      },
      photos: ['https://example.com/park1.jpg'],
      phone: '+1-555-0126',
      display_phone: '(555) 012-3459',
      url: 'https://example.com/park1',
      image_url: 'https://example.com/park1.jpg',
      is_closed: false,
      transactions: []
    }
  ];
  
  let responseMessage = `I found some amazing attractions in ${locationName}! `;
  
  if (content.includes('museum') || content.includes('art') || content.includes('culture')) {
    responseMessage += "Here are some cultural attractions you'll love:";
  } else if (content.includes('park') || content.includes('outdoor') || content.includes('nature')) {
    responseMessage += "Here are some great outdoor attractions:";
  } else {
    responseMessage += "Here are some top attractions to explore:";
  }
  
  return {
    message: responseMessage,
    businesses: mockAttractions,
    suggested_actions: [
      'Get tickets',
      'Check hours',
      'Plan visit',
      'See more attractions'
    ],
    requires_clarification: false,
    timestamp: new Date().toISOString()
  };
}

async function handleTransportationQuery(message: string, location: any, context: ConversationContext): Promise<YelpAIResponse> {
  const locationName = location?.city || 'your location';
  const content = message.toLowerCase();
  
  // Mock transportation data
  const mockTransportation = [
    {
      id: 'transport_1',
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
    },
    {
      id: 'transport_2',
      name: `${locationName} Union Station`,
      rating: 4.1,
      review_count: 1800,
      price: 'N/A',
      categories: [{ alias: 'train_station', title: 'Train Station' }],
      location: {
        address1: '50 Station Plaza',
        city: locationName,
        state: location?.state || 'State',
        zip_code: location?.zipCode || '12345',
        country: 'US',
        display_address: [`50 Station Plaza`, `${locationName}, ${location?.state || 'State'} ${location?.zipCode || '12345'}`]
      },
      coordinates: {
        latitude: (location?.latitude || 40.7128) - 0.02,
        longitude: (location?.longitude || -74.0060) + 0.03
      },
      photos: ['https://example.com/station1.jpg'],
      phone: '+1-555-0128',
      display_phone: '(555) 012-3461',
      url: 'https://example.com/station1',
      image_url: 'https://example.com/station1.jpg',
      is_closed: false,
      transactions: ['ticket_booking']
    }
  ];
  
  let responseMessage = `Here are transportation options in ${locationName}! `;
  
  if (content.includes('flight') || content.includes('airport')) {
    responseMessage += "Here are airport and flight options:";
  } else if (content.includes('train') || content.includes('rail')) {
    responseMessage += "Here are train and rail options:";
  } else if (content.includes('bus')) {
    responseMessage += "Here are bus transportation options:";
  } else {
    responseMessage += "Here are various transportation options:";
  }
  
  return {
    message: responseMessage,
    businesses: mockTransportation,
    suggested_actions: [
      'Check schedules',
      'Book tickets',
      'Get directions',
      'Compare prices'
    ],
    requires_clarification: false,
    timestamp: new Date().toISOString()
  };
}

async function handleEntertainmentQuery(message: string, location: any, context: ConversationContext): Promise<YelpAIResponse> {
  const locationName = location?.city || 'your area';
  const content = message.toLowerCase();
  
  // Mock entertainment data
  const mockEntertainment = [
    {
      id: 'entertainment_1',
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
    },
    {
      id: 'entertainment_2',
      name: `Blue Note ${locationName}`,
      rating: 4.3,
      review_count: 1450,
      price: '$$',
      categories: [{ alias: 'music_venue', title: 'Music Venue' }],
      location: {
        address1: '131 Music Row',
        city: locationName,
        state: location?.state || 'State',
        zip_code: location?.zipCode || '12345',
        country: 'US',
        display_address: [`131 Music Row`, `${locationName}, ${location?.state || 'State'} ${location?.zipCode || '12345'}`]
      },
      coordinates: {
        latitude: (location?.latitude || 40.7128) - 0.005,
        longitude: (location?.longitude || -74.0060) + 0.005
      },
      photos: ['https://example.com/music1.jpg'],
      phone: '+1-555-0130',
      display_phone: '(555) 012-3463',
      url: 'https://example.com/music1',
      image_url: 'https://example.com/music1.jpg',
      is_closed: false,
      transactions: ['concert_tickets']
    }
  ];
  
  let responseMessage = `I found some great entertainment in ${locationName}! `;
  
  if (content.includes('theater') || content.includes('show') || content.includes('play')) {
    responseMessage += "Here are some excellent theaters and shows:";
  } else if (content.includes('music') || content.includes('concert') || content.includes('live')) {
    responseMessage += "Here are some fantastic music venues:";
  } else if (content.includes('nightlife') || content.includes('bar') || content.includes('club')) {
    responseMessage += "Here are some popular nightlife spots:";
  } else {
    responseMessage += "Here are some entertainment options you'll enjoy:";
  }
  
  return {
    message: responseMessage,
    businesses: mockEntertainment,
    suggested_actions: [
      'Get tickets',
      'Check showtimes',
      'See upcoming events',
      'Make reservations'
    ],
    requires_clarification: false,
    timestamp: new Date().toISOString()
  };
}

async function handleLogisticsQuery(message: string, location: any, context: ConversationContext): Promise<YelpAIResponse> {
  const locationName = location?.city || 'your destination';
  const content = message.toLowerCase();
  
  let responseMessage = `Here's some helpful travel information for ${locationName}: `;
  let advice = [];
  
  if (content.includes('weather') || content.includes('climate')) {
    advice.push("🌤️ Weather: Check current conditions and pack accordingly for the season.");
    responseMessage += "Weather information and seasonal advice.";
  } else if (content.includes('currency') || content.includes('money') || content.includes('payment')) {
    advice.push("💳 Currency: Most places accept credit cards, but carry some local cash for small vendors.");
    responseMessage += "Currency and payment information.";
  } else if (content.includes('visa') || content.includes('passport') || content.includes('requirement')) {
    advice.push("📋 Travel Requirements: Check visa requirements and ensure your passport is valid for at least 6 months.");
    responseMessage += "Travel requirements and documentation.";
  } else if (content.includes('custom') || content.includes('culture') || content.includes('tip')) {
    advice.push("🤝 Local Customs: Research local etiquette, tipping practices, and cultural norms.");
    responseMessage += "Local customs and cultural tips.";
  } else {
    advice = [
      "🌤️ Check the weather forecast and pack appropriate clothing",
      "💳 Ensure you have payment methods that work locally",
      "📋 Verify all travel documents are up to date",
      "🤝 Learn about local customs and etiquette",
      "📱 Download helpful travel apps and offline maps"
    ];
    responseMessage += "General travel advice and tips.";
  }
  
  const formattedAdvice = advice.length > 0 ? `\n\n${advice.join('\n')}` : '';
  
  return {
    message: responseMessage + formattedAdvice,
    businesses: [],
    suggested_actions: [
      'Weather forecast',
      'Local customs guide',
      'Currency information',
      'Travel checklist'
    ],
    requires_clarification: false,
    timestamp: new Date().toISOString()
  };
}

async function handleGeneralTravelQuery(message: string, location: any, context: ConversationContext): Promise<YelpAIResponse> {
  const locationName = location?.city || 'your destination';
  
  return {
    message: `I'm here to help with your travel needs in ${locationName}! I can assist with restaurants, attractions, accommodations, transportation, and general travel advice. What would you like to explore?`,
    businesses: [],
    suggested_actions: [
      'Find restaurants',
      'Discover attractions',
      'Book accommodations',
      'Plan transportation'
    ],
    requires_clarification: false,
    timestamp: new Date().toISOString()
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Message is required and must be a string',
            retryable: false
          }
        },
        { status: 400 }
      );
    }

    // Validate location if provided
    if (body.location && !isValidLocation(body.location)) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid location format',
            retryable: false
          }
        },
        { status: 400 }
      );
    }

    // Prepare the request for Yelp AI API with enhanced context
    const conversationHistory = body.conversation_history || [];
    
    // Extract context from conversation history
    const extractedPreferences = extractPreferencesFromHistory(conversationHistory);
    const conversationContext = buildConversationContext(conversationHistory, body.message);
    
    const yelpRequest: YelpAIRequest = {
      messages: [
        ...conversationHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        })),
        {
          role: 'user',
          content: body.message
        }
      ],
      location: body.location,
      session_id: body.session_id || `session_${Date.now()}`
    };

    // Analyze the travel query category
    const queryAnalysis = categorizeTravelQuery(body.message);
    
    // Route to appropriate handler based on category
    let finalResponse: YelpAIResponse;
    const mergedPreferences = { ...extractedPreferences, ...body.user_preferences };
    
    if (queryAnalysis.category === 'dining' || queryAnalysis.confidence < 0.3) {
      // Handle dining queries with existing Yelp AI API
      const yelpResponse = await handleYelpAIRequest(yelpRequest);
      finalResponse = yelpResponse;
    } else {
      // Handle non-dining travel queries
      finalResponse = await handleTravelQuery(queryAnalysis, body.message, body.location, conversationContext);
    }
    
    // Check if we need clarification
    if (conversationContext.clarificationNeeded && (!finalResponse.businesses || finalResponse.businesses.length === 0)) {
      const clarifyingQuestions = generateClarifyingQuestions(mergedPreferences, conversationContext);
      
      if (clarifyingQuestions.length > 0) {
        finalResponse = {
          ...finalResponse,
          message: `I'd love to help you find the perfect spot! To give you the best recommendation, could you tell me: ${clarifyingQuestions.join(' Also, ')}`,
          requires_clarification: true,
          clarification_questions: clarifyingQuestions,
          suggested_actions: ['Tell me more', 'Surprise me', 'Show popular options']
        };
      }
    }
    // If we have multiple businesses and preferences, use decision engine (only for dining queries)
    else if (queryAnalysis.category === 'dining' && 
        finalResponse.businesses && 
        Array.isArray(finalResponse.businesses) &&
        finalResponse.businesses.length > 1 && 
        (body.user_preferences || Object.keys(mergedPreferences).length > 0) && 
        body.location) {
      
      try {
        const decision = await decisionEngine.selectBestRestaurant({
          businesses: finalResponse.businesses!,
          userPreferences: mergedPreferences as any,
          location: body.location,
          conversationContext: conversationContext
        });

        // Override the response with autonomous decision
        finalResponse = {
          ...finalResponse,
          message: `${decision.reasoning} I've selected ${decision.selectedBusiness.name} as the perfect choice for you!`,
          businesses: [decision.selectedBusiness, ...(decision.alternatives || [])],
          suggested_actions: ['Make a reservation', 'Get directions', 'View menu', 'See alternatives']
        };
      } catch (decisionError) {
        console.warn('Decision engine failed, using original response:', decisionError);
        // Fall back to original response
      }
    }
    // Handle follow-up questions and context
    else if (conversationHistory.length > 0) {
      // Check if this is a follow-up to previous recommendations
      const lastAssistantMessage = conversationHistory
        .filter((msg: any) => msg.role === 'assistant')
        .pop();
      
      if (lastAssistantMessage?.businesses && body.message.toLowerCase().includes('alternative')) {
        // User is asking for alternatives
        finalResponse = {
          ...finalResponse,
          message: `Here are some other great options I found for you:`,
          businesses: lastAssistantMessage.businesses.slice(1, 4), // Show alternatives
          suggested_actions: ['Make a reservation', 'Get directions', 'Tell me more', 'Keep looking']
        };
      }
    }

    // Process and format the response
    const response: YelpAIResponse = {
      message: finalResponse.message,
      businesses: finalResponse.businesses || [],
      reservation_info: finalResponse.reservation_info,
      suggested_actions: finalResponse.suggested_actions || [],
      requires_clarification: finalResponse.requires_clarification || false,
      timestamp: new Date().toISOString()
    };

    // Add conversation message to history for future requests
    const conversationMessage: ConversationMessage = {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      businesses: response.businesses,
      metadata: {
        suggested_actions: response.suggested_actions,
        requires_clarification: response.requires_clarification
      }
    };

    return NextResponse.json({
      success: true,
      data: response,
      conversation_message: conversationMessage
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Determine error type and provide appropriate response
    let errorCode = 'SERVER_ERROR';
    let statusCode = 500;
    let userMessage = 'An unexpected error occurred while processing your request';
    let retryable = true;

    if (error instanceof SyntaxError) {
      errorCode = 'VALIDATION_ERROR';
      statusCode = 400;
      userMessage = 'Invalid request format';
      retryable = false;
    } else if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as any;
      if (apiError.status === 429) {
        errorCode = 'RATE_LIMIT_ERROR';
        statusCode = 429;
        userMessage = 'Too many requests. Please wait a moment and try again.';
        retryable = true;
      } else if (apiError.status === 401) {
        errorCode = 'AUTHENTICATION_ERROR';
        statusCode = 401;
        userMessage = 'Authentication failed. Please try again.';
        retryable = false;
      } else if (apiError.status >= 500) {
        errorCode = 'SERVER_ERROR';
        statusCode = 503;
        userMessage = 'Service temporarily unavailable. Please try again.';
        retryable = true;
      }
    } else if (error instanceof Error && error.message.includes('fetch')) {
      errorCode = 'NETWORK_ERROR';
      statusCode = 503;
      userMessage = 'Network error. Please check your connection and try again.';
      retryable = true;
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: errorCode,
          message: userMessage,
          retryable,
          timestamp: new Date().toISOString()
        }
      },
      { status: statusCode }
    );
  }
}

// Handle GET requests for API documentation
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/chat',
    method: 'POST',
    description: 'Chat with Yelp AI for restaurant recommendations and bookings',
    required_fields: {
      message: 'string - The user\'s message or query'
    },
    optional_fields: {
      location: 'Location - User\'s current or preferred location',
      conversation_history: 'ConversationMessage[] - Previous conversation messages',
      user_preferences: 'UserPreferences - User\'s dining preferences',
      session_id: 'string - Session identifier for conversation continuity',
      context: 'object - Additional context information'
    },
    response_format: {
      success: 'boolean',
      data: 'YelpAIResponse',
      conversation_message: 'ConversationMessage'
    },
    example_request: {
      message: "Find me a good Italian restaurant nearby for dinner tonight",
      location: {
        latitude: 37.7749,
        longitude: -122.4194,
        address: "San Francisco, CA"
      },
      user_preferences: {
        cuisine_types: ["italian"],
        price_range: "$$",
        dietary_restrictions: []
      }
    }
  });
}