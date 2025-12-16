'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type {
  ConversationState,
  ConversationMessage,
  ConversationContext as ConversationContextType,
  ConversationStage,
  UserPreferences,
  Location,
  Business
} from '@/lib/types';

// =============================================================================
// CONTEXT TYPES
// =============================================================================

interface ConversationActions {
  addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateContext: (updates: Partial<ConversationContextType>) => void;
  setStage: (stage: ConversationStage) => void;
  clearConversation: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

interface ConversationContextValue extends ConversationState {
  actions: ConversationActions;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

const initialContext: ConversationContextType = {
  lastUserQuery: '',
  extractedPreferences: {},
  clarificationNeeded: false,
  stage: 'initial'
};

const initialState: ConversationState = {
  messages: [],
  isLoading: false,
  error: null,
  context: initialContext
};

// =============================================================================
// REDUCER
// =============================================================================

type ConversationAction =
  | { type: 'ADD_MESSAGE'; payload: Omit<ConversationMessage, 'id' | 'timestamp'> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_CONTEXT'; payload: Partial<ConversationContextType> }
  | { type: 'SET_STAGE'; payload: ConversationStage }
  | { type: 'CLEAR_CONVERSATION' }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> };

function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      const newMessage: ConversationMessage = {
        ...action.payload,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date()
      };

      // Enhanced context update based on message
      let updatedContext = { ...state.context };
      
      if (newMessage.role === 'user') {
        updatedContext.lastUserQuery = newMessage.content;
        updatedContext.stage = 'searching';
        
        // Extract preferences from user message
        const extractedPrefs = extractPreferencesFromMessage(newMessage.content);
        updatedContext.extractedPreferences = {
          ...updatedContext.extractedPreferences,
          ...extractedPrefs
        };
        
        // Check if user is asking for clarification or follow-up
        const isFollowUp = detectFollowUpIntent(newMessage.content, state.messages);
        if (isFollowUp) {
          updatedContext.clarificationNeeded = false; // User provided more info
        }
      } else if (newMessage.role === 'assistant') {
        if (newMessage.businesses?.length) {
          updatedContext.stage = 'decision_made';
        }
        
        // Check if assistant is asking for clarification
        if (newMessage.metadata?.requires_clarification) {
          updatedContext.clarificationNeeded = true;
        }
      }

      return {
        ...state,
        messages: [...state.messages, newMessage],
        context: updatedContext,
        error: null // Clear any previous errors when adding messages
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false // Stop loading when there's an error
      };

    case 'UPDATE_CONTEXT':
      return {
        ...state,
        context: {
          ...state.context,
          ...action.payload
        }
      };

    case 'SET_STAGE':
      return {
        ...state,
        context: {
          ...state.context,
          stage: action.payload
        }
      };

    case 'CLEAR_CONVERSATION':
      return {
        ...initialState,
        context: {
          ...initialContext,
          extractedPreferences: state.context.extractedPreferences // Keep preferences
        }
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        context: {
          ...state.context,
          extractedPreferences: {
            ...state.context.extractedPreferences,
            ...action.payload
          }
        }
      };

    default:
      return state;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function extractPreferencesFromMessage(message: string): Partial<UserPreferences> {
  const preferences: Partial<UserPreferences> = {};
  const content = message.toLowerCase();

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

  const cuisineTypes: string[] = [];
  for (const [cuisine, keywords] of Object.entries(cuisineKeywords)) {
    if (keywords.some(keyword => content.includes(keyword))) {
      cuisineTypes.push(cuisine);
    }
  }
  if (cuisineTypes.length > 0) {
    preferences.cuisineTypes = cuisineTypes;
  }

  // Extract price preferences
  if (content.includes('cheap') || content.includes('budget') || content.includes('affordable')) {
    preferences.priceRange = '$';
  } else if (content.includes('expensive') || content.includes('fancy') || content.includes('upscale')) {
    preferences.priceRange = '$$$';
  } else if (content.includes('moderate') || content.includes('mid-range')) {
    preferences.priceRange = '$$';
  }

  // Extract party size
  const partySizeMatch = content.match(/(\d+)\s*(people|person|pax)/);
  if (partySizeMatch) {
    preferences.partySize = parseInt(partySizeMatch[1]);
  }

  return preferences;
}

function detectFollowUpIntent(message: string, previousMessages: ConversationMessage[]): boolean {
  const content = message.toLowerCase();
  
  // Check if user is providing more information after a clarification request
  const lastAssistantMessage = previousMessages
    .filter(msg => msg.role === 'assistant')
    .pop();
  
  if (lastAssistantMessage?.metadata?.requires_clarification) {
    // User is responding to clarification
    return true;
  }

  // Check for follow-up keywords
  const followUpKeywords = [
    'actually', 'also', 'but', 'however', 'instead', 'or maybe', 'what about',
    'alternatively', 'on second thought', 'change of mind'
  ];

  return followUpKeywords.some(keyword => content.includes(keyword));
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const ConversationContext = createContext<ConversationContextValue | null>(null);

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

interface ConversationProviderProps {
  children: ReactNode;
}

export function ConversationProvider({ children }: ConversationProviderProps) {
  const [state, dispatch] = useReducer(conversationReducer, initialState);

  const actions: ConversationActions = {
    addMessage: (message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    },

    setLoading: (loading) => {
      dispatch({ type: 'SET_LOADING', payload: loading });
    },

    setError: (error) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    },

    updateContext: (updates) => {
      dispatch({ type: 'UPDATE_CONTEXT', payload: updates });
    },

    setStage: (stage) => {
      dispatch({ type: 'SET_STAGE', payload: stage });
    },

    clearConversation: () => {
      dispatch({ type: 'CLEAR_CONVERSATION' });
    },

    updatePreferences: (preferences) => {
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
    }
  };

  const contextValue: ConversationContextValue = {
    ...state,
    actions
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useConversation() {
  const context = useContext(ConversationContext);
  
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  
  return context;
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

export function useConversationActions() {
  const { actions } = useConversation();
  return actions;
}

export function useConversationState() {
  const { messages, isLoading, error, context } = useConversation();
  return { messages, isLoading, error, context };
}