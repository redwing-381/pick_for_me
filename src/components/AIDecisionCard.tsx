'use client';

import React from 'react';
import type { Business, DecisionResponse } from '@/lib/types';

interface AIDecisionCardProps {
  decision: DecisionResponse;
  onBook?: (business: Business) => void;
  onShowAlternatives?: () => void;
  className?: string;
}

export default function AIDecisionCard({
  decision,
  onBook,
  onShowAlternatives,
  className = ''
}: AIDecisionCardProps) {
  const { selectedBusiness, reasoning, confidence, alternatives } = decision;
  const confidencePercentage = Math.round(confidence * 100);

  // Get confidence color based on percentage
  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (conf >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (conf >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  const getConfidenceIcon = (conf: number) => {
    if (conf >= 90) return '🎯';
    if (conf >= 75) return '✨';
    if (conf >= 60) return '👍';
    return '🤔';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border-2 border-blue-200 overflow-hidden ${className}`}>
      {/* AI Decision Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-lg">🤖</span>
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Selected For You</h3>
              <p className="text-blue-100 text-sm">Your perfect choice, decided autonomously</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full border ${getConfidenceColor(confidencePercentage)} bg-white`}>
            <span className="text-sm font-semibold">
              {getConfidenceIcon(confidencePercentage)} {confidencePercentage}% confident
            </span>
          </div>
        </div>
      </div>

      {/* Restaurant Details */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedBusiness.name}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center">
                <span className="text-yellow-400 mr-1">⭐</span>
                <span className="font-medium">{selectedBusiness.rating}</span>
                <span className="ml-1">({selectedBusiness.review_count} reviews)</span>
              </div>
              <div className="flex items-center">
                <span className="mr-1">💰</span>
                <span>{selectedBusiness.price || 'Price not available'}</span>
              </div>
              {selectedBusiness.distance && (
                <div className="flex items-center">
                  <span className="mr-1">📍</span>
                  <span>{selectedBusiness.distance.toFixed(1)} miles</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedBusiness.categories?.map((category, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                >
                  {category.title}
                </span>
              ))}
            </div>
          </div>
          {selectedBusiness.image_url && (
            <div className="ml-4">
              <img
                src={selectedBusiness.image_url}
                alt={selectedBusiness.name}
                className="w-24 h-24 rounded-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* AI Reasoning */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
            <span className="mr-2">🧠</span>
            Why I chose this for you:
          </h4>
          <p className="text-blue-800 text-sm leading-relaxed">{reasoning}</p>
        </div>

        {/* Top Decision Factors */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Key Decision Factors:</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {decision.factors?.slice(0, 3).map((factor, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700">{factor.name}</span>
                  <span className="text-xs text-gray-500">{Math.round(factor.score * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${factor.score * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">{factor.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => onBook?.(selectedBusiness)}
            className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <span>📅</span>
            <span>Book This Choice</span>
          </button>
          
          {alternatives && alternatives.length > 0 && (
            <button
              onClick={onShowAlternatives}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <span>🔄</span>
              <span>Show Alternatives ({alternatives.length})</span>
            </button>
          )}
        </div>

        {/* Location Info */}
        {selectedBusiness.location && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <span className="mt-0.5">📍</span>
              <div>
                <p>{selectedBusiness.location.address1}</p>
                <p>{selectedBusiness.location.city}, {selectedBusiness.location.state} {selectedBusiness.location.zip_code}</p>
                {selectedBusiness.phone && (
                  <p className="mt-1">
                    <span className="mr-2">📞</span>
                    <a href={`tel:${selectedBusiness.phone}`} className="text-blue-600 hover:underline">
                      {selectedBusiness.display_phone || selectedBusiness.phone}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}