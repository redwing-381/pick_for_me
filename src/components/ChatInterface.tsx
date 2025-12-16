'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useConversation } from '@/contexts/ConversationContext';
import { useChat } from '@/hooks/useChat';
import RestaurantCard from '@/components/RestaurantCard';
import type { Location, UserPreferences, Business, InteractiveSuggestion } from '@/lib/types';

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
  const { messages, actions } = useConversation();
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

  const handleInteractiveSuggestion = async (suggestion: InteractiveSuggestion) => {
    // Add interaction to history
    actions.addInteractionHistory({
      type: 'suggestion_clicked',
      data: { suggestion }
    });

    try {
      switch (suggestion.action) {
        case 'query':
          await sendMessage(suggestion.text, {
            location,
            userPreferences,
            retryOnFailure: true,
            maxRetries: 3
          });
          break;
        case 'book':
          // Handle booking action
          if (suggestion.data?.business && onBusinessSelected) {
            onBusinessSelected(suggestion.data.business);
            actions.addInteractionHistory({
              type: 'business_selected',
              data: { business: suggestion.data.business }
            });
          }
          await sendMessage(`Book ${suggestion.data?.business?.name || 'this option'}`, {
            location,
            userPreferences,
            retryOnFailure: true,
            maxRetries: 3
          });
          break;
        case 'explore':
          await sendMessage(`Tell me more about ${suggestion.text}`, {
            location,
            userPreferences,
            retryOnFailure: true,
            maxRetries: 3
          });
          break;
        case 'clarify':
          await sendMessage(suggestion.text, {
            location,
            userPreferences,
            retryOnFailure: true,
            maxRetries: 3
          });
          break;
        default:
          await sendMessage(suggestion.text, {
            location,
            userPreferences,
            retryOnFailure: true,
            maxRetries: 3
          });
      }
    } catch (error) {
      console.error('Failed to process interactive suggestion:', error);
    }
  };

  const getSuggestionStyle = (category?: string, action?: string) => {
    const baseStyle = 'border transition-all duration-200 transform hover:scale-105 hover:shadow-sm';
    
    switch (category) {
      case 'travel':
        return `${baseStyle} bg-green-100 text-green-700 hover:bg-green-200 border-green-300`;
      case 'dining':
        return `${baseStyle} bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-300`;
      case 'accommodation':
        return `${baseStyle} bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-300`;
      case 'transportation':
        return `${baseStyle} bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-300`;
      case 'attraction':
        return `${baseStyle} bg-pink-100 text-pink-700 hover:bg-pink-200 border-pink-300`;
      default:
        return `${baseStyle} bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300`;
    }
  };

  const getSuggestionIcon = (action: string) => {
    switch (action) {
      case 'book':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'explore':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      case 'clarify':
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        );
    }
  };

  const handleSuggestedAction = async (action: string, business?: Business) => {
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
    
    // Process the suggestion as a typed query immediately
    try {
      await sendMessage(message, {
        location,
        userPreferences,
        retryOnFailure: true,
        maxRetries: 3
      });
    } catch (error) {
      console.error('Failed to process suggestion:', error);
    }
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
                      disabled={isLoading}
                      className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                        message.metadata?.requires_clarification
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                          <span>{action}</span>
                        </div>
                      ) : (
                        action
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Show interactive suggestions */}
              {message.metadata?.interactive_suggestions && message.metadata.interactive_suggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-gray-600 font-medium">Try these:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.metadata.interactive_suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleInteractiveSuggestion(suggestion)}
                        disabled={isLoading}
                        className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                          getSuggestionStyle(suggestion.category, suggestion.action)
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
                            <span>{suggestion.text}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            {getSuggestionIcon(suggestion.action)}
                            <span>{suggestion.text}</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
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