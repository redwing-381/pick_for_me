'use client';

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { useConversation } from '@/contexts/ConversationContext';
import { useChat } from '@/hooks/useChat';
import RestaurantCard from '@/components/RestaurantCard';
import AIDecisionCard from '@/components/AIDecisionCard';
// Performance tracking imports removed - using standard React hooks
import type { Location, UserPreferences, Business, InteractiveSuggestion, DecisionResponse } from '@/lib/types';

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
  location = null,
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
    <div className={`flex flex-col h-full bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${className}`}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b-4 border-black bg-yellow-400">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-black border-2 border-black flex items-center justify-center">
            <span className="text-yellow-400 font-black text-xl">🤖</span>
          </div>
          <div>
            <h2 className="text-xl font-black text-black">Pick For Me</h2>
            <p className="text-sm font-bold text-black">Tell me what you&apos;re craving!</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-teal-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-6 flex items-center justify-center transform rotate-3">
              <span className="text-black font-black text-3xl">💬</span>
            </div>
            <p className="text-xl font-black text-black mb-3">Let&apos;s Find Your Perfect Spot!</p>
            <p className="text-base font-bold text-gray-700 mb-6">I&apos;ll help you discover amazing places</p>
            <div className="max-w-md mx-auto space-y-2">
              <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
                <p className="text-sm font-bold text-gray-800">💡 Try asking:</p>
                <p className="text-sm text-gray-600 mt-1">&ldquo;Find me a cozy Italian restaurant nearby&rdquo;</p>
              </div>
              <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
                <p className="text-sm text-gray-600">&ldquo;I want sushi for under $30&rdquo;</p>
              </div>
              <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
                <p className="text-sm text-gray-600">&ldquo;Show me the best spa in town&rdquo;</p>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-blue-400'
                  : 'bg-white'
              }`}
            >
              <p className="text-sm font-bold text-black">{message.content}</p>
              
              {/* Show AI Decision if present */}
              {message.metadata?.aiDecision && (
                <div className="mt-4 -mx-4 -mb-2">
                  <AIDecisionCard
                    decision={message.metadata.aiDecision}
                    onBook={(business) => {
                      handleBusinessClick(business);
                      // Trigger booking flow
                      handleSuggestedAction('Make a reservation', business);
                    }}
                    onShowAlternatives={() => {
                      handleSuggestedAction('Show alternatives');
                    }}
                    className="max-w-2xl"
                  />
                </div>
              )}

              {/* Show businesses if present (fallback for non-AI decisions) */}
              {message.businesses && message.businesses.length > 0 && !message.metadata?.aiDecision && (
                <div className="mt-3 space-y-3">
                  {message.businesses.slice(0, 3).map((business) => (
                    <div key={business.id} className="max-w-sm">
                      <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                        {/* Business Image */}
                        {business.image_url && (
                          <img
                            src={business.image_url}
                            alt={business.name}
                            className="w-full h-32 object-cover border-2 border-black mb-3"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        
                        {/* Business Info */}
                        <h4 className="text-lg font-black text-black mb-2">{business.name}</h4>
                        
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="flex items-center">
                            <span className="text-yellow-400 font-black">★</span>
                            <span className="text-sm font-bold text-black ml-1">
                              {business.rating} ({business.review_count})
                            </span>
                          </div>
                          {business.price && (
                            <span className="text-sm font-black text-teal-600">
                              {business.price}
                            </span>
                          )}
                        </div>
                        
                        {business.categories && business.categories.length > 0 && (
                          <p className="text-xs font-bold text-gray-700 mb-3">
                            {business.categories.map(c => c.title).join(', ')}
                          </p>
                        )}
                        
                        {business.location && (
                          <p className="text-xs font-bold text-gray-600 mb-3">
                            📍 {business.location.display_address.join(', ')}
                          </p>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleBusinessClick(business)}
                            className="flex-1 px-3 py-2 bg-teal-400 text-black text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-center"
                          >
                            Book Now
                          </button>
                          {business.url && (
                            <a
                              href={business.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="px-3 py-2 bg-yellow-400 text-black text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                            >
                              🔗
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Show clarification questions */}
              {message.metadata?.requires_clarification && (
                <div className="mt-3 p-3 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <p className="text-xs text-black font-black mb-2">💡 I need a bit more info:</p>
                  <div className="space-y-1">
                    {/* This would show individual clarification questions if available */}
                    <p className="text-xs text-black font-bold">Feel free to be more specific about what you&apos;re looking for!</p>
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
                      className={`px-3 py-2 text-xs font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                        message.metadata?.requires_clarification
                          ? 'bg-yellow-400 text-black'
                          : 'bg-white text-black'
                      }`}
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-current animate-pulse"></div>
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
                  <p className="text-xs text-black font-black">Try these:</p>
                  <div className="flex flex-wrap gap-2">
                    {message.metadata.interactive_suggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        onClick={() => handleInteractiveSuggestion(suggestion)}
                        disabled={isLoading}
                        className="px-3 py-2 text-xs font-black bg-white text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-current animate-pulse"></div>
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

              <div className="text-xs font-bold text-gray-600 mt-2">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-3">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-black animate-bounce"></div>
                  <div className="w-3 h-3 bg-black animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 bg-black animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm font-black text-black">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] px-4 py-3 text-sm max-w-md">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-black flex items-center justify-center flex-shrink-0">
                  <span className="text-red-400 font-black text-lg">!</span>
                </div>
                <div className="flex-1">
                  <p className="font-black text-black mb-1">Oops!</p>
                  <p className="font-bold text-black mb-3">{error}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={retry}
                      className="text-xs font-black bg-black text-red-400 px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={clearError}
                      className="text-xs font-black bg-white text-black px-3 py-2 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
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
      <div className="flex-shrink-0 border-t-4 border-black p-4 bg-white">
        <div className="flex space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Tell me what you&apos;re looking for..."
            className="flex-1 px-4 py-3 border-4 border-black font-bold text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-teal-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}