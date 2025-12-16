// Location utility functions for Pick For Me application

import type { Location } from './types';
import { LOCATION_CONFIG, DEFAULT_LOCATIONS, REGEX_PATTERNS } from './constants';

// =============================================================================
// COORDINATE VALIDATION
// =============================================================================

export function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !isNaN(lat) &&
    !isNaN(lng)
  );
}

export function isValidLocation(location: unknown): location is Location {
  return (
    typeof location === 'object' &&
    location !== null &&
    typeof (location as Location).latitude === 'number' &&
    typeof (location as Location).longitude === 'number' &&
    typeof (location as Location).address === 'string' &&
    typeof (location as Location).city === 'string' &&
    typeof (location as Location).state === 'string' &&
    isValidCoordinates((location as Location).latitude, (location as Location).longitude)
  );
}

// =============================================================================
// LOCATION INPUT VALIDATION
// =============================================================================

export function validateLocationInput(input: string): {
  isValid: boolean;
  type: 'coordinates' | 'address' | 'zipcode' | 'city' | 'invalid';
  error?: string;
} {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return { isValid: false, type: 'invalid', error: 'Location cannot be empty' };
  }

  // Check if it's coordinates (lat, lng)
  const coordMatch = trimmed.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    
    if (isValidCoordinates(lat, lng)) {
      return { isValid: true, type: 'coordinates' };
    } else {
      return { isValid: false, type: 'invalid', error: 'Invalid coordinates' };
    }
  }

  // Check if it's a US zip code
  if (REGEX_PATTERNS.POSTAL_CODE_US.test(trimmed)) {
    return { isValid: true, type: 'zipcode' };
  }

  // Check if it's a Canadian postal code
  if (REGEX_PATTERNS.POSTAL_CODE_CA.test(trimmed)) {
    return { isValid: true, type: 'zipcode' };
  }

  // Check if it looks like an address (contains numbers and letters)
  if (/\d/.test(trimmed) && /[a-zA-Z]/.test(trimmed)) {
    return { isValid: true, type: 'address' };
  }

  // Assume it's a city name if it's mostly letters
  if (/^[a-zA-Z\s,.-]+$/.test(trimmed) && trimmed.length >= 2) {
    return { isValid: true, type: 'city' };
  }

  return { isValid: false, type: 'invalid', error: 'Invalid location format' };
}

// =============================================================================
// DISTANCE CALCULATIONS
// =============================================================================

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
    Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

export function calculateDistanceToLocation(
  from: Location,
  to: Location
): number {
  return calculateDistance(
    from.latitude,
    from.longitude,
    to.latitude,
    to.longitude
  );
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// =============================================================================
// LOCATION FORMATTING
// =============================================================================

export function formatLocation(location: Location): string {
  if (location.address && location.address !== `${location.latitude}, ${location.longitude}`) {
    return location.address;
  }
  
  return `${location.city}, ${location.state}`;
}

export function formatCoordinates(lat: number, lng: number, precision: number = 4): string {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)}km`;
  } else {
    return `${Math.round(distanceKm)}km`;
  }
}

// =============================================================================
// LOCATION BOUNDS AND REGIONS
// =============================================================================

export function isLocationInSupportedRegion(location: Location): boolean {
  // Check if location is in supported countries (US, Canada)
  if (location.country) {
    return LOCATION_CONFIG.SUPPORTED_COUNTRIES.includes(location.country as 'US' | 'CA');
  }
  
  // Fallback: check by coordinates (rough bounds for US and Canada)
  const { latitude, longitude } = location;
  
  // US bounds (approximate)
  const isInUS = (
    latitude >= 24.396308 && latitude <= 49.384358 &&
    longitude >= -125.0 && longitude <= -66.93457
  );
  
  // Canada bounds (approximate)
  const isInCanada = (
    latitude >= 41.6751 && latitude <= 83.23324 &&
    longitude >= -141.0 && longitude <= -52.6480987209
  );
  
  return isInUS || isInCanada;
}

export function getLocationBounds(
  centerLat: number,
  centerLng: number,
  radiusKm: number = LOCATION_CONFIG.DEFAULT_RADIUS / 1000
): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  const latDelta = radiusKm / 111; // Approximate km per degree latitude
  const lngDelta = radiusKm / (111 * Math.cos(toRadians(centerLat))); // Adjust for longitude
  
  return {
    north: centerLat + latDelta,
    south: centerLat - latDelta,
    east: centerLng + lngDelta,
    west: centerLng - lngDelta,
  };
}

// =============================================================================
// DEFAULT LOCATIONS
// =============================================================================

export function getDefaultLocationForRegion(region: 'US' | 'CA' = 'US'): Location {
  return DEFAULT_LOCATIONS[region];
}

export function detectRegionFromLocation(location: Location): 'US' | 'CA' | 'UNKNOWN' {
  if (location.country === 'US' || location.country === 'USA') return 'US';
  if (location.country === 'CA' || location.country === 'CAN') return 'CA';
  
  // Fallback: detect by coordinates
  const { latitude, longitude } = location;
  
  // US bounds (approximate)
  if (
    latitude >= 24.396308 && latitude <= 49.384358 &&
    longitude >= -125.0 && longitude <= -66.93457
  ) {
    return 'US';
  }
  
  // Canada bounds (approximate)
  if (
    latitude >= 41.6751 && latitude <= 83.23324 &&
    longitude >= -141.0 && longitude <= -52.6480987209
  ) {
    return 'CA';
  }
  
  return 'UNKNOWN';
}

// =============================================================================
// GEOLOCATION UTILITIES
// =============================================================================

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }

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
}

export function watchPosition(
  onSuccess: (position: GeolocationPosition) => void,
  onError: (error: GeolocationPositionError) => void
): number | null {
  if (!navigator.geolocation) {
    onError({
      code: 2,
      message: 'Geolocation is not supported',
    } as GeolocationPositionError);
    return null;
  }

  return navigator.geolocation.watchPosition(
    onSuccess,
    onError,
    {
      enableHighAccuracy: true,
      timeout: LOCATION_CONFIG.GEOLOCATION_TIMEOUT,
      maximumAge: LOCATION_CONFIG.GEOLOCATION_MAX_AGE,
    }
  );
}

// =============================================================================
// LOCATION STORAGE
// =============================================================================

export function saveLocationToStorage(location: Location): void {
  try {
    localStorage.setItem('pick-for-me-location', JSON.stringify(location));
  } catch (error) {
    console.warn('Failed to save location to storage:', error);
  }
}

export function loadLocationFromStorage(): Location | null {
  try {
    const stored = localStorage.getItem('pick-for-me-location');
    if (stored) {
      const location = JSON.parse(stored);
      return isValidLocation(location) ? location : null;
    }
  } catch (error) {
    console.warn('Failed to load location from storage:', error);
  }
  return null;
}

export function clearLocationFromStorage(): void {
  try {
    localStorage.removeItem('pick-for-me-location');
  } catch (error) {
    console.warn('Failed to clear location from storage:', error);
  }
}