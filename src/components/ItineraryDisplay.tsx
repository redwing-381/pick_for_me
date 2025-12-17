'use client';

import React, { useState, useMemo } from 'react';
import type { TravelItinerary, PlannedActivity } from '@/lib/types';
import TravelRecommendationCard, { TravelCategory } from './TravelRecommendationCard';

// =============================================================================
// ITINERARY DISPLAY COMPONENT
// =============================================================================

interface ItineraryDisplayProps {
  itinerary: TravelItinerary;
  onActivitySelect?: (activity: PlannedActivity) => void;
  onModifyDay?: (dayIndex: number) => void;
  className?: string;
  variant?: 'default' | 'compact';
}

export default function ItineraryDisplay({
  itinerary,
  onActivitySelect,
  onModifyDay,
  className = '',
  variant = 'default'
}: ItineraryDisplayProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(0);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showBalanceAnalysis, setShowBalanceAnalysis] = useState(false);

  // Calculate itinerary balance and metrics
  const itineraryMetrics = useMemo(() => {
    const totalActivities = itinerary.days.reduce((sum, day) => sum + day.activities.length, 0);
    const categoryCount = new Map<string, number>();
    const dailyActivityCount: number[] = [];
    const timeSlots = new Map<string, number>();
    let totalDuration = 0;
    let totalCost = 0;

    itinerary.days.forEach((day, dayIndex) => {
      dailyActivityCount[dayIndex] = day.activities.length;
      
      day.activities.forEach(activity => {
        // Count categories
        const category = activity.category;
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
        
        // Count time slots
        const hour = parseInt(activity.time.split(':')[0]);
        const timeSlot = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        timeSlots.set(timeSlot, (timeSlots.get(timeSlot) || 0) + 1);
        
        // Sum duration
        totalDuration += activity.duration;
        
        // Estimate cost
        const price = activity.activity.price;
        if (price === '$') totalCost += 25;
        else if (price === '$$') totalCost += 50;
        else if (price === '$$$') totalCost += 100;
        else if (price === '$$$$') totalCost += 150;
      });
    });

    // Calculate balance scores
    const categoryBalance = Math.min(1, categoryCount.size / 4); // Ideal: 4+ categories
    const pacingBalance = dailyActivityCount.length > 0 
      ? 1 - Math.abs(dailyActivityCount.reduce((a, b) => a + b, 0) / dailyActivityCount.length - 4) / 4 
      : 0; // Ideal: 4 activities per day
    const timeBalance = Math.min(1, timeSlots.size / 3); // Ideal: activities across all time slots
    
    const overallBalance = (categoryBalance + pacingBalance + timeBalance) / 3;

    return {
      totalActivities,
      categoryCount,
      dailyActivityCount,
      timeSlots,
      totalDuration,
      totalCost,
      categoryBalance,
      pacingBalance,
      timeBalance,
      overallBalance,
      avgActivitiesPerDay: totalActivities / itinerary.days.length,
      avgDurationPerDay: totalDuration / itinerary.days.length
    };
  }, [itinerary]);

  const handleDayToggle = (dayIndex: number) => {
    setExpandedDay(expandedDay === dayIndex ? null : dayIndex);
  };

  const handleActivityClick = (activity: PlannedActivity) => {
    setSelectedActivity(activity.activity.id);
    if (onActivitySelect) {
      onActivitySelect(activity);
    }
  };

  const handleModifyDay = (dayIndex: number) => {
    if (onModifyDay) {
      onModifyDay(dayIndex);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivityIcon = (category: string) => {
    switch (category) {
      case 'dining':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'accommodation':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'attraction':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
          </svg>
        );
      case 'transportation':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'entertainment':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v18a1 1 0 01-1 1H4a1 1 0 01-1-1V1a1 1 0 011-1h2a1 1 0 011 1v3" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getBookingStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getBalanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getBalanceLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Needs Improvement';
  };

  const getCategoryIcon = (category: string) => {
    return getActivityIcon(category);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const renderBalanceAnalysis = () => (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Itinerary Balance Analysis</h3>
        <button
          onClick={() => setShowBalanceAnalysis(!showBalanceAnalysis)}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          {showBalanceAnalysis ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      {/* Overall Balance Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Balance</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBalanceColor(itineraryMetrics.overallBalance)}`}>
            {getBalanceLabel(itineraryMetrics.overallBalance)}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${itineraryMetrics.overallBalance * 100}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {Math.round(itineraryMetrics.overallBalance * 100)}% balanced
        </p>
      </div>

      {showBalanceAnalysis && (
        <div className="space-y-6">
          {/* Category Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Activity Categories</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Array.from(itineraryMetrics.categoryCount.entries()).map(([category, count]) => (
                <div key={category} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                  <div className="text-gray-600">
                    {getCategoryIcon(category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 capitalize truncate">{category}</p>
                    <p className="text-xs text-gray-500">{count} activities</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-gray-500">Variety Score</span>
              <span className={`px-2 py-1 rounded-full font-medium ${getBalanceColor(itineraryMetrics.categoryBalance)}`}>
                {Math.round(itineraryMetrics.categoryBalance * 100)}%
              </span>
            </div>
          </div>

          {/* Daily Pacing */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Daily Pacing</h4>
            <div className="space-y-2">
              {itinerary.days.map((day, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-xs font-medium text-gray-900">
                    Day {index + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {itineraryMetrics.dailyActivityCount[index]} activities
                    </span>
                    <div className="w-16 bg-gray-200 rounded-full h-1">
                      <div 
                        className="bg-blue-600 h-1 rounded-full"
                        style={{ width: `${Math.min(100, (itineraryMetrics.dailyActivityCount[index] / 6) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Avg: {itineraryMetrics.avgActivitiesPerDay.toFixed(1)} activities/day
              </span>
              <span className={`px-2 py-1 rounded-full font-medium ${getBalanceColor(itineraryMetrics.pacingBalance)}`}>
                {Math.round(itineraryMetrics.pacingBalance * 100)}%
              </span>
            </div>
          </div>

          {/* Time Distribution */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Time Distribution</h4>
            <div className="grid grid-cols-3 gap-3">
              {['morning', 'afternoon', 'evening'].map(timeSlot => (
                <div key={timeSlot} className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs font-medium text-gray-900 capitalize">{timeSlot}</p>
                  <p className="text-lg font-bold text-blue-600">
                    {itineraryMetrics.timeSlots.get(timeSlot) || 0}
                  </p>
                  <p className="text-xs text-gray-500">activities</p>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-gray-500">Time Balance</span>
              <span className={`px-2 py-1 rounded-full font-medium ${getBalanceColor(itineraryMetrics.timeBalance)}`}>
                {Math.round(itineraryMetrics.timeBalance * 100)}%
              </span>
            </div>
          </div>

          {/* Cost Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Cost Breakdown</h4>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Estimated Activities Cost</span>
                <span className="text-sm font-medium text-gray-900">${itineraryMetrics.totalCost}</span>
              </div>
              {itinerary.totalEstimatedCost && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Trip Cost</span>
                  <span className="text-lg font-bold text-blue-600">${itinerary.totalEstimatedCost}</span>
                </div>
              )}
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Avg per day</span>
                  <span>${Math.round((itinerary.totalEstimatedCost || itineraryMetrics.totalCost) / itinerary.days.length)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {itineraryMetrics.overallBalance < 0.7 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">Balance Recommendations</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                {itineraryMetrics.categoryBalance < 0.6 && (
                  <li>• Consider adding more variety in activity types</li>
                )}
                {itineraryMetrics.pacingBalance < 0.6 && (
                  <li>• {itineraryMetrics.avgActivitiesPerDay > 5 
                    ? 'Consider reducing activities per day for a more relaxed pace' 
                    : 'Consider adding more activities to make the most of your trip'}</li>
                )}
                {itineraryMetrics.timeBalance < 0.6 && (
                  <li>• Try to spread activities across morning, afternoon, and evening</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderCompactItinerary = () => (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-900">{itinerary.name}</h2>
        <p className="text-sm text-gray-600 mt-1">
          {itinerary.destination.city}, {itinerary.destination.state}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {itinerary.days.length} day{itinerary.days.length !== 1 ? 's' : ''}
          {itinerary.totalEstimatedCost && (
            <span className="ml-2">• Est. ${itinerary.totalEstimatedCost}</span>
          )}
        </p>
      </div>

      <div className="divide-y">
        {itinerary.days.map((day, dayIndex) => (
          <div key={dayIndex} className="p-4">
            <button
              onClick={() => handleDayToggle(dayIndex)}
              className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-md transition-colors"
            >
              <div>
                <h3 className="font-semibold text-gray-900">
                  Day {dayIndex + 1}
                </h3>
                <p className="text-sm text-gray-600">
                  {formatDate(day.date)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {day.activities.length} activities planned
                </p>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedDay === dayIndex ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedDay === dayIndex && (
              <div className="mt-4 space-y-3">
                {day.activities.map((activity, activityIndex) => (
                  <div
                    key={activityIndex}
                    onClick={() => handleActivityClick(activity)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedActivity === activity.activity.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getActivityIcon(activity.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {activity.activity.name}
                          </h4>
                          <span className="text-xs text-gray-500 ml-2">
                            {activity.time}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {(activity.activity.categories || []).map(c => c.title).join(', ')}
                        </p>
                        {activity.bookingRequired && (
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border mt-2 ${getBookingStatusColor(activity.bookingStatus)}`}>
                            {activity.bookingStatus === 'confirmed' && '✓ '}
                            {activity.bookingStatus === 'pending' && '⏳ '}
                            {activity.bookingStatus === 'failed' && '✗ '}
                            {activity.bookingStatus.charAt(0).toUpperCase() + activity.bookingStatus.slice(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderDefaultItinerary = () => (
    <div className={`space-y-6 ${className}`}>
      {/* Balance Analysis */}
      {renderBalanceAnalysis()}
      
      {/* Main Itinerary */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{itinerary.name}</h2>
            <p className="text-gray-600 mt-1">
              {itinerary.destination.city}, {itinerary.destination.state}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span>{itinerary.days.length} day{itinerary.days.length !== 1 ? 's' : ''}</span>
              {itinerary.totalEstimatedCost && (
                <span>Est. ${itinerary.totalEstimatedCost}</span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">
              {formatDate(itinerary.days[0]?.date)} - {formatDate(itinerary.days[itinerary.days.length - 1]?.date)}
            </p>
          </div>
        </div>
      </div>

      {/* Days */}
      <div className="divide-y">
        {itinerary.days.map((day, dayIndex) => (
          <div key={dayIndex} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Day {dayIndex + 1}
                </h3>
                <p className="text-gray-600">
                  {formatDate(day.date)}
                </p>
              </div>
              <button
                onClick={() => handleModifyDay(dayIndex)}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
              >
                Modify Day
              </button>
            </div>

            {/* Accommodation */}
            {day.accommodation && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Accommodation
                </h4>
                <TravelRecommendationCard
                  business={day.accommodation}
                  category="accommodation"
                  variant="compact"
                  className="mb-4"
                />
              </div>
            )}

            {/* Activities Timeline */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Daily Schedule
              </h4>
              
              {day.activities.map((activity, activityIndex) => (
                <div key={activityIndex} className="flex items-start space-x-4">
                  {/* Timeline */}
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                      {activity.time}
                    </div>
                    {activityIndex < day.activities.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Activity Card */}
                  <div className="flex-1">
                    <TravelRecommendationCard
                      business={activity.activity}
                      category={activity.category as TravelCategory}
                      variant="compact"
                      onSelect={() => handleActivityClick(activity)}
                      className={selectedActivity === activity.activity.id ? 'ring-2 ring-blue-500' : ''}
                    />
                    
                    {activity.bookingRequired && (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mt-2 ${getBookingStatusColor(activity.bookingStatus)}`}>
                        {activity.bookingStatus === 'confirmed' && '✓ '}
                        {activity.bookingStatus === 'pending' && '⏳ '}
                        {activity.bookingStatus === 'failed' && '✗ '}
                        Booking {activity.bookingStatus}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Day Notes */}
            {day.notes && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{day.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
      </div>
    </div>
  );

  return variant === 'compact' ? renderCompactItinerary() : renderDefaultItinerary();
}

// =============================================================================
// ITINERARY SUMMARY COMPONENT
// =============================================================================

interface ItinerarySummaryProps {
  itinerary: TravelItinerary;
  className?: string;
}

export function ItinerarySummary({ itinerary, className = '' }: ItinerarySummaryProps) {
  const totalActivities = itinerary.days.reduce((sum, day) => sum + day.activities.length, 0);
  const confirmedBookings = itinerary.days.reduce(
    (sum, day) => sum + day.activities.filter(a => a.bookingStatus === 'confirmed').length,
    0
  );
  const pendingBookings = itinerary.days.reduce(
    (sum, day) => sum + day.activities.filter(a => a.bookingStatus === 'pending').length,
    0
  );

  // Calculate category distribution
  const categories = new Set<string>();
  itinerary.days.forEach(day => {
    day.activities.forEach(activity => {
      categories.add(activity.category);
    });
  });

  // Calculate balance score
  const avgActivitiesPerDay = totalActivities / itinerary.days.length;
  const balanceScore = Math.min(1, categories.size / 4) * 0.4 + 
                     (1 - Math.abs(avgActivitiesPerDay - 4) / 4) * 0.6;

  const getBalanceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBalanceLabel = (score: number) => {
    if (score >= 0.8) return 'Excellent';
    if (score >= 0.6) return 'Good';
    if (score >= 0.4) return 'Fair';
    return 'Needs Work';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Trip Summary</h3>
        <div className="text-right">
          <p className="text-xs text-gray-500">Balance Score</p>
          <p className={`text-sm font-medium ${getBalanceColor(balanceScore)}`}>
            {getBalanceLabel(balanceScore)}
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{itinerary.days.length}</p>
          <p className="text-xs text-gray-600">Day{itinerary.days.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <p className="text-2xl font-bold text-green-600">{totalActivities}</p>
          <p className="text-xs text-gray-600">Activities</p>
        </div>
        
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{categories.size}</p>
          <p className="text-xs text-gray-600">Categories</p>
        </div>
        
        {itinerary.totalEstimatedCost ? (
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">${itinerary.totalEstimatedCost}</p>
            <p className="text-xs text-gray-600">Est. Cost</p>
          </div>
        ) : (
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-600">{avgActivitiesPerDay.toFixed(1)}</p>
            <p className="text-xs text-gray-600">Avg/Day</p>
          </div>
        )}
      </div>

      {/* Booking Status */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Booking Status</h4>
        <div className="flex items-center space-x-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">{confirmedBookings} Confirmed</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-600">{pendingBookings} Pending</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span className="text-gray-600">{totalActivities - confirmedBookings - pendingBookings} No Booking</span>
          </div>
        </div>
        
        {pendingBookings > 0 && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
            💡 You have {pendingBookings} pending booking{pendingBookings !== 1 ? 's' : ''} that need attention
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="border-t pt-4 mt-4">
        <div className="grid grid-cols-3 gap-4 text-xs text-center">
          <div>
            <p className="text-gray-500">Avg Activities</p>
            <p className="font-medium text-gray-900">{avgActivitiesPerDay.toFixed(1)}/day</p>
          </div>
          <div>
            <p className="text-gray-500">Trip Length</p>
            <p className="font-medium text-gray-900">
              {itinerary.days.length === 1 ? 'Day Trip' : 
               itinerary.days.length <= 3 ? 'Weekend' :
               itinerary.days.length <= 7 ? 'Week Trip' : 'Extended'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Style</p>
            <p className="font-medium text-gray-900">
              {avgActivitiesPerDay >= 5 ? 'Packed' :
               avgActivitiesPerDay >= 3 ? 'Balanced' : 'Relaxed'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}