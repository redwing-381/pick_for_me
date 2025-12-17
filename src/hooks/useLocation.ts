'use client';

import { useState, useCallback } from 'react';
import type { Location } from '@/lib/types';
import { LOCATION_CONFIG, ERROR_MESSAGES } from '@/lib/constants';

interface UseLocationReturn {
  location: Location | null;
  isDetecting: boolean;
  error: string | null;
  detectLocation: () => Promise<void>;
  setManualLocation: (location: Location) => void;
  clearLocation: () => void;
  clearError: () => void;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<Location | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: LOCATION_CONFIG.GEOLOCATION_TIMEOUT,
            maximumAge: LOCATION_CONFIG.GEOLOCATION_MAX_AGE,
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // Try to reverse geocode to get address
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'PickForMe/1.0 (contact@pickforme.app)',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to get address from coordinates');
        }

        const data = await response.json();
        const address = data.address || {};

        const detectedLocation: Location = {
          latitude,
          longitude,
          address: data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          city: address.city || address.town || address.village || address.municipality || 'Unknown',
          state: address.state || address.region || address.county || address.province || 'Unknown',
          zipCode: address.postcode,
          country: address.country_code?.toUpperCase() || 'Unknown',
        };

        setLocation(detectedLocation);
        setError(null);
      } catch (geocodeError) {
        console.error('Reverse geocoding failed, using coordinates only:', geocodeError);
        
        // If reverse geocoding fails, still use the coordinates
        const basicLocation: Location = {
          latitude,
          longitude,
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          city: 'Unknown',
          state: 'Unknown',
          zipCode: undefined,
          country: 'Unknown',
        };

        setLocation(basicLocation);
        setError(null);
      }
    } catch (err: any) {
      console.error('Location detection error:', err);
      
      if (err.code === 1) {
        setError(ERROR_MESSAGES.LOCATION_PERMISSION_DENIED);
      } else if (err.code === 2) {
        setError(ERROR_MESSAGES.LOCATION_UNAVAILABLE);
      } else if (err.code === 3) {
        setError(ERROR_MESSAGES.LOCATION_TIMEOUT);
      } else {
        setError(ERROR_MESSAGES.LOCATION_UNAVAILABLE);
      }
    } finally {
      setIsDetecting(false);
    }
  }, []);

  const setManualLocation = useCallback((newLocation: Location) => {
    setLocation(newLocation);
    setError(null);
  }, []);

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    location,
    isDetecting,
    error,
    detectLocation,
    setManualLocation,
    clearLocation,
    clearError,
  };
}
