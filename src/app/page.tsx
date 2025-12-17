'use client';

import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { ConversationProvider } from '@/contexts/ConversationContext';
import ChatInterface from '@/components/ChatInterface';
import LocationInput from '@/components/LocationInput';
import RestaurantCard from '@/components/RestaurantCard';
import TravelRecommendationCard from '@/components/TravelRecommendationCard';
import ItineraryDisplay, { ItinerarySummary } from '@/components/ItineraryDisplay';
import BookingModal from '@/components/BookingModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingOverlay } from '@/components/LoadingStates';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useDebounce, useLocalStorageCache, usePerformanceMonitor } from '@/lib/performance-utils';
import { transitions, microInteractions } from '@/lib/animations';
import { getMockTravelData } from '@/lib/travel-mock-data';
import { bookingSimulator } from '@/lib/booking-simulation';
import type { Location, UserPreferences, Business, BookingInfo, TravelItinerary } from '@/lib/types';

// Memoized components for performance
const MemoizedChatInterface = memo(ChatInterface);
const MemoizedLocationInput = memo(LocationInput);

export default function Home() {
  // Performance monitoring
  usePerformanceMonitor('HomePage');
  
  // State management with local storage cache for preferences
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingCategory, setBookingCategory] = useState<'dining' | 'accommodation' | 'attraction' | 'transportation' | 'entertainment'>('dining');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [completedBookings, setCompletedBookings] = useState<BookingInfo[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [currentItinerary, setCurrentItinerary] = useState<TravelItinerary | null>(null);
  const [travelMode, setTravelMode] = useState<'chat' | 'itinerary'>('chat');
  
  const { handleError, clearError } = useErrorHandler({ component: 'HomePage' });
  
  // Cached user preferences with localStorage
  const [userPreferences, setUserPreferences] = useLocalStorageCache<UserPreferences>(
    'pick-for-me-preferences',
    {
      cuisineTypes: [],
      priceRange: '$',
      dietaryRestrictions: [],
      atmosphere: 'casual',
      partySize: 2
    },
    24 * 60 * 60 * 1000 // 24 hours cache
  );


  // Debounced location change handler for performance
  const debouncedLocationChange = useDebounce((result: { location: Location | null; error: string | null }) => {
    if (result.error) {
      handleError(new Error(result.error), 'location-detection');
    } else if (result.location) {
      setLocation(result.location);
      clearError();
    }
  }, 300);

  const handleLocationChange = useCallback(debouncedLocationChange, [debouncedLocationChange, handleError, clearError]);

  // Enhanced business selection with RestaurantCard integration
  const handleBusinessSelected = useCallback((business: Business) => {
    setSelectedBusiness(business);
  }, []);

  // Booking completion handler (defined early to avoid hoisting issues)
  const handleBookingComplete = useCallback((booking: BookingInfo) => {
    setCompletedBookings(prev => [...prev, booking]);
    setIsBookingModalOpen(false);
    // Show success notification
    clearError();
  }, [clearError]);

  // Enhanced travel query handler with integrated mock data
  const handleTravelQuery = useCallback(async (query: string, category: string) => {
    try {
      // Use enhanced mock data system for travel queries
      const travelData = getMockTravelData(
        category as 'hotels' | 'attractions' | 'transportation' | 'dining',
        location || undefined,
        { query } // Pass query for filtering
      );
      
      return travelData;
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Travel query failed'), 'travel-query');
      return [];
    }
  }, [location, handleError]);

  // Enhanced booking handler with simulation
  const handleEnhancedBooking = useCallback(async (business: Business, bookingDetails: any) => {
    try {
      const bookingRequest = {
        businessId: business.id,
        category: bookingCategory,
        bookingDetails,
        userContact: {
          name: 'User', // This would come from user profile
          email: 'user@example.com',
          phone: '+1-555-0123'
        }
      };

      const result = await bookingSimulator.simulateSingleBooking(bookingRequest);
      
      if (result.success && result.data.success) {
        // Handle successful booking
        const bookingInfo: BookingInfo = {
          confirmationId: result.data.confirmationId!,
          restaurantName: business.name,
          restaurantId: business.id,
          date: bookingDetails.date || new Date().toISOString().split('T')[0],
          time: bookingDetails.time || '7:00 PM',
          partySize: bookingDetails.partySize || userPreferences.partySize,
          status: 'confirmed',
          userContact: {
            name: 'User',
            email: 'user@example.com',
            phone: '+1-555-0123'
          },
          specialRequests: bookingDetails.specialRequests || ''
        };
        
        handleBookingComplete(bookingInfo);
        return result.data;
      } else {
        // Handle booking failure
        const errorMessage = result.success ? result.data.error?.message : result.error?.message;
        throw new Error(errorMessage || 'Booking failed');
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Booking failed'), 'booking');
      throw error;
    }
  }, [bookingCategory, userPreferences.partySize, handleBookingComplete, handleError]);

  // Itinerary generation handler
  const handleGenerateItinerary = useCallback(async (destination: string, days: number, preferences: any) => {
    try {
      // This would integrate with the itinerary planner
      const response = await fetch('/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: location || { city: destination },
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
          groupSize: userPreferences.partySize,
          preferences: {
            ...userPreferences,
            ...preferences
          }
        })
      });

      if (response.ok) {
        const itinerary = await response.json();
        setCurrentItinerary(itinerary);
        setTravelMode('itinerary');
        return itinerary;
      } else {
        throw new Error('Failed to generate itinerary');
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Itinerary generation failed'), 'itinerary');
      return null;
    }
  }, [location, userPreferences, handleError, setCurrentItinerary]);

  // Enhanced location detection with loading states and error handling
  const handleDetectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      handleError(new Error('Geolocation is not supported by this browser'), 'geolocation-support');
      return;
    }

    setIsDetectingLocation(true);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        });
      });

      const newLocation: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
        city: 'Current Location',
        state: 'Unknown'
      };

      setLocation(newLocation);
      clearError();
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error('Failed to detect location'),
        'geolocation'
      );
    } finally {
      setIsDetectingLocation(false);
    }
  }, [handleError, clearError]);

  // Booking modal handlers
  const handleBookingRequest = useCallback((business: Business, category: 'dining' | 'accommodation' | 'attraction' | 'transportation' | 'entertainment' = 'dining') => {
    setSelectedBusiness(business);
    setBookingCategory(category);
    setIsBookingModalOpen(true);
  }, []);

  const handleBookingClose = useCallback(() => {
    setIsBookingModalOpen(false);
  }, []);

  // Mobile menu toggle
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isBookingModalOpen) {
          setIsBookingModalOpen(false);
        } else if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isBookingModalOpen, isMobileMenuOpen]);

  // Auto-hide mobile menu on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Page loading effect
  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Memoized values for performance
  const memoizedChatProps = useMemo(() => ({
    location,
    userPreferences,
    onBusinessSelected: handleBusinessSelected,
    className: "h-[500px] sm:h-[600px] lg:h-[700px]"
  }), [location, userPreferences, handleBusinessSelected]);

  const memoizedLocationProps = useMemo(() => ({
    onLocationChange: handleLocationChange,
    currentLocation: location,
    isDetecting: isDetectingLocation,
    onDetectLocation: handleDetectLocation
  }), [handleLocationChange, location, isDetectingLocation, handleDetectLocation]);

  const memoizedBookingProps = useMemo(() => ({
    isOpen: isBookingModalOpen,
    onClose: handleBookingClose,
    business: selectedBusiness!,
    onBookingComplete: handleBookingComplete,
    initialPartySize: userPreferences.partySize,
    category: bookingCategory
  }), [isBookingModalOpen, handleBookingClose, selectedBusiness, handleBookingComplete, userPreferences.partySize, bookingCategory]);

  return (
    <ErrorBoundary component="HomePage">
      <ConversationProvider>
        <LoadingOverlay isVisible={isPageLoading} message="Loading Pick For Me...">
          <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 ${transitions.normal}`}>
            {/* Header */}
            <header className={`bg-white shadow-sm border-b sticky top-0 z-40 ${transitions.shadow}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                {/* Logo and Title */}
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">P</span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">Travel Assistant</h1>
                </div>
                
                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center space-x-4">
                  <button
                    onClick={() => setShowPreferences(!showPreferences)}
                    className={`px-4 py-2 text-sm rounded-lg ${transitions.colors} ${microInteractions.buttonHover} ${
                      showPreferences 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    Preferences
                  </button>
                  
                  {location ? (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="text-sm font-medium">
                        {location.city !== 'Unknown' ? location.city : 'Location Set'}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className={`flex items-center space-x-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${transitions.colors} ${microInteractions.buttonPress} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isDetectingLocation ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Detecting...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span>Set Location</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Booking History */}
                  {completedBookings.length > 0 && (
                    <div className="flex items-center space-x-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-sm font-medium">{completedBookings.length} Booking{completedBookings.length !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={toggleMobileMenu}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  aria-label="Toggle mobile menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>

              {/* Mobile Menu */}
              {isMobileMenuOpen && (
                <div className="lg:hidden border-t bg-white py-4 space-y-4">
                  <button
                    onClick={() => {
                      setShowPreferences(!showPreferences);
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    <span>Preferences</span>
                  </button>
                  
                  {!location && (
                    <button
                      onClick={() => {
                        handleDetectLocation();
                        setIsMobileMenuOpen(false);
                      }}
                      disabled={isDetectingLocation}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span>{isDetectingLocation ? 'Detecting Location...' : 'Set Location'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-3 order-2 lg:order-1">
                {travelMode === 'chat' ? (
                  <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${transitions.shadow} ${microInteractions.cardHover}`}>
                    <MemoizedChatInterface {...memoizedChatProps} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {currentItinerary ? (
                      <>
                        <ItinerarySummary itinerary={currentItinerary} />
                        <ItineraryDisplay 
                          itinerary={currentItinerary}
                          onActivitySelect={(activity) => {
                            setSelectedBusiness(activity.activity);
                          }}
                          onModifyDay={(dayIndex) => {
                            // Handle day modification
                            console.log('Modify day:', dayIndex);
                          }}
                        />
                      </>
                    ) : (
                      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Itinerary Yet</h3>
                        <p className="text-gray-600 mb-6">
                          Switch to Chat Mode and ask me to plan a multi-day trip to get started!
                        </p>
                        <button
                          onClick={() => setTravelMode('chat')}
                          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Start Planning
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar - Secondary Content */}
              <div className="space-y-6 order-1 lg:order-2">
                {/* Location Input - Show when no location is set */}
                {!location && (
                  <div className={`bg-white rounded-xl shadow-lg p-6 ${transitions.normal} ${microInteractions.cardHover}`}>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                      <svg className={`w-5 h-5 mr-2 text-blue-600 ${microInteractions.iconHover}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      Set Your Location
                    </h3>
                    <MemoizedLocationInput {...memoizedLocationProps} />
                  </div>
                )}

                {/* Preferences Panel */}
                {showPreferences && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      Your Preferences
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price Range
                        </label>
                        <select
                          value={userPreferences.priceRange}
                          onChange={(e) => setUserPreferences({
                            ...userPreferences,
                            priceRange: e.target.value as '$' | '$$' | '$$$' | '$$$$'
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
                          onChange={(e) => setUserPreferences({
                            ...userPreferences,
                            partySize: parseInt(e.target.value) || 1
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Atmosphere
                        </label>
                        <select
                          value={userPreferences.atmosphere}
                          onChange={(e) => setUserPreferences({
                            ...userPreferences,
                            atmosphere: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        >
                          <option value="casual">Casual</option>
                          <option value="upscale">Upscale</option>
                          <option value="romantic">Romantic</option>
                          <option value="family">Family-friendly</option>
                          <option value="business">Business</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cuisine Types
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['Italian', 'Mexican', 'Asian', 'American', 'Mediterranean', 'Indian'].map((cuisine) => (
                            <button
                              key={cuisine}
                              onClick={() => {
                                setUserPreferences({
                                  ...userPreferences,
                                  cuisineTypes: userPreferences.cuisineTypes.includes(cuisine)
                                    ? userPreferences.cuisineTypes.filter((c: string) => c !== cuisine)
                                    : [...userPreferences.cuisineTypes, cuisine]
                                });
                              }}
                              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                                userPreferences.cuisineTypes.includes(cuisine)
                                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {cuisine}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected Business - Enhanced with Travel Cards */}
                {selectedBusiness && (
                  <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${transitions.normal} ${microInteractions.cardHover}`}>
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <svg className={`w-5 h-5 mr-2 text-green-600 ${microInteractions.iconHover}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Your Selection
                      </h3>
                    </div>
                    <div className="p-0">
                      {/* Determine category based on business categories */}
                      {(() => {
                        const categories = (selectedBusiness.categories || []).map(c => c.alias.toLowerCase());
                        let category: 'dining' | 'accommodation' | 'attraction' | 'transportation' | 'entertainment' = 'dining';
                        
                        if (categories.some(c => c.includes('hotel') || c.includes('accommodation'))) {
                          category = 'accommodation';
                        } else if (categories.some(c => c.includes('museum') || c.includes('attraction') || c.includes('park'))) {
                          category = 'attraction';
                        } else if (categories.some(c => c.includes('airport') || c.includes('transport') || c.includes('station'))) {
                          category = 'transportation';
                        } else if (categories.some(c => c.includes('theater') || c.includes('entertainment') || c.includes('music'))) {
                          category = 'entertainment';
                        }

                        return (
                          <TravelRecommendationCard
                            business={selectedBusiness}
                            category={category}
                            variant="compact"
                            onBook={(business) => handleBookingRequest(business, category)}
                            showBookingButton={true}
                            className="border-0 shadow-none rounded-none"
                          />
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Travel Mode Toggle */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Travel Assistant
                  </h3>
                  
                  <div className="flex space-x-2 mb-4">
                    <button
                      onClick={() => setTravelMode('chat')}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                        travelMode === 'chat'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Chat Mode
                    </button>
                    <button
                      onClick={() => setTravelMode('itinerary')}
                      className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${
                        travelMode === 'itinerary'
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Itinerary
                    </button>
                  </div>

                  {/* Quick Travel Actions */}
                  <div className="space-y-2">
                    <button
                      onClick={() => handleGenerateItinerary(location?.city || 'San Francisco', 3, {})}
                      disabled={!location}
                      className="w-full px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Plan 3-Day Trip
                    </button>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleTravelQuery('hotels', 'hotels')}
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                      >
                        🏨 Hotels
                      </button>
                      <button
                        onClick={() => handleTravelQuery('attractions', 'attractions')}
                        className="px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                      >
                        🎭 Attractions
                      </button>
                      <button
                        onClick={() => handleTravelQuery('transportation', 'transportation')}
                        className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                      >
                        🚇 Transport
                      </button>
                      <button
                        onClick={() => handleTravelQuery('dining', 'dining')}
                        className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded hover:bg-orange-100 transition-colors"
                      >
                        🍽️ Dining
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Suggestions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Try These
                  </h3>
                  
                  <div className="space-y-3">
                    {[
                      "Find me a hotel in downtown San Francisco",
                      "What attractions should I visit in New York?",
                      "I need a good Italian restaurant for dinner",
                      "Show me entertainment options for tonight",
                      "How do I get to the airport?",
                      "Plan a 3-day trip to Los Angeles"
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          // This would trigger the chat interface with the suggestion
                          // Implementation would depend on ChatInterface API
                        }}
                        className="w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 text-left transition-colors border border-transparent hover:border-gray-200"
                      >
                        &ldquo;{suggestion}&rdquo;
                      </button>
                    ))}
                  </div>
                </div>



                {/* Booking History */}
                {completedBookings.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                      <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Recent Bookings
                    </h3>
                    
                    <div className="space-y-3">
                      {completedBookings.slice(-3).map((booking, index) => (
                        <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="font-medium text-green-900">{booking.restaurantName}</div>
                          <div className="text-sm text-green-700">
                            {booking.date} at {booking.time} • {booking.partySize} guests
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            Confirmation: {booking.confirmationId}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>

            {/* Booking Modal */}
            {isBookingModalOpen && selectedBusiness && (
              <BookingModal {...memoizedBookingProps} />
            )}

            {/* Error handling is managed by ErrorBoundary */}
          </div>
        </LoadingOverlay>
      </ConversationProvider>
    </ErrorBoundary>
  );
}