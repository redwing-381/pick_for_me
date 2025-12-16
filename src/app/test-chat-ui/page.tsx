'use client';

import { useState } from 'react';
import { ConversationProvider } from '@/contexts/ConversationContext';
import ChatInterface from '@/components/ChatInterface';
import LocationInput from '@/components/LocationInput';
import type { Location, UserPreferences, Business } from '@/lib/types';

export default function TestChatUIPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    cuisineTypes: [],
    priceRange: '$$',
    dietaryRestrictions: [],
    atmosphere: 'casual',
    partySize: 2
  });

  const handleLocationChange = (result: { location: Location | null; error: string | null }) => {
    if (result.location) {
      setLocation(result.location);
    }
  };

  const handleBusinessSelected = (business: Business) => {
    setSelectedBusiness(business);
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            address: `${position.coords.latitude}, ${position.coords.longitude}`,
            city: 'Unknown',
            state: 'Unknown'
          });
        },
        (error) => {
          console.error('Location detection failed:', error);
        }
      );
    }
  };

  return (
    <ConversationProvider>
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Pick For Me - Chat Interface Test
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chat Interface */}
            <div className="lg:col-span-2">
              <ChatInterface
                location={location}
                userPreferences={userPreferences}
                onBusinessSelected={handleBusinessSelected}
                className="h-[600px]"
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Location Input */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-semibold mb-4">Location</h3>
                <LocationInput
                  onLocationChange={handleLocationChange}
                  currentLocation={location}
                  isDetecting={false}
                  onDetectLocation={handleDetectLocation}
                />
                {location && (
                  <div className="mt-3 p-2 bg-green-50 rounded text-sm">
                    <strong>Current:</strong> {location.address}
                  </div>
                )}
              </div>

              {/* User Preferences */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-semibold mb-4">Preferences</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price Range
                    </label>
                    <select
                      value={userPreferences.priceRange}
                      onChange={(e) => setUserPreferences(prev => ({
                        ...prev,
                        priceRange: e.target.value as any
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="$">$ - Budget</option>
                      <option value="$$">$$ - Moderate</option>
                      <option value="$$$">$$$ - Expensive</option>
                      <option value="$$$$">$$$$ - Very Expensive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Party Size
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={userPreferences.partySize}
                      onChange={(e) => setUserPreferences(prev => ({
                        ...prev,
                        partySize: parseInt(e.target.value) || 1
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Atmosphere
                    </label>
                    <select
                      value={userPreferences.atmosphere}
                      onChange={(e) => setUserPreferences(prev => ({
                        ...prev,
                        atmosphere: e.target.value
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="casual">Casual</option>
                      <option value="upscale">Upscale</option>
                      <option value="romantic">Romantic</option>
                      <option value="family">Family-friendly</option>
                      <option value="business">Business</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Selected Business */}
              {selectedBusiness && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="text-lg font-semibold mb-4">Selected Restaurant</h3>
                  
                  <div className="space-y-3">
                    {selectedBusiness.image_url && (
                      <img
                        src={selectedBusiness.image_url}
                        alt={selectedBusiness.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    )}
                    
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedBusiness.name}</h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600">
                          {selectedBusiness.rating} ({selectedBusiness.review_count} reviews)
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedBusiness.categories.map(c => c.title).join(', ')}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedBusiness.location.display_address.join(', ')}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                        Reserve
                      </button>
                      <button className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300">
                        Directions
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // This would trigger a message in the chat
                      const event = new CustomEvent('quickMessage', { 
                        detail: 'Find me a good Italian restaurant nearby' 
                      });
                      window.dispatchEvent(event);
                    }}
                    className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    🍝 Italian food nearby
                  </button>
                  
                  <button
                    onClick={() => {
                      const event = new CustomEvent('quickMessage', { 
                        detail: 'I want something budget-friendly' 
                      });
                      window.dispatchEvent(event);
                    }}
                    className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    💰 Budget-friendly options
                  </button>
                  
                  <button
                    onClick={() => {
                      const event = new CustomEvent('quickMessage', { 
                        detail: 'Find me a fancy restaurant for a special occasion' 
                      });
                      window.dispatchEvent(event);
                    }}
                    className="w-full px-3 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ✨ Special occasion dining
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ConversationProvider>
  );
}