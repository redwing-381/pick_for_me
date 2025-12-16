// Location utility functions for Pick For Me application

import type { Location, EnhancedLocation, LocationDetails, LocationCacheEntry } from './types';
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

export function isValidEnhancedLocation(location: unknown): location is EnhancedLocation {
  return (
    isValidLocation(location) &&
    typeof (location as EnhancedLocation).zipCode === 'string' &&
    typeof (location as EnhancedLocation).displayName === 'string' &&
    typeof (location as EnhancedLocation).confidence === 'number' &&
    (location as EnhancedLocation).confidence >= 0 &&
    (location as EnhancedLocation).confidence <= 1
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
// ENHANCED GEOCODING WITH CACHING
// =============================================================================

const LOCATION_CACHE_KEY = 'pick-for-me-location-cache';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function resolveCoordinatesToDetails(
  lat: number, 
  lng: number
): Promise<EnhancedLocation> {
  if (!isValidCoordinates(lat, lng)) {
    throw new Error('Invalid coordinates provided');
  }

  // Check cache first
  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  const cached = getLocationFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // In production, this would call a real geocoding service
    const locationDetails = await reverseGeocodeCoordinates(lat, lng);
    
    const enhancedLocation: EnhancedLocation = {
      ...locationDetails,
      zipCode: locationDetails.zipCode || 'Unknown',
      displayName: formatLocationDisplayName(locationDetails),
      confidence: calculateLocationConfidence(locationDetails),
      timezone: getTimezoneForCoordinates(lat, lng),
      localTime: getCurrentTimeForTimezone(getTimezoneForCoordinates(lat, lng)),
    };

    // Cache the result
    saveLocationToCache(cacheKey, enhancedLocation);
    
    return enhancedLocation;
  } catch (error) {
    console.error('Enhanced geocoding failed:', error);
    
    // Fallback to basic location data
    const fallbackLocation: EnhancedLocation = {
      latitude: lat,
      longitude: lng,
      address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city: 'Unknown',
      state: 'Unknown',
      zipCode: 'Unknown',
      country: 'US',
      displayName: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      confidence: 0.1,
    };
    
    return fallbackLocation;
  }
}

export async function geocodeAddressToDetails(address: string): Promise<EnhancedLocation[]> {
  if (!address.trim()) {
    throw new Error('Address cannot be empty');
  }

  // Check cache first
  const cacheKey = `addr:${address.toLowerCase().trim()}`;
  const cached = getLocationFromCache(cacheKey);
  if (cached) {
    return [cached];
  }

  try {
    // In production, this would call a real geocoding service
    const locations = await geocodeAddress(address);
    
    const enhancedLocations = locations.map(location => ({
      ...location,
      zipCode: location.zipCode || extractZipFromAddress(location.address),
      displayName: formatLocationDisplayName(location),
      confidence: calculateLocationConfidence(location),
      timezone: getTimezoneForCoordinates(location.latitude, location.longitude),
      localTime: getCurrentTimeForTimezone(getTimezoneForCoordinates(location.latitude, location.longitude)),
    }));

    // Cache the first result if available
    if (enhancedLocations.length > 0) {
      saveLocationToCache(cacheKey, enhancedLocations[0]);
    }
    
    return enhancedLocations;
  } catch (error) {
    console.error('Address geocoding failed:', error);
    throw new Error(`Failed to geocode address: ${address}`);
  }
}

// =============================================================================
// LOCATION CACHING SYSTEM
// =============================================================================

function getLocationFromCache(key: string): EnhancedLocation | null {
  try {
    if (typeof window === 'undefined') return null; // Server-side
    
    const cache = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!cache) return null;
    
    const cacheData = JSON.parse(cache);
    const entry: LocationCacheEntry = cacheData[key];
    
    if (!entry) return null;
    
    // Check if cache entry is expired
    if (Date.now() > entry.expiresAt) {
      // Remove expired entry
      delete cacheData[key];
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
      return null;
    }
    
    return entry.location;
  } catch (error) {
    console.warn('Failed to read location cache:', error);
    return null;
  }
}

function saveLocationToCache(key: string, location: EnhancedLocation): void {
  try {
    if (typeof window === 'undefined') return; // Server-side
    
    const cache = localStorage.getItem(LOCATION_CACHE_KEY);
    const cacheData = cache ? JSON.parse(cache) : {};
    
    const entry: LocationCacheEntry = {
      location,
      timestamp: Date.now(),
      expiresAt: Date.now() + CACHE_EXPIRY_MS,
    };
    
    cacheData[key] = entry;
    
    // Limit cache size (keep only 50 most recent entries)
    const entries = Object.entries(cacheData);
    if (entries.length > 50) {
      entries.sort((a, b) => (b[1] as LocationCacheEntry).timestamp - (a[1] as LocationCacheEntry).timestamp);
      const limitedCache = Object.fromEntries(entries.slice(0, 50));
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(limitedCache));
    } else {
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(cacheData));
    }
  } catch (error) {
    console.warn('Failed to save location to cache:', error);
  }
}

export function clearLocationCache(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCATION_CACHE_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear location cache:', error);
  }
}

// =============================================================================
// ENHANCED LOCATION UTILITIES
// =============================================================================

function formatLocationDisplayName(location: Location): string {
  const parts = [];
  
  if (location.city && location.city !== 'Unknown') {
    parts.push(location.city);
  }
  
  if (location.state && location.state !== 'Unknown') {
    parts.push(location.state);
  }
  
  if (location.zipCode && location.zipCode !== 'Unknown') {
    parts.push(location.zipCode);
  }
  
  return parts.length > 0 ? parts.join(', ') : location.address;
}

