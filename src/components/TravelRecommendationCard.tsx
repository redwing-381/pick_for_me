'use client';

import React, { useState, memo, useCallback } from 'react';
import { usePerformanceTracking, useLazyLoad } from '@/lib/travel-performance';
import type { Business } from '@/lib/types';

// =============================================================================
// TRAVEL RECOMMENDATION CARD COMPONENT
// =============================================================================

export type TravelCategory = 'dining' | 'accommodation' | 'attraction' | 'transportation' | 'entertainment';

interface TravelRecommendationCardProps {
  business: Business;
  category: TravelCategory;
  onBook?: (business: Business) => void;
  onSelect?: (business: Business) => void;
  showBookingButton?: boolean;
  isSelected?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

export default function TravelRecommendationCard({
  business,
  category,
  onBook,
  onSelect,
  showBookingButton = true,
  isSelected = false,
  className = '',
  variant = 'default'
}: TravelRecommendationCardProps) {
  const [imageError, setImageError] = useState(false);
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // Early return if business is not provided
  if (!business) {
    return (
      <div className={`bg-gray-100 rounded-lg p-4 ${className}`}>
        <div className="text-gray-500 text-center">Business information not available</div>
      </div>
    );
  }

  // Ensure categories exist
  const categories = business.categories || [];

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(business);
    }
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBook) {
      onBook(business);
    }
  };

  const handleDirectionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const address = business.location.display_address.join(', ');
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(mapsUrl, '_blank');
  };

  const handleCallClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (business.phone) {
      window.location.href = `tel:${business.phone}`;
    }
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (business.url) {
      window.open(business.url, '_blank');
    }
  };

  // Category-specific styling and icons
  const getCategoryColor = (category: TravelCategory) => {
    switch (category) {
      case 'dining':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'accommodation':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'attraction':
        return 'text-pink-600 bg-pink-50 border-pink-200';
      case 'transportation':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200';
      case 'entertainment':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getCategoryIcon = (category: TravelCategory) => {
    switch (category) {
      case 'dining':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'accommodation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'attraction':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
          </svg>
        );
      case 'transportation':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'entertainment':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
    }
  };

  const getBookingButtonText = (category: TravelCategory) => {
    switch (category) {
      case 'dining':
        return 'Reserve Table';
      case 'accommodation':
        return 'Book Room';
      case 'attraction':
        return 'Get Tickets';
      case 'transportation':
        return 'Book Ticket';
      case 'entertainment':
        return 'Buy Tickets';
      default:
        return 'Book Now';
    }
  };

  const getPriceColor = (price: string) => {
    switch (price) {
      case '$':
        return 'text-green-600';
      case '$$':
        return 'text-yellow-600';
      case '$$$':
        return 'text-orange-600';
      case '$$$$':
        return 'text-red-600';
      case 'Free':
        return 'text-blue-600';
      case 'N/A':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  };

  const formatHours = (hours: typeof business.hours) => {
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
          {business.image_url && !imageError ? (
            <img
              src={business.image_url}
              alt={business.name}
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
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{business.name}</h3>
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}>
              {getCategoryIcon(category)}
              <span className="ml-1 capitalize">{category}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 mt-1">
            <div className="flex items-center">
              <span className="text-yellow-400">★</span>
              <span className="text-sm text-gray-600 ml-1">
                {business.rating} ({business.review_count})
              </span>
            </div>
            {business.price && (
              <span className={`text-sm font-medium ${getPriceColor(business.price)}`}>
                {business.price}
              </span>
            )}
            {business.distance && (
              <span className="text-sm text-gray-500">
                {business.distance.toFixed(1)} mi
              </span>
            )}
          </div>

          <p className="text-sm text-gray-600 mt-1">
            {categories.map(c => c.title).join(', ')}
          </p>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 mt-3">
            {showBookingButton && (
              <button
                onClick={handleBookClick}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${getCategoryColor(category)} hover:opacity-80`}
              >
                {getBookingButtonText(category)}
              </button>
            )}
            <button
              onClick={handleDirectionsClick}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDefaultCard = () => (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'hover:border-gray-300'
      } ${className}`}
    >
      {/* Image */}
      {business.image_url && !imageError ? (
        <img
          src={business.image_url}
          alt={business.name}
          className="w-full h-48 object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">No Image Available</span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-semibold text-gray-900">{business.name}</h3>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(category)}`}>
            {getCategoryIcon(category)}
            <span className="ml-1 capitalize">{category}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-3">
          <div className="flex items-center">
            <span className="text-yellow-400 text-lg">★</span>
            <span className="text-sm text-gray-600 ml-1">
              {business.rating} ({business.review_count} reviews)
            </span>
          </div>
          {business.price && (
            <span className={`text-sm font-medium ${getPriceColor(business.price)}`}>
              {business.price}
            </span>
          )}
          {business.distance && (
            <span className="text-sm text-gray-500">
              {business.distance.toFixed(1)} miles away
            </span>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-3">
          {categories.map(c => c.title).join(', ')}
        </p>

        <div className="text-sm text-gray-600 mb-4">
          <p>{business.location.display_address.join(', ')}</p>
          {business.hours && (
            <p className="mt-1">
              <span className="font-medium">Hours:</span> {formatHours(business.hours)}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          {showBookingButton && (
            <button
              onClick={handleBookClick}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${getCategoryColor(category)} hover:opacity-80`}
            >
              {getBookingButtonText(category)}
            </button>
          )}
          <button
            onClick={handleDirectionsClick}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Directions
          </button>
          {business.phone && (
            <button
              onClick={handleCallClick}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Call
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const renderDetailedCard = () => (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'hover:border-gray-300'
      } ${className}`}
    >
      {/* Image Gallery */}
      <div className="relative">
        {business.image_url && !imageError ? (
          <img
            src={business.image_url}
            alt={business.name}
            className="w-full h-64 object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No Image Available</span>
          </div>
        )}
        
        {/* Category badge */}
        <div className={`absolute top-4 right-4 flex items-center px-3 py-1.5 rounded-full text-sm font-medium border backdrop-blur-sm ${getCategoryColor(category)}`}>
          {getCategoryIcon(category)}
          <span className="ml-2 capitalize">{category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-3">{business.name}</h3>

        <div className="flex items-center space-x-6 mb-4">
          <div className="flex items-center">
            <span className="text-yellow-400 text-xl">★</span>
            <span className="text-lg text-gray-700 ml-2 font-medium">
              {business.rating}
            </span>
            <span className="text-sm text-gray-500 ml-1">
              ({business.review_count} reviews)
            </span>
          </div>
          {business.price && (
            <span className={`text-lg font-bold ${getPriceColor(business.price)}`}>
              {business.price}
            </span>
          )}
          {business.distance && (
            <span className="text-sm text-gray-500">
              {business.distance.toFixed(1)} miles away
            </span>
          )}
        </div>

        <div className="mb-4">
          <p className="text-gray-600 font-medium mb-2">
            {categories.map(c => c.title).join(', ')}
          </p>
          <p className="text-gray-600">
            {business.location.display_address.join(', ')}
          </p>
          {business.hours && (
            <p className="text-gray-600 mt-1">
              <span className="font-medium">Hours:</span> {formatHours(business.hours)}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-3">
          {showBookingButton && (
            <button
              onClick={handleBookClick}
              className={`flex-1 px-6 py-3 text-sm font-medium rounded-lg transition-colors ${getCategoryColor(category)} hover:opacity-80`}
            >
              {getBookingButtonText(category)}
            </button>
          )}
          <button
            onClick={handleDirectionsClick}
            className="px-6 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Directions
          </button>
          {business.phone && (
            <button
              onClick={handleCallClick}
              className="px-6 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Call
            </button>
          )}
          {business.url && (
            <button
              onClick={handleWebsiteClick}
              className="px-6 py-3 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Website
            </button>
          )}
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