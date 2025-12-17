'use client';

import { useState } from 'react';
import type { Location } from '@/lib/types';

interface SimpleLocationInputProps {
  onLocationSet: (location: Location) => void;
  currentLocation: Location | null;
}

export default function SimpleLocationInput({
  onLocationSet,
  currentLocation,
}: SimpleLocationInputProps) {
  const [cityInput, setCityInput] = useState(currentLocation?.city || '');
  const [isEditing, setIsEditing] = useState(!currentLocation);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cityInput.trim()) {
      return;
    }

    // Create a simple location object with just the city name
    const location: Location = {
      latitude: 0, // Will be handled by Yelp API
      longitude: 0,
      address: cityInput.trim(),
      city: cityInput.trim(),
      state: '',
      country: '',
    };

    onLocationSet(location);
    setIsEditing(false);
  };

  if (!isEditing && currentLocation) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-teal-400 border-2 border-black flex items-center justify-center">
            <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-black text-black">LOCATION</p>
            <p className="text-xs font-bold text-gray-700">{currentLocation.city}</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-white text-black text-sm font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
        >
          CHANGE
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-black text-black mb-2">
          ENTER YOUR CITY
        </label>
        <input
          type="text"
          value={cityInput}
          onChange={(e) => setCityInput(e.target.value)}
          placeholder="e.g., New York, London, Tokyo"
          className="w-full px-4 py-3 border-4 border-black font-bold text-black placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-yellow-400"
          autoFocus
        />
        <p className="text-xs font-bold text-gray-600 mt-2">
          Just type your city name - we'll use it for all recommendations
        </p>
      </div>
      
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!cityInput.trim()}
          className="flex-1 px-6 py-3 bg-teal-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all"
        >
          SET LOCATION
        </button>
        {currentLocation && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-6 py-3 bg-white text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            CANCEL
          </button>
        )}
      </div>
    </form>
  );
}
