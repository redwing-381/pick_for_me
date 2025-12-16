'use client';

import { useState, useCallback, useEffect, useMemo, memo } from 'react';
import { ConversationProvider } from '@/contexts/ConversationContext';
import ChatInterface from '@/components/ChatInterface';
import LocationInput from '@/components/LocationInput';
import RestaurantCard from '@/components/RestaurantCard';
import BookingModal from '@/components/BookingModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner, LoadingSkeleton, LoadingOverlay } from '@/components/LoadingStates';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useDebounce, useLocalStorageCache, usePerformanceMonitor } from '@/lib/performance-utils';
import { transitions, microInteractions } from '@/lib/animations';
import type { Location, UserPreferences, Business, BookingInfo } from '@/lib/types';

// Memoized components for performance
const MemoizedChatInterface = memo(ChatInterface);
const MemoizedLocationInput = memo(LocationInput);
const MemoizedRestaurantCard = memo(RestaurantCard);

export default function Home() {
  // Performance monitoring
  usePerformanceMonitor('HomePage');
  
  // State management with local storage cache for preferences
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [completedBookings, setCompletedBookings] = useState<BookingInfo[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  
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
  const handleBookingRequest = useCallback((business: Business) => {
    setSelectedBusiness(business);
    setIsBookingModalOpen(true);
  }, []);

  const handleBookingComplete = useCallback((booking: BookingInfo) => {
    setCompletedBookings(prev => [...prev, booking]);
    setIsBookingModalOpen(false);
    // Show success notification
    clearError();
  }, [clearError]);

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
    initialPartySize: userPreferences.partySize
  }), [isBookingModalOpen, handleBookingClose, selectedBusiness, handleBookingComplete, userPreferences.partySize]);

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
                  <h1 className="text-2xl font-bold text-gray-900">Pick For Me</h1>
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
              {/* Chat Interface - Main Content */}
              <div className="lg:col-span-3 order-2 lg:order-1">
                <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${transitions.shadow} ${microInteractions.cardHover}`}>
                  <MemoizedChatInterface {...memoizedChatProps} />
                </div>
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

                {/* Selected Business - Enhanced with RestaurantCard */}
                {selectedBusiness && (
                  <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${transitions.normal} ${microInteractions.cardHover}`}>
                    <div className="p-4 border-b bg-gray-50">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <svg className={`w-5 h-5 mr-2 text-green-600 ${microInteractions.iconHover}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Your Pick
                      </h3>
                    </div>
                    <div className="p-0">
                      <MemoizedRestaurantCard
                        restaurant={selectedBusiness}
                        variant="compact"
                        onBook={handleBookingRequest}
                        showBookingButton={true}
                        className="border-0 shadow-none rounded-none"
                      />
                    </div>
                  </div>
                )}

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
                      "Find me a good Italian restaurant nearby",
                      "I want something budget-friendly for lunch",
                      "Pick a fancy place for a special occasion",
                      "Show me the best pizza in town"
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