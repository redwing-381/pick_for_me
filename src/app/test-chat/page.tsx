'use client';

import { useState } from 'react';
import { ConversationMessage, Location, UserPreferences } from '@/lib/types';

export default function TestChatPage() {
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);

  const testLocation: Location = {
    latitude: 37.7749,
    longitude: -122.4194,
    address: "San Francisco, CA"
  };

  const testPreferences: UserPreferences = {
    cuisine_types: ["italian"],
    price_range: "$$",
    dietary_restrictions: [],
    atmosphere: "casual"
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    setLoading(true);
    try {
      const requestBody = {
        message: message.trim(),
        location: testLocation,
        user_preferences: testPreferences,
        conversation_history: conversation,
        session_id: `test_session_${Date.now()}`
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const result = await res.json();
      setResponse(result);

      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };

      // Add assistant response if successful
      if (result.success && result.conversation_message) {
        setConversation(prev => [...prev, userMessage, result.conversation_message]);
      } else {
        setConversation(prev => [...prev, userMessage]);
      }

      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setResponse({ error: 'Failed to send message' });
    } finally {
      setLoading(false);
    }
  };

  const quickTests = [
    "Find me a good Italian restaurant nearby for dinner tonight",
    "I want something casual and not too expensive",
    "What about Chinese food instead?",
    "Book a table for 2 people at 7 PM"
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Chat API Test</h1>
        
        {/* Quick Test Buttons */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Quick Tests:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {quickTests.map((test, index) => (
              <button
                key={index}
                onClick={() => setMessage(test)}
                className="p-2 text-left bg-blue-100 hover:bg-blue-200 rounded-lg text-sm"
              >
                {test}
              </button>
            ))}
          </div>
        </div>

        {/* Message Input */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>

        {/* Conversation History */}
        {conversation.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Conversation:</h2>
            <div className="space-y-3">
              {conversation.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-lg ${
                    msg.role === 'user' 
                      ? 'bg-blue-100 ml-8' 
                      : 'bg-gray-100 mr-8'
                  }`}
                >
                  <div className="font-semibold text-sm text-gray-600 mb-1">
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <div>{msg.content}</div>
                  {msg.businesses && msg.businesses.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      Found {msg.businesses.length} restaurant(s)
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* API Response */}
        {response && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold mb-3">Latest API Response:</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        {/* Test Location Info */}
        <div className="mt-6 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-3">Test Configuration:</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Location:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1">
                {JSON.stringify(testLocation, null, 2)}
              </pre>
            </div>
            <div>
              <strong>Preferences:</strong>
              <pre className="bg-gray-100 p-2 rounded mt-1">
                {JSON.stringify(testPreferences, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}