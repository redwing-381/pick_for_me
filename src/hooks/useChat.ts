'use client';

import { useCallback } from 'react';
import { useConversation } from '@/contexts/ConversationContext';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import type { Location, UserPreferences, YelpAIResponse } from '@/lib/types';

// =============================================================================
// CHAT HOOK INTERFACES
// =============================================================================

interface SendMessageOptions {
  location?: Location | null;
  userPreferences?: UserPreferences;
  retryOnFailure?: boolean;
  maxRetries?: number;
  timeout?: number;
}

interface UseChatReturn {
  sendMessage: (message: string, options?: SendMessageOptions) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  retry: () => Promise<void>;
  clearError: () => void;
}

// =============================================================================
// CHAT HOOK
// =============================================================================

export function useChat(): UseChatReturn {
  const { messages, isLoading, error, actions } = useConversation();
  const errorHandler = useErrorHandler({
    component: 'ChatInterface',
    enableNetworkMonitoring: true
  });

  const sendMessage = useCallback(async (
    message: string,
    options: SendMessageOptions = {}
  ): Promise<void> => {
    const {
      location,
      userPreferences,
      retryOnFailure = true,
      maxRetries = 3,
      timeout = 30000
    } = options;

    // Add user message to conversation first
    actions.addMessage({
      role: 'user',
      content: message
    });

    actions.setLoading(true);
    actions.setError(null);

    const sendMessageWithRetry = async (attempt: number = 1): Promise<void> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestBody = {
          message,
          location,
          user_preferences: userPreferences,
          conversation_history: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          })),
          session_id: `session_${Date.now()}`
        };

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'API request failed');
        }

        const aiResponse: YelpAIResponse = data.data;

        // Add AI response to conversation
        actions.addMessage({
          role: 'assistant',
          content: aiResponse.message,
          businesses: aiResponse.businesses,
          metadata: {
            suggested_actions: aiResponse.suggested_actions,
            requires_clarification: aiResponse.requires_clarification,
            // timestamp is handled by ConversationMessage
          }
        });

        // Update conversation context if needed
        if (aiResponse.businesses && aiResponse.businesses.length > 0) {
          actions.setStage('decision_made');
        }

        actions.setLoading(false);

      } catch (error) {
        console.error(`Chat API attempt ${attempt} failed:`, error);

        // Handle specific error types
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please try again.');
          }
          
          if (error.message.includes('fetch')) {
            throw new Error('Network error. Please check your connection and try again.');
          }
        }

        // Retry logic
        if (retryOnFailure && attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.log(`Retrying in ${delay}ms... (attempt ${attempt + 1}/${maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return sendMessageWithRetry(attempt + 1);
        }

        // Final failure
        actions.setLoading(false);
        
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        actions.setError(errorMessage);

        // Add error message to conversation
        actions.addMessage({
          role: 'assistant',
          content: `I apologize, but I encountered an error: ${errorMessage}. Please try again or rephrase your question.`,
          metadata: {
            // Error message metadata
          }
        });

        throw error;
      }
    };

    await errorHandler.handleAsyncAction(
      () => sendMessageWithRetry(),
      'sendMessage',
      {
        retry: () => sendMessageWithRetry(),
        fallback: async () => {
          // Fallback: Add a generic error message
          actions.addMessage({
            role: 'assistant',
            content: 'I\'m having trouble connecting right now. Please check your internet connection and try again.',
            metadata: {
              // Connection error metadata
            }
          });
        }
      },
      { message, location: location?.city, userPreferences }
    );
  }, [messages, actions, errorHandler]);

  const retry = useCallback(async () => {
    if (errorHandler.error && messages.length > 0) {
      const lastUserMessage = messages
        .filter(msg => msg.role === 'user')
        .pop();
      
      if (lastUserMessage) {
        await sendMessage(lastUserMessage.content);
      }
    }
  }, [errorHandler.error, messages, sendMessage]);

  const clearError = useCallback(() => {
    actions.setError(null);
    errorHandler.clearError();
  }, [actions, errorHandler]);

  return {
    sendMessage,
    isLoading: isLoading || errorHandler.isLoading,
    error: error || errorHandler.error?.userMessage || null,
    retry,
    clearError
  };
}

// =============================================================================
// SPECIALIZED CHAT HOOKS
// =============================================================================

export function useChatWithLocation(location: Location | null) {
  const chat = useChat();
  
  const sendMessageWithLocation = useCallback((message: string, options?: Omit<SendMessageOptions, 'location'>) => {
    return chat.sendMessage(message, { ...options, location });
  }, [chat, location]);

  return {
    ...chat,
    sendMessage: sendMessageWithLocation
  };
}

export function useChatWithPreferences(userPreferences: UserPreferences) {
  const chat = useChat();
  
  const sendMessageWithPreferences = useCallback((message: string, options?: Omit<SendMessageOptions, 'userPreferences'>) => {
    return chat.sendMessage(message, { ...options, userPreferences });
  }, [chat, userPreferences]);

  return {
    ...chat,
    sendMessage: sendMessageWithPreferences
  };
}