import { NextRequest, NextResponse } from 'next/server';
import { YelpAIRequest, YelpAIResponse, ConversationMessage, UserPreferences, ConversationContext } from '@/lib/types';
import { handleYelpAIRequest } from '@/lib/yelp-server';
import { isValidLocation } from '@/lib/type-guards';
import { decisionEngine } from '@/lib/decision-engine';

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

function buildConversationContext(history: any[], currentMessage: string): ConversationContext {
  const lastUserMessages = history
    .filter((msg: any) => msg.role === 'user')
    .slice(-3) // Last 3 user messages for context
    .map((msg: any) => msg.content);

  const hasBusinessRecommendations = history.some((msg: any) => 
    msg.role === 'assistant' && msg.businesses && msg.businesses.length > 0
  );

  const needsClarification = detectClarificationNeeds(currentMessage, history);

  return {
    lastUserQuery: currentMessage,
    extractedPreferences: extractPreferencesFromHistory(history),
    clarificationNeeded: needsClarification,
    stage: hasBusinessRecommendations ? 'decision_made' : 'searching'
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate location if provided
    if (body.location && !isValidLocation(body.location)) {
      return NextResponse.json(
        { error: 'Invalid location format' },
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

    // Call Yelp AI API through server utils
    const yelpResponse = await handleYelpAIRequest(yelpRequest);

    // Enhanced response processing with context preservation
    let finalResponse = yelpResponse;
    const mergedPreferences = { ...extractedPreferences, ...body.user_preferences };
    
    // Check if we need clarification
    if (conversationContext.clarificationNeeded && (!yelpResponse.businesses || yelpResponse.businesses.length === 0)) {
      const clarifyingQuestions = generateClarifyingQuestions(mergedPreferences, conversationContext);
      
      if (clarifyingQuestions.length > 0) {
        finalResponse = {
          ...yelpResponse,
          message: `I'd love to help you find the perfect spot! To give you the best recommendation, could you tell me: ${clarifyingQuestions.join(' Also, ')}`,
          requires_clarification: true,
          clarification_questions: clarifyingQuestions,
          suggested_actions: ['Tell me more', 'Surprise me', 'Show popular options']
        };
      }
    }
    // If we have multiple businesses and preferences, use decision engine
    else if (yelpResponse.businesses && 
        Array.isArray(yelpResponse.businesses) &&
        yelpResponse.businesses.length > 1 && 
        (body.user_preferences || Object.keys(mergedPreferences).length > 0) && 
        body.location) {
      
      try {
        const decision = await decisionEngine.selectBestRestaurant({
          businesses: yelpResponse.businesses!,
          userPreferences: mergedPreferences as any,
          location: body.location,
          conversationContext: conversationContext
        });

        // Override the response with autonomous decision
        finalResponse = {
          ...yelpResponse,
          message: `${decision.reasoning} I've selected ${decision.selectedBusiness.name} as the perfect choice for you!`,
          businesses: [decision.selectedBusiness, ...(decision.alternatives || [])],
          suggested_actions: ['Make a reservation', 'Get directions', 'View menu', 'See alternatives']
        };
      } catch (decisionError) {
        console.warn('Decision engine failed, using original response:', decisionError);
        // Fall back to original Yelp response
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
          ...yelpResponse,
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
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An unexpected error occurred while processing your request'
      },
      { status: 500 }
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