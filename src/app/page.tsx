'use client';

import { useState } from 'react';
import { ConversationProvider } from '@/contexts/ConversationContext';
import ChatInterface from '@/components/ChatInterface';
import LocationInput from '@/components/LocationInput';
import type { Location, UserPreferences, Business } from '@/lib/types';

export default function Home() {
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Pick For Me</h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Preferences
                </button>
                
                {location ? (
                  <div className="text-sm text-gray-600">
                    📍 {location.city || 'Location set'}
                  </div>
                ) : (
                  <button
                    onClick={handleDetectLocation}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📍 Set Location
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Chat Interface */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <ChatInterface
                  location={location}
                  userPreferences={userPreferences}
                  onBusinessSelected={handleBusinessSelected}
                  className="h-[600px]"
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Location Input */}
              {!location && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Set Your Location</h3>
                  <LocationInput
                    onLocationChange={handleLocationChange}
                    currentLocation={location}
                    isDetecting={false}
                    onDetectLocation={handleDetectLocation}
                  />
                </div>
              )}

              {/* Preferences Panel */}
              {showPreferences && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Preferences</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price Range
                      </label>
                      <select
                        value={userPreferences.priceRange}
                        onChange={(e) => setUserPreferences(prev => ({
                          ...prev,
                          priceRange: e.target.value as any
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="$">$ - Budget friendly</option>
                        <option value="$$">$$ - Moderate</option>
                        <option value="$$$">$$$ - Expensive</option>
                        <option value="$$$$">$$$$ - Very expensive</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Atmosphere
                      </label>
                      <select
                        value={userPreferences.atmosphere}
                        onChange={(e) => setUserPreferences(prev => ({
                          ...prev,
                          atmosphere: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              )}

              {/* Selected Business */}
              {selectedBusiness && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Pick</h3>
                  
                  <div className="space-y-4">
                    {selectedBusiness.image_url && (
                      <img
                        src={selectedBusiness.image_url}
                        alt={selectedBusiness.name}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    )}
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">{selectedBusiness.name}</h4>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="flex items-center">
                          <span className="text-yellow-400 text-lg">★</span>
                          <span className="text-sm text-gray-600 ml-1">
                            {selectedBusiness.rating} ({selectedBusiness.review_count} reviews)
                          </span>
                        </div>
                        <span className="text-sm font-medium text-green-600">{selectedBusiness.price}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        {selectedBusiness.categories.map(c => c.title).join(', ')}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedBusiness.location.display_address.join(', ')}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                        Make Reservation
                      </button>
                      <button className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors">
                        Get Directions
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Suggestions */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Try These</h3>
                
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    "Find me a good Italian restaurant nearby"
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    "I want something budget-friendly for lunch"
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    "Pick a fancy place for a special occasion"
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ConversationProvider>
  );
}