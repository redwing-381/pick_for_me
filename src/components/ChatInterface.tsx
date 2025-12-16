'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useConversation } from '@/contexts/ConversationContext';
import { useChat } from '@/hooks/useChat';
import RestaurantCard from '@/components/RestaurantCard';
import type { Location, UserPreferences, Business } from '@/lib/types';

// =============================================================================
// CHAT INTERFACE COMPONENT
// =============================================================================

interface ChatInterfaceProps {
  location?: Location | null;
  userPreferences?: UserPreferences;
  onBusinessSelected?: (business: Business) => void;
  className?: string;
}

export default function ChatInterface({
  location,
  userPreferences,
  onBusinessSelected,
  className = ''
}: ChatInterfaceProps) {
  const { messages } = useConversation();
  const { sendMessage, isLoading, error, retry, clearError } = useChat();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    try {
      await sendMessage(userMessage, {
        location,
        userPreferences,
        retryOnFailure: true,
        maxRetries: 3
      });
    } catch (error) {
      // Error is already handled by the useChat hook
      console.error('Failed to send message:', error);
    }

    try {
      // Prepare request payload
      const requestPayload = {
        message: userMessage,
        location,
        user_preferences: userPreferences,
        conversation_history: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp.toISOString()
        })),
        session_id: `session_${Date.now()}`
      };

      // Call chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get response');
      }

      if (result.success && result.data) {
        // Response is handled by useChat hook
        // If there's a selected business, notify parent
        if (result.data.businesses?.length > 0 && onBusinessSelected) {
          onBusinessSelected(result.data.businesses[0]);
        }
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Chat error:', error);
      // Error is handled by useChat hook
    } finally {
      // Loading state is handled by useChat hook
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBusinessClick = (business: Business) => {
    if (onBusinessSelected) {
      onBusinessSelected(business);
    }
  };

  const handleSuggestedAction = (action: string, business?: Business) => {
    let message = '';
    
    switch (action.toLowerCase()) {
      case 'make a reservation':
        message = business ? `Make a reservation at ${business.name}` : 'Make a reservation';
        break;
      case 'get directions':
        message = business ? `Get directions to ${business.name}` : 'Get directions';
        break;
      case 'view menu':
        message = business ? `Show me the menu for ${business.name}` : 'Show me the menu';
        break;
      case 'see alternatives':
        message = 'Show me other options';
        break;
      case 'tell me more':
        message = business ? `Tell me more about ${business.name}` : 'Tell me more about these options';
        break;
      case 'surprise me':
        message = 'Just pick something good for me';
        break;
      case 'show popular options':
        message = 'Show me the most popular restaurants nearby';
        break;
      case 'keep looking':
        message = 'Keep looking for more options';
        break;
      default:
        message = action;
    }
    
    setInputValue(message);
    inputRef.current?.focus();
  };

  return (
    <div className={`flex flex-col h-full bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-gray-50 rounded-t-lg">
        <h2 className="text-lg font-semibold text-gray-900">Pick For Me</h2>
        <p className="text-sm text-gray-600">Tell me what you&apos;re craving, and I&apos;ll pick the perfect spot!</p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-4.126-.98L3 20l1.98-5.874A8.955 8.955 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">Start a conversation!</p>
            <p className="text-sm text-gray-500">Try: &ldquo;Find me a good Italian restaurant nearby&rdquo;</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              
              {/* Show businesses if present */}
              {message.businesses && message.businesses.length > 0 && (
                <div className="mt-3 space-y-3">
                  {message.businesses.slice(0, 3).map((business) => (
                    <div key={business.id} className="max-w-sm">
                      <RestaurantCard
                        restaurant={business}
                        variant="compact"
                        onSelect={handleBusinessClick}
                        showBookingButton={false}
                        className="shadow-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Show clarification questions */}
              {message.metadata?.requires_clarification && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800 font-medium mb-2">I need a bit more info to help you better:</p>
                  <div className="space-y-1">
                    {/* This would show individual clarification questions if available */}
                    <p className="text-xs text-yellow-700">Feel free to be more specific about what you&apos;re looking for!</p>
                  </div>
                </div>
              )}

              {/* Show suggested actions */}
              {message.metadata?.suggested_actions && message.metadata.suggested_actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.metadata.suggested_actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedAction(action, message.businesses?.[0])}
                      className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        message.metadata?.requires_clarification
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              <div className="text-xs opacity-70 mt-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-600">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm max-w-md">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium mb-1">Something went wrong</p>
                  <p className="text-red-700 mb-3">{error}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={retry}
                      className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={clearError}
                      className="text-xs bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t p-4">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what you&apos;re looking for..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}