'use client';

import React, { useState } from 'react';
import type { Business } from '@/lib/types';

// =============================================================================
// RESTAURANT CARD COMPONENT
// =============================================================================

interface RestaurantCardProps {
  restaurant: Business;
  onBook?: (restaurant: Business) => void;
  onSelect?: (restaurant: Business) => void;
  showBookingButton?: boolean;
  isSelected?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function RestaurantCard({
  restaurant,
  onBook,
  onSelect,
  showBookingButton = true,
  isSelected = false,
  className = '',
  variant = 'default'
}: RestaurantCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // Early return if restaurant is not provided
  if (!restaurant) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="text-gray-500 text-center">Restaurant information not available</div>
      </div>
    );
  }

  // Ensure categories exist
  const categories = restaurant.categories || [];

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(restaurant);
    }
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBook) {
      onBook(restaurant);
    }
  };

  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const address = restaurant.location.display_address.join(', ');
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (restaurant.phone) {
      window.location.href = `tel:${restaurant.phone}`;
    }
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (restaurant.url) {
      window.open(restaurant.url, '_blank');
    }
  };

  const formatHours = (hours: typeof restaurant.hours) => {
    if (!hours || hours.length === 0) return 'Hours not available';
    
    const todayHours = hours[0];
    if (!todayHours.open || todayHours.open.length === 0) {
      return 'Closed today';
    }

    const todaySchedule = todayHours.open[0];
    const openTime = formatTime(todaySchedule.start);
    const closeTime = formatTime(todaySchedule.end);
    
    return `${openTime} - ${closeTime}`;
  };

  const formatTime = (timeString: string) => {
    const hour = parseInt(timeString.substring(0, 2));
    const minute = timeString.substring(2, 4);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute} ${ampm}`;
  };

  const getPriceColor = (price: string) => {
    switch (price) {
      case '$': return 'text-green-600';
      case '$$': return 'text-yellow-600';
      case '$$$': return 'text-orange-600';
      case '$$$$': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = (isOpen: boolean) => {
    return isOpen ? 'text-green-600' : 'text-red-600';
  };

  const renderCompactCard = () => (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer p-4 ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'hover:border-gray-300'
      } ${className}`}
    >
      <div className="flex items-start space-x-3">
        {/* Image */}
        <div className="flex-shrink-0">
          {restaurant.image_url && !imageError ? (
            <img
              src={restaurant.image_url}
              alt={restaurant.name}
              className="w-16 h-16 rounded-lg object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-gray-400 text-xs">No Image</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">{restaurant.name}</h3>
          
          <div className="flex items-center space-x-3 mt-1">
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600 ml-1">
                {restaurant.rating} ({restaurant.review_count})
              </span>
            </div>
            <span className={`text-sm font-medium ${getPriceColor(restaurant.price)}`}>
              {restaurant.price}
            </span>
            {restaurant.distance && (
              <span className="text-sm text-gray-500">
                {restaurant.distance.toFixed(1)} mi
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1">
            {categories.map(c => c.title).join(', ')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex space-x-2">
          {showBookingButton && (
            <button
              onClick={handleBookClick}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderDetailedCard = () => (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-xl shadow-lg border hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'hover:border-gray-300'
      } ${className}`}
    >
      {/* Image Gallery */}
      {restaurant.photos && restaurant.photos.length > 0 && (
        <div className="relative">
          <img
            src={restaurant.photos[0]}
            alt={restaurant.name}
            className="w-full h-48 object-cover"
            onError={() => setImageError(true)}
          />
          
          {restaurant.photos.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAllPhotos(!showAllPhotos);
              }}
              className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs hover:bg-opacity-70"
            >
              +{restaurant.photos.length - 1} more
            </button>
          )}

          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              restaurant.is_closed 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {restaurant.is_closed ? 'Closed' : 'Open'}
            </span>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{restaurant.name}</h2>
            
            <div className="flex items-center space-x-4 mb-2">
              <div className="flex items-center">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.floor(restaurant.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <span className="text-sm text-gray-600 ml-2">
                  {restaurant.rating} ({restaurant.review_count} reviews)
                </span>
              </div>
              
              <span className={`text-lg font-bold ${getPriceColor(restaurant.price)}`}>
                {restaurant.price}
              </span>
            </div>

            <p className="text-gray-600 mb-3">
              {categories.map(c => c.title).join(' • ')}
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Location */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location
            </h4>
            <p className="text-sm text-gray-600">
              {restaurant.location.display_address.join(', ')}
            </p>
            {restaurant.distance && (
              <p className="text-sm text-blue-600 mt-1">
                {restaurant.distance.toFixed(1)} miles away
              </p>
            )}
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Contact
            </h4>
            {restaurant.display_phone && (
              <p className="text-sm text-gray-600 mb-1">
                {restaurant.display_phone}
              </p>
            )}
            <button
              onClick={handleWebsiteClick}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              View on Yelp →
            </button>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hours
            </h4>
            <p className="text-sm text-gray-600">
              {formatHours(restaurant.hours)}
            </p>
            <p className={`text-sm font-medium ${getStatusColor(!restaurant.is_closed)}`}>
              {restaurant.is_closed ? 'Closed now' : 'Open now'}
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Services
            </h4>
            <div className="flex flex-wrap gap-1">
              {restaurant.transactions.map((transaction, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {transaction.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {showBookingButton && restaurant.transactions.includes('restaurant_reservation') && (
            <button
              onClick={handleBookClick}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Make Reservation
            </button>
          )}
          
          <button
            onClick={handleDirectionsClick}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Get Directions
          </button>
          
          {restaurant.phone && (
            <button
              onClick={handleCallClick}
              className="bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Photo Gallery Modal */}
      {showAllPhotos && restaurant.photos && restaurant.photos.length > 1 && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-full overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold">Photos - {restaurant.name}</h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAllPhotos(false);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
              {restaurant.photos.map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`${restaurant.name} photo ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderDefaultCard = () => (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-lg shadow-md border hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'hover:border-gray-300'
      } ${className}`}
    >
      {/* Image */}
      {restaurant.image_url && !imageError && (
        <div className="relative">
          <img
            src={restaurant.image_url}
            alt={restaurant.name}
            className="w-full h-32 object-cover"
            onError={() => setImageError(true)}
          />
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              restaurant.is_closed 
                ? 'bg-red-100 text-red-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {restaurant.is_closed ? 'Closed' : 'Open'}
            </span>
          </div>
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">{restaurant.name}</h3>
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <span className="text-yellow-400">★</span>
                <span className="text-sm text-gray-600 ml-1">
                  {restaurant.rating} ({restaurant.review_count})
                </span>
              </div>
              <span className={`text-sm font-medium ${getPriceColor(restaurant.price)}`}>
                {restaurant.price}
              </span>
            </div>
            
            {restaurant.distance && (
              <span className="text-sm text-gray-500">
                {restaurant.distance.toFixed(1)} mi
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600">
            {categories.map(c => c.title).join(', ')}
          </p>
        </div>

        {/* Quick Info */}
        <div className="mb-4 space-y-1">
          <p className="text-sm text-gray-600">
            📍 {restaurant.location.display_address[0]}
          </p>
          {restaurant.hours && (
            <p className="text-sm text-gray-600">
              🕒 {formatHours(restaurant.hours)}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          {showBookingButton && restaurant.transactions.includes('restaurant_reservation') && (
            <button
              onClick={handleBookClick}
              className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Reserve
            </button>
          )}
          
          <button
            onClick={handleDirectionsClick}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Directions
          </button>
        </div>
      </div>
    </div>
  );

  // Render based on variant
  switch (variant) {
    case 'compact':
      return renderCompactCard();
    case 'detailed':
      return renderDetailedCard();
    default:
      return renderDefaultCard();
  }
}