'use client';

import React, { useState, useEffect } from 'react';
import { 
  Business, 
  ContactInfo, 
  BookingRequest, 
  BookingResponse, 
  BookingInfo 
} from '@/lib/types';
import { 
  TravelBookingRequest, 
  TravelBookingResponse, 
  BookingDetails,
  coordinateTravelBooking 
} from '@/lib/booking-orchestrator';
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
  category?: 'dining' | 'accommodation' | 'attraction' | 'transportation' | 'entertainment';
}

interface BookingFormData {
  // Common fields
  partySize: number;
  preferredDate: string;
  preferredTime: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  specialRequests: string;
  
  // Travel-specific fields
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  numberOfRooms: number;
  visitTime: string;
  ticketType: string;
  numberOfTickets: number;
  departureTime: string;
  arrivalTime: string;
  transportationType: string;
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
  initialPartySize = 2,
  category = 'dining'
}: BookingModalProps) {
  const [formData, setFormData] = useState<BookingFormData>({
    // Common fields
    partySize: initialPartySize,
    preferredDate: initialDate || '',
    preferredTime: initialTime || '19:00',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    specialRequests: '',
    
    // Travel-specific fields
    checkInDate: initialDate || '',
    checkOutDate: '',
    roomType: 'Standard',
    numberOfRooms: 1,
    visitTime: '10:00',
    ticketType: 'General Admission',
    numberOfTickets: initialPartySize,
    departureTime: '09:00',
    arrivalTime: '',
    transportationType: 'bus'
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResponse | TravelBookingResponse | null>(null);
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

    // Common validations
    if (formData.partySize < 1 || formData.partySize > 20) {
      errors.partySize = 'Party size must be between 1 and 20 people';
    }

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

    // Category-specific validations
    switch (category) {
      case 'dining':
        if (!formData.preferredDate) {
          errors.preferredDate = 'Date is required';
        }
        if (!formData.preferredTime) {
          errors.preferredTime = 'Time is required';
        }
        break;

      case 'accommodation':
        if (!formData.checkInDate) {
          errors.checkInDate = 'Check-in date is required';
        }
        if (!formData.checkOutDate) {
          errors.checkOutDate = 'Check-out date is required';
        }
        if (formData.checkInDate && formData.checkOutDate) {
          const checkIn = new Date(formData.checkInDate);
          const checkOut = new Date(formData.checkOutDate);
          if (checkOut <= checkIn) {
            errors.checkOutDate = 'Check-out must be after check-in';
          }
        }
        if (formData.numberOfRooms < 1 || formData.numberOfRooms > 5) {
          errors.numberOfRooms = 'Number of rooms must be between 1 and 5';
        }
        break;

      case 'attraction':
        if (!formData.preferredDate) {
          errors.preferredDate = 'Visit date is required';
        }
        if (formData.numberOfTickets < 1 || formData.numberOfTickets > 50) {
          errors.numberOfTickets = 'Number of tickets must be between 1 and 50';
        }
        break;

      case 'transportation':
        if (!formData.preferredDate) {
          errors.preferredDate = 'Travel date is required';
        }
        if (!formData.departureTime) {
          errors.departureTime = 'Departure time is required';
        }
        break;

      case 'entertainment':
        if (!formData.preferredDate) {
          errors.preferredDate = 'Event date is required';
        }
        if (!formData.preferredTime) {
          errors.preferredTime = 'Event time is required';
        }
        break;
    }

    // Validate dates are not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (formData.preferredDate && new Date(formData.preferredDate) < today) {
      errors.preferredDate = 'Date cannot be in the past';
    }
    
    if (formData.checkInDate && new Date(formData.checkInDate) < today) {
      errors.checkInDate = 'Check-in date cannot be in the past';
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

      if (category === 'dining') {
        // Use existing restaurant booking logic
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
          setError(result.error?.message || 'Booking failed');
        }
      } else {
        // Use travel booking orchestrator for other categories
        const bookingDetails: BookingDetails = {
          date: formData.preferredDate,
          partySize: formData.partySize,
          specialRequests: formData.specialRequests.trim() || undefined,
          
          // Category-specific details
          ...(category === 'accommodation' && {
            checkInDate: formData.checkInDate,
            checkOutDate: formData.checkOutDate,
            roomType: formData.roomType,
            numberOfRooms: formData.numberOfRooms
          }),
          
          ...(category === 'attraction' && {
            visitTime: formData.visitTime,
            ticketType: formData.ticketType,
            numberOfTickets: formData.numberOfTickets
          }),
          
          ...(category === 'transportation' && {
            departureTime: formData.departureTime,
            arrivalTime: formData.arrivalTime,
            transportationType: formData.transportationType as 'flight' | 'train' | 'bus' | 'car_rental' | 'taxi' | undefined
          }),
          
          ...(category === 'entertainment' && {
            preferredTime: formData.preferredTime
          })
        };

        const travelBookingRequest: TravelBookingRequest = {
          category,
          business,
          bookingDetails,
          userContact: contactInfo
        };

        const result = await coordinateTravelBooking(travelBookingRequest);
        setBookingResult(result);

        if (result.success && result.confirmationDetails) {
          setShowConfirmation(true);
          // Convert travel booking to BookingInfo format for compatibility
          const bookingInfo: BookingInfo = {
            confirmationId: result.bookingId!,
            restaurantName: result.confirmationDetails.businessName,
            restaurantId: result.confirmationDetails.businessId,
            date: result.confirmationDetails.details.date,
            time: result.confirmationDetails.details.preferredTime || '00:00',
            partySize: result.confirmationDetails.details.partySize,
            status: 'confirmed',
            userContact: result.confirmationDetails.userContact,
            specialRequests: result.confirmationDetails.details.specialRequests
          };
          onBookingComplete(bookingInfo);
        } else {
          setError(result.error?.message || 'Booking failed');
        }
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
  // CATEGORY-SPECIFIC HELPERS
  // =============================================================================

  const getModalTitle = (): string => {
    switch (category) {
      case 'dining':
        return 'Make a Reservation';
      case 'accommodation':
        return 'Book Accommodation';
      case 'attraction':
        return 'Purchase Tickets';
      case 'transportation':
        return 'Book Transportation';
      case 'entertainment':
        return 'Book Event Tickets';
      default:
        return 'Make a Booking';
    }
  };

  const getSubmitButtonText = (): string => {
    switch (category) {
      case 'dining':
        return 'Make Reservation';
      case 'accommodation':
        return 'Book Hotel';
      case 'attraction':
        return 'Purchase Tickets';
      case 'transportation':
        return 'Book Transport';
      case 'entertainment':
        return 'Book Tickets';
      default:
        return 'Complete Booking';
    }
  };

  // =============================================================================
  // RENDER HELPERS
  // =============================================================================

  const renderConfirmation = () => {
    if (!bookingResult?.success) return null;

    // Handle different response types
    const booking = 'bookingDetails' in bookingResult 
      ? bookingResult.bookingDetails 
      : 'confirmationDetails' in bookingResult 
        ? bookingResult.confirmationDetails 
        : null;
    
    if (!booking) return null;
    
    return (
      <div className="text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
          <p className="text-gray-600">
            {category === 'dining' ? `Your table has been reserved at ${business.name}` :
             category === 'accommodation' ? `Your room has been booked at ${business.name}` :
             category === 'attraction' ? `Your tickets have been purchased for ${business.name}` :
             category === 'transportation' ? `Your transportation has been booked with ${business.name}` :
             category === 'entertainment' ? `Your event tickets have been booked for ${business.name}` :
             `Your booking has been confirmed at ${business.name}`}
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h4 className="font-medium text-gray-900 mb-3">Booking Details</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Confirmation ID:</span>
              <span className="font-mono text-gray-900">
                {'confirmationId' in booking ? booking.confirmationId : booking.bookingId}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Restaurant:</span>
              <span className="text-gray-900">
                {'restaurantName' in booking ? booking.restaurantName : booking.businessName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="text-gray-900">
                {'date' in booking 
                  ? new Date(booking.date).toLocaleDateString()
                  : new Date(booking.details.date).toLocaleDateString()
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="text-gray-900">
                {'time' in booking 
                  ? booking.time
                  : booking.details.preferredTime || 'TBD'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Party Size:</span>
              <span className="text-gray-900">
                {'partySize' in booking 
                  ? booking.partySize
                  : booking.details.partySize
                } people
              </span>
            </div>
            {(('specialRequests' in booking && booking.specialRequests) || 
              ('details' in booking && booking.details.specialRequests)) && (
              <div className="flex justify-between">
                <span className="text-gray-600">Special Requests:</span>
                <span className="text-gray-900">
                  {'specialRequests' in booking 
                    ? booking.specialRequests
                    : 'details' in booking 
                      ? booking.details.specialRequests
                      : ''
                  }
                </span>
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
              {('alternativeTimes' in bookingResult && bookingResult.alternativeTimes && bookingResult.alternativeTimes.length > 0) && (
                <div>
                  <p className="text-sm text-red-700 mb-2">Try these available times:</p>
                  <div className="flex flex-wrap gap-2">
                    {('alternativeTimes' in bookingResult ? bookingResult.alternativeTimes : []).map((time) => (
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
              {('requiresPhoneCall' in bookingResult && bookingResult.requiresPhoneCall && 'phoneNumber' in bookingResult && bookingResult.phoneNumber) && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm text-red-700 mb-2">Call the restaurant directly:</p>
                  <button
                    onClick={() => window.open(`tel:${'phoneNumber' in bookingResult ? bookingResult.phoneNumber : ''}`, '_self')}
                    className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    Call {formatPhoneNumber('phoneNumber' in bookingResult ? bookingResult.phoneNumber || '' : '')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCategorySpecificFields = () => {
    switch (category) {
      case 'accommodation':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Accommodation Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date
                </label>
                <input
                  type="date"
                  value={formData.checkInDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkInDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.checkInDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.checkInDate && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.checkInDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Date
                </label>
                <input
                  type="date"
                  value={formData.checkOutDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, checkOutDate: e.target.value }))}
                  min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.checkOutDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.checkOutDate && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.checkOutDate}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Type
                </label>
                <select
                  value={formData.roomType}
                  onChange={(e) => setFormData(prev => ({ ...prev, roomType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Standard">Standard Room</option>
                  <option value="Deluxe">Deluxe Room</option>
                  <option value="Suite">Suite</option>
                  <option value="Family">Family Room</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Rooms
                </label>
                <select
                  value={formData.numberOfRooms}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfRooms: parseInt(e.target.value) }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.numberOfRooms ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {Array.from({ length: 5 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'room' : 'rooms'}</option>
                  ))}
                </select>
                {validationErrors.numberOfRooms && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.numberOfRooms}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'attraction':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Ticket Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Time
                </label>
                <select
                  value={formData.visitTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, visitTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const hour = 9 + i;
                    const time = `${hour.toString().padStart(2, '0')}:00`;
                    return (
                      <option key={time} value={time}>
                        {new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ticket Type
                </label>
                <select
                  value={formData.ticketType}
                  onChange={(e) => setFormData(prev => ({ ...prev, ticketType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="General Admission">General Admission</option>
                  <option value="Adult">Adult</option>
                  <option value="Child">Child</option>
                  <option value="Senior">Senior</option>
                  <option value="Student">Student</option>
                  <option value="Group">Group</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Tickets
                </label>
                <select
                  value={formData.numberOfTickets}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfTickets: parseInt(e.target.value) }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.numberOfTickets ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'ticket' : 'tickets'}</option>
                  ))}
                </select>
                {validationErrors.numberOfTickets && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.numberOfTickets}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 'transportation':
        return (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Transportation Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transportation Type
                </label>
                <select
                  value={formData.transportationType}
                  onChange={(e) => setFormData(prev => ({ ...prev, transportationType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="bus">Bus</option>
                  <option value="train">Train</option>
                  <option value="flight">Flight</option>
                  <option value="car_rental">Car Rental</option>
                  <option value="taxi">Taxi/Rideshare</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Departure Time
                </label>
                <input
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.departureTime ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {validationErrors.departureTime && (
                  <p className="text-red-600 text-sm mt-1">{validationErrors.departureTime}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arrival Time (Optional)
                </label>
                <input
                  type="time"
                  value={formData.arrivalTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, arrivalTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Category-specific fields */}
      {renderCategorySpecificFields()}
      
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
            getSubmitButtonText()
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
                {showConfirmation ? 'Booking Confirmed' : getModalTitle()}
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