function calculateLocationConfidence(location: Location): number {
  let confidence = 0.5; // Base confidence
  
  // Increase confidence based on available data
  if (location.city && location.city !== 'Unknown') confidence += 0.2;
  if (location.state && location.state !== 'Unknown') confidence += 0.2;
  if (location.zipCode && location.zipCode !== 'Unknown') confidence += 0.1;
  if (location.country && location.country !== 'Unknown') confidence += 0.1;
  
  return Math.min(confidence, 1.0);
}

function extractZipFromAddress(address: string): string {
  // Try to extract zip code from address string
  const zipMatch = address.match(/\b(\d{5}(?:-\d{4})?)\b/); // US zip
  if (zipMatch) return zipMatch[1];
  
  const postalMatch = address.match(/\b([A-Z]\d[A-Z] ?\d[A-Z]\d)\b/i); // Canadian postal
  if (postalMatch) return postalMatch[1];
  
  return 'Unknown';
}

function getTimezoneForCoordinates(lat: number, lng: number): string {
  // Simplified timezone detection based on longitude
  // In production, use a proper timezone API
  const timezoneOffset = Math.round(lng / 15);
  return `UTC${timezoneOffset >= 0 ? '+' : ''}${timezoneOffset}`;
}

function getCurrentTimeForTimezone(timezone: string): string {
  try {
    return new Date().toLocaleString('en-US', { 
      timeZone: timezone.replace('UTC', 'Etc/GMT'),
      hour12: true 
    });
  } catch {
    return new Date().toLocaleString();
  }
}

// =============================================================================
// MOCK GEOCODING FUNCTIONS (Production would use real APIs)
// =============================================================================

async function reverseGeocodeCoordinates(lat: number, lng: number): Promise<Location> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Mock implementation with enhanced city/state/zip detection
  let city = 'Unknown';
  let state = 'Unknown';
  let zipCode = 'Unknown';
  let country = 'US';
  let address = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

  // Enhanced mock data with zip codes
  const mockRegions = [
    { bounds: { latMin: 37.7, latMax: 37.8, lngMin: -122.5, lngMax: -122.4 }, 
      city: 'San Francisco', state: 'CA', zipCode: '94102', country: 'US' },
    { bounds: { latMin: 40.7, latMax: 40.8, lngMin: -74.1, lngMax: -73.9 }, 
      city: 'New York', state: 'NY', zipCode: '10001', country: 'US' },
    { bounds: { latMin: 34.0, latMax: 34.1, lngMin: -118.3, lngMax: -118.2 }, 
      city: 'Los Angeles', state: 'CA', zipCode: '90210', country: 'US' },
    { bounds: { latMin: 41.8, latMax: 41.9, lngMin: -87.7, lngMax: -87.6 }, 
      city: 'Chicago', state: 'IL', zipCode: '60601', country: 'US' },
    { bounds: { latMin: 29.7, latMax: 29.8, lngMin: -95.4, lngMax: -95.3 }, 
      city: 'Houston', state: 'TX', zipCode: '77002', country: 'US' },
    { bounds: { latMin: 43.6, latMax: 43.7, lngMin: -79.4, lngMax: -79.3 }, 
      city: 'Toronto', state: 'ON', zipCode: 'M5H 2N2', country: 'CA' },
  ];

  for (const region of mockRegions) {
    const { bounds } = region;
    if (lat >= bounds.latMin && lat <= bounds.latMax && 
        lng >= bounds.lngMin && lng <= bounds.lngMax) {
      city = region.city;
      state = region.state;
      zipCode = region.zipCode;
      country = region.country;
      address = `${city}, ${state} ${zipCode}, ${country === 'US' ? 'USA' : 'Canada'}`;
      break;
    }
  }

  return {
    latitude: lat,
    longitude: lng,
    address,
    city,
    state,
    zipCode,
    country,
  };
}

async function geocodeAddress(address: string): Promise<Location[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const locations: Location[] = [];
  const queryLower = address.toLowerCase();

  // Enhanced mock locations with zip codes
  const mockLocations: Location[] = [
    {
      latitude: 37.7749, longitude: -122.4194,
      address: 'San Francisco, CA 94102, USA',
      city: 'San Francisco', state: 'CA', zipCode: '94102', country: 'US',
    },
    {
      latitude: 40.7128, longitude: -74.0060,
      address: 'New York, NY 10001, USA',
      city: 'New York', state: 'NY', zipCode: '10001', country: 'US',
    },
    {
      latitude: 34.0522, longitude: -118.2437,
      address: 'Los Angeles, CA 90210, USA',
      city: 'Los Angeles', state: 'CA', zipCode: '90210', country: 'US',
    },
    {
      latitude: 41.8781, longitude: -87.6298,
      address: 'Chicago, IL 60601, USA',
      city: 'Chicago', state: 'IL', zipCode: '60601', country: 'US',
    },
    {
      latitude: 43.6532, longitude: -79.3832,
      address: 'Toronto, ON M5H 2N2, Canada',
      city: 'Toronto', state: 'ON', zipCode: 'M5H 2N2', country: 'CA',
    },
  ];

  // Search through mock locations
  for (const location of mockLocations) {
    const addressLower = location.address.toLowerCase();
    const cityLower = location.city.toLowerCase();
    
    if (addressLower.includes(queryLower) || 
        cityLower.includes(queryLower) || 
        queryLower.includes(cityLower) ||
        (location.zipCode && location.zipCode.toLowerCase().includes(queryLower))) {
      locations.push(location);
    }
  }

  return locations.slice(0, 5); // Limit to 5 results
}

// =============================================================================
// LOCATION STORAGE (Updated)
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