'use client';

import { useState, useEffect } from 'react';
import { MapPinIcon, MagnifyingGlassIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { Location, LocationInputProps, EnhancedLocation } from '@/lib/types';
import { isValidCoordinates, resolveCoordinatesToDetails } from '@/lib/location-utils';
import { LOCATION_CONFIG, ERROR_MESSAGES } from '@/lib/constants';

export default function LocationInput({
  onLocationChange,
  currentLocation,
  isDetecting,
  error,
  onDetectLocation,
}: LocationInputProps) {
  const [manualInput, setManualInput] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<EnhancedLocation | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  // Auto-detect location on component mount if no current location
  useEffect(() => {
    console.log('LocationInput mounted:', { currentLocation, isDetecting, error });
    // Don't auto-detect on mount to avoid dependency issues
    // User can click the button to detect location
  }, []);

  const handleDetectLocation = async () => {
    console.log('handleDetectLocation called');
    
    if (!navigator.geolocation) {
      console.log('Geolocation not supported');
      onLocationChange({
        error: 'Geolocation is not supported by this browser.',
        location: null,
      });
      return;
    }

    console.log('Geolocation supported, starting detection...');
    // Call the parent's onDetectLocation to set isDetecting state
    onDetectLocation();

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        console.log('Calling navigator.geolocation.getCurrentPosition...');
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('Geolocation success:', pos);
            resolve(pos);
          },
          (err) => {
            console.log('Geolocation error:', err);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: LOCATION_CONFIG.GEOLOCATION_TIMEOUT,
            maximumAge: LOCATION_CONFIG.GEOLOCATION_MAX_AGE,
          }
        );
      });

      const { latitude, longitude } = position.coords;
      console.log('Got coordinates:', latitude, longitude);
      
      if (!isValidCoordinates(latitude, longitude)) {
        onLocationChange({
          error: ERROR_MESSAGES.INVALID_LOCATION,
          location: null,
        });
        return;
      }

      try {
        // Use enhanced geocoding to get detailed location information
        console.log('Attempting enhanced reverse geocode for:', latitude, longitude);
        setIsResolvingLocation(true);
        const enhancedLocation = await resolveCoordinatesToDetails(latitude, longitude);
        console.log('Enhanced reverse geocode success:', enhancedLocation);
        
        // Show confirmation UI for auto-detected location
        setPendingLocation(enhancedLocation);
        setIsResolvingLocation(false);
      } catch (err) {
        console.log('Enhanced reverse geocode failed, using basic coordinates:', err);
        setIsResolvingLocation(false);
        // Even if reverse geocoding fails, we still have coordinates
        onLocationChange({
          error: null,
          location: {
            latitude,
            longitude,
            address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            city: 'Unknown',
            state: 'Unknown',
            zipCode: 'Unknown',
            country: 'US',
          },
        });
      }
    } catch (error: any) {
      let errorMessage: string;
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = ERROR_MESSAGES.LOCATION_PERMISSION_DENIED;
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = ERROR_MESSAGES.LOCATION_UNAVAILABLE;
          break;
        case error.TIMEOUT:
          errorMessage = ERROR_MESSAGES.LOCATION_TIMEOUT;
          break;
        default:
          errorMessage = ERROR_MESSAGES.LOCATION_UNAVAILABLE;
          break;
      }

      onLocationChange({
        error: errorMessage,
        location: null,
      });
      setIsManualMode(true);
    }
  };

  const handleManualInput = async (input: string) => {
    setManualInput(input);
    
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    
    try {
      const locations = await geocodeAddress(input);
      setSuggestions(locations);
    } catch (err) {
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleConfirmLocation = () => {
    if (pendingLocation) {
      onLocationChange({
        error: null,
        location: pendingLocation,
      });
      setPendingLocation(null);
    }
  };

  const handleRejectLocation = () => {
    setPendingLocation(null);
    setIsManualMode(true);
  };

  const handleSelectSuggestion = (location: Location) => {
    setManualInput(location.address);
    setSuggestions([]);
    onLocationChange({
      error: null,
      location,
    });
    setIsManualMode(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualInput.trim()) {
      return;
    }

    setIsLoadingSuggestions(true);
    
    try {
      const locations = await geocodeAddress(manualInput);
      if (locations.length > 0) {
        handleSelectSuggestion(locations[0]);
      } else {
        onLocationChange({
          error: ERROR_MESSAGES.INVALID_LOCATION,
          location: null,
        });
      }
    } catch (err) {
      onLocationChange({
        error: ERROR_MESSAGES.INVALID_LOCATION,
        location: null,
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Your Location
        </h3>

        {/* Pending Location Confirmation */}
        {pendingLocation && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800 mb-1">
                    Is this your location?
                  </p>
                  <p className="text-sm text-blue-700 font-medium">
                    {pendingLocation.displayName}
                  </p>
                  <div className="text-xs text-blue-600 mt-1 space-y-0.5">
                    <p>City: {pendingLocation.city}</p>
                    <p>State: {pendingLocation.state}</p>
                    {pendingLocation.zipCode && pendingLocation.zipCode !== 'Unknown' && (
                      <p>Zip: {pendingLocation.zipCode}</p>
                    )}
                    <p>Confidence: {Math.round(pendingLocation.confidence * 100)}%</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={handleConfirmLocation}
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Yes, that&apos;s correct
              </button>
              <button
                onClick={handleRejectLocation}
                className="flex items-center px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                <XMarkIcon className="h-4 w-4 mr-1" />
                No, enter manually
              </button>
            </div>
          </div>
        )}

        {/* Current Location Display */}
        {currentLocation && !pendingLocation && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center">
              <MapPinIcon className="h-5 w-5 text-green-600 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">
                  Current Location
                </p>
                <p className="text-sm text-green-600 font-medium">
                  {currentLocation.address}
                </p>
                {/* Enhanced location details */}
                <div className="text-xs text-green-600 mt-1 space-y-0.5">
                  <p>City: {currentLocation.city}, State: {currentLocation.state}</p>
                  {currentLocation.zipCode && currentLocation.zipCode !== 'Unknown' && (
                    <p>Zip Code: {currentLocation.zipCode}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Auto-detect Button */}
        {!isManualMode && !pendingLocation && (
          <button
            onClick={handleDetectLocation}
            disabled={isDetecting || isResolvingLocation}
            className="w-full mb-4 flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDetecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Detecting Location...
              </>
            ) : isResolvingLocation ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Resolving Address...
              </>
            ) : (
              <>
                <MapPinIcon className="h-4 w-4 mr-2" />
                Detect My Location
              </>
            )}
          </button>
        )}

        {/* Manual Input Toggle */}
        {!pendingLocation && (
          <div className="text-center mb-4">
            <button
              onClick={() => setIsManualMode(!isManualMode)}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              {isManualMode ? 'Use automatic detection' : 'Enter location manually'}
            </button>
          </div>
        )}

        {/* Manual Input Form */}
        {isManualMode && (
          <form onSubmit={handleManualSubmit} className="relative">
            <div className="relative">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => handleManualInput(e.target.value)}
                placeholder="Enter city, address, or zip code"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              />
              <button
                type="submit"
                disabled={isLoadingSuggestions || !manualInput.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                {isLoadingSuggestions ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                ) : (
                  <MagnifyingGlassIcon className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:outline-none focus:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center">
                      <MapPinIcon className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {suggestion.address}
                        </p>
                        <p className="text-xs text-gray-500">
                          {suggestion.city}, {suggestion.state}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </form>
        )}

        {/* Location Info */}
        {currentLocation && !pendingLocation && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <p>Coordinates: {currentLocation.latitude.toFixed(4)}, {currentLocation.longitude.toFixed(4)}</p>
              <p>City: {currentLocation.city}, {currentLocation.state}</p>
              {currentLocation.zipCode && currentLocation.zipCode !== 'Unknown' && (
                <p>Zip Code: {currentLocation.zipCode}</p>
              )}
              {currentLocation.country && (
                <p>Country: {currentLocation.country}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Utility functions for geocoding
async function reverseGeocode(latitude: number, longitude: number): Promise<Location> {
  const response = await fetch(`/api/location/reverse?lat=${latitude}&lng=${longitude}`);
  
  if (!response.ok) {
    throw new Error('Failed to reverse geocode');
  }
  
  const data = await response.json();
  return data.location;
}

async function geocodeAddress(address: string): Promise<Location[]> {
  const response = await fetch(`/api/location/geocode?q=${encodeURIComponent(address)}`);
  
  if (!response.ok) {
    throw new Error('Failed to geocode address');
  }
  
  const data = await response.json();
  return data.locations || [];
}