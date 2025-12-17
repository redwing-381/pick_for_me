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
            <span className="text-black text-sm">📍</span>
          </div>
          <div>
            <p className="text-sm font-black text-black">Location</p>
            <p className="text-xs font-bold text-gray-700">{currentLocation.city}</p>
          </div>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-1 bg-white text-black text-sm font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-black text-black mb-2">
          Enter Your City
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
          💡 Just type your city name - we'll use it for all recommendations
        </p>
      </div>
      
      <div className="flex space-x-2">
        <button
          type="submit"
          disabled={!cityInput.trim()}
          className="flex-1 px-6 py-3 bg-teal-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all"
        >
          Set Location
        </button>
        {currentLocation && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-6 py-3 bg-white text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
