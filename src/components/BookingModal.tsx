'use client';

import React, { useState, useEffect } from 'react';
import { 
  Business, 
  ContactInfo, 
  BookingRequest, 
  BookingResponse, 
  BookingInfo 
} from '@/lib/types';
import { validateEmail, validatePhoneNumber, formatPhoneNumber } from '@/lib/type-guards';

// =============================================================================
// COMPONENT PROPS
// =============================================================================

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  onBookingComplete: (booking: BookingInfo) => void;
  initialDate?: string;
  initialTime?: string;
  initialPartySize?: number;
}

interface BookingFormData {
  partySize: number;
  preferredDate: string;
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  specialRequests: string;
}

// =============================================================================
// BOOKING MODAL COMPONENT
// =============================================================================

export default function BookingModal({
  isOpen,
  onClose,
  business,
  onBookingComplete,
  initialDate,
  initialTime,
  initialPartySize = 2
}: BookingModalProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    partySize: initialPartySize,
    preferredDate: initialDate || '',
    preferredTime: initialTime || '19:00',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    specialRequests: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResponse | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setBookingResult(null);
      setShowConfirmation(false);
      setValidationErrors({});
      
      // Set default date to tomorrow if not provided
      if (!initialDate) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFormData(prev => ({
          ...prev,
          preferredDate: tomorrow.toISOString().split('T')[0]
        }));
      }
    }
  }, [isOpen, initialDate]);

  // =============================================================================
  // FORM VALIDATION
  // =============================================================================

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate party size
    if (formData.partySize < 1 || formData.partySize > 20) {
      errors.partySize = 'Party size must be between 1 and 20 people';
    }

    // Validate date
    if (!formData.preferredDate) {
      errors.preferredDate = 'Date is required';
    } else {
      const selectedDate = new Date(formData.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.preferredDate = 'Date cannot be in the past';
      }
    }

    // Validate time
    if (!formData.preferredTime) {
      errors.preferredTime = 'Time is required';
    }

    // Validate customer info
    if (!formData.customerName.trim()) {
      errors.customerName = 'Name is required';
    }

    if (!formData.customerPhone.trim()) {
      errors.customerPhone = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.customerPhone)) {
      errors.customerPhone = 'Please enter a valid phone number';
    }

    if (!formData.customerEmail.trim()) {
      errors.customerEmail = 'Email is required';
    } else if (!validateEmail(formData.customerEmail)) {
      errors.customerEmail = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // =============================================================================
  // BOOKING SUBMISSION
  // =============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const contactInfo: ContactInfo = {
        name: formData.customerName.trim(),
        phone: formData.customerPhone.trim(),
        email: formData.customerEmail.trim()
      };

      const bookingRequest: BookingRequest = {
        business,
        partySize: formData.partySize,
        preferredTime: formData.preferredTime,
        preferredDate: formData.preferredDate,
        userContact: contactInfo,
        specialRequests: formData.specialRequests.trim() || undefined
      };

      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingRequest)
      });

      const result: BookingResponse = await response.json();
      setBookingResult(result);

      if (result.success && result.bookingDetails) {
        setShowConfirmation(true);
        onBookingComplete(result.bookingDetails);
      } else {
        // Handle booking failure
        setError(result.error?.message || 'Booking failed');
      }

    } catch (err) {
      console.error('Booking submission error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================================================
  // ALTERNATIVE TIME SELECTION
  // =============================================================================

  const handleAlternativeTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, preferredTime: time }));
    setError(null);
    setBookingResult(null);
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderConfirmation = () => {
    if (!bookingResult?.success || !bookingResult.bookingDetails) return null;

    const booking = bookingResult.bookingDetails;
    
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Reservation Confirmed!</h3>
          <p className="text-gray-600">Your table has been reserved at {business.name}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-gray-900 mb-3">Reservation Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Confirmation ID:</span>
              <span className="font-mono text-gray-900">{booking.confirmationId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Restaurant:</span>
              <span className="text-gray-900">{booking.restaurantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="text-gray-900">{new Date(booking.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="text-gray-900">{booking.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Party Size:</span>
              <span className="text-gray-900">{booking.partySize} people</span>
            </div>
            {booking.specialRequests && (
              <div className="flex justify-between">
                <span className="text-gray-600">Special Requests:</span>
                <span className="text-gray-900">{booking.specialRequests}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            A confirmation email has been sent to {booking.userContact.email}. 
            Please arrive 10-15 minutes early for your reservation.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => window.open(`tel:${business.phone}`, '_self')}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Call Restaurant
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  const renderError = () => {
    if (!bookingResult || bookingResult.success) return null;

    return (
      <div className="mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800 mb-1">
                {bookingResult.error?.code === 'TIME_UNAVAILABLE' ? 'Time Not Available' : 'Booking Failed'}
              </h4>
              <p className="text-sm text-red-700 mb-3">{bookingResult.error?.message}</p>
              
              {/* Show alternative times if available */}
              {bookingResult.alternativeTimes && bookingResult.alternativeTimes.length > 0 && (
                <div>
                  <p className="text-sm text-red-700 mb-2">Try these available times:</p>
                  <div className="flex flex-wrap gap-2">
                    {bookingResult.alternativeTimes.map((time) => (
                      <button
                        key={time}
                        onClick={() => handleAlternativeTimeSelect(time)}
                        className="px-3 py-1 bg-white border border-red-300 text-red-700 rounded text-sm hover:bg-red-50 transition-colors"
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Show phone booking option if needed */}
              {bookingResult.requiresPhoneCall && bookingResult.phoneNumber && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm text-red-700 mb-2">Call the restaurant directly:</p>
                  <button
                    onClick={() => window.open(`tel:${bookingResult.phoneNumber}`, '_self')}
                    className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call {formatPhoneNumber(bookingResult.phoneNumber)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Party Size and Date/Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Party Size
          </label>
          <select
            value={formData.partySize}
            onChange={(e) => setFormData(prev => ({ ...prev, partySize: parseInt(e.target.value) }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.partySize ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map(size => (
              <option key={size} value={size}>
                {size} {size === 1 ? 'person' : 'people'}
              </option>
            ))}
          </select>
          {validationErrors.partySize && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.partySize}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={formData.preferredDate}
            onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.preferredDate ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.preferredDate && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.preferredDate}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time
          </label>
          <select
            value={formData.preferredTime}
            onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              validationErrors.preferredTime ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {/* Generate time options from 11:00 AM to 10:00 PM */}
            {Array.from({ length: 23 }, (_, i) => {
              const hour = Math.floor(11 + i / 2);
              const minute = i % 2 === 0 ? '00' : '30';
              if (hour > 22) return null;
              const time = `${hour.toString().padStart(2, '0')}:${minute}`;
              return (
                <option key={time} value={time}>
                  {new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </option>
              );
            }).filter(Boolean)}
          </select>
          {validationErrors.preferredTime && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.preferredTime}</p>
          )}
        </div>
      </div>

      {/* Customer Information */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-900">Contact Information</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            value={formData.customerName}
            onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
            placeholder="Enter your full name"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
              validationErrors.customerName ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {validationErrors.customerName && (
            <p className="text-red-600 text-sm mt-1">{validationErrors.customerName}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              placeholder="(555) 123-4567"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
                validationErrors.customerPhone ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.customerPhone && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.customerPhone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
              placeholder="your@email.com"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500 ${
                validationErrors.customerEmail ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {validationErrors.customerEmail && (
              <p className="text-red-600 text-sm mt-1">{validationErrors.customerEmail}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Requests (Optional)
          </label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
            placeholder="Window table, high chair, dietary restrictions, etc."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Booking...
            </span>
          ) : (
            'Make Reservation'
          )}
        </button>
      </div>
    </form>
  );

  // =============================================================================
  // MAIN RENDER
  // =============================================================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {showConfirmation ? 'Reservation Confirmed' : 'Make a Reservation'}
              </h2>
              <p className="text-gray-600">{business.name}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          {showConfirmation ? renderConfirmation() : (
            <>
              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
              
              {renderError()}
              {renderForm()}
            </>
          )}
        </div>
      </div>
    </div>
  );
}