'use client';

import { useState } from 'react';
import type { Business } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';

interface BookingModalProps {
  business: Business | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function BookingModal({ business, isOpen, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [formData, setFormData] = useState({
    name: '',
    email: user?.email || '',
    phone: '',
    date: '',
    time: '',
    guests: '2',
    specialRequests: ''
  });

  if (!isOpen || !business) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock booking - just show success
    setStep('success');
    
    // Reset after 3 seconds
    setTimeout(() => {
      setStep('form');
      onClose();
    }, 3000);
  };

  const handleClose = () => {
    setStep('form');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {step === 'form' ? (
          <>
            {/* Header */}
            <div className="p-6 border-b-4 border-black bg-teal-400">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-black mb-1">Make a Reservation</h2>
                  <p className="text-sm font-bold text-black">{business.name}</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-10 h-10 bg-black text-teal-400 font-black text-xl flex items-center justify-center hover:bg-gray-800 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Business Info */}
            <div className="p-6 border-b-4 border-black bg-yellow-50">
              <div className="flex items-start space-x-4">
                {business.image_url && (
                  <img
                    src={business.image_url}
                    alt={business.name}
                    className="w-24 h-24 object-cover border-2 border-black"
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-yellow-400 font-black text-lg">★</span>
                    <span className="text-sm font-bold text-black">
                      {business.rating} ({business.review_count} reviews)
                    </span>
                    {business.price && (
                      <span className="text-sm font-black text-teal-600">{business.price}</span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-gray-700 mb-2">
                    {business.categories?.map(c => c.title).join(', ')}
                  </p>
                  <p className="text-xs font-bold text-gray-600">
                    📍 {business.location?.display_address?.join(', ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Guests */}
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Number of Guests *
                  </label>
                  <select
                    required
                    value={formData.guests}
                    onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                    className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  />
                </div>

                {/* Time */}
                <div>
                  <label className="block text-sm font-black text-black mb-2">
                    Time *
                  </label>
                  <select
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  >
                    <option value="">Select time</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="11:30">11:30 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="12:30">12:30 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="13:30">1:30 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                    <option value="18:30">6:30 PM</option>
                    <option value="19:00">7:00 PM</option>
                    <option value="19:30">7:30 PM</option>
                    <option value="20:00">8:00 PM</option>
                    <option value="20:30">8:30 PM</option>
                    <option value="21:00">9:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-black text-black mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-4 border-black font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400"
                  placeholder="Dietary restrictions, seating preferences, etc."
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-6 py-3 bg-white text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-teal-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Success State */
          <div className="p-12 text-center">
            <div className="w-24 h-24 bg-teal-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-6 flex items-center justify-center animate-bounce">
              <span className="text-5xl">✓</span>
            </div>
            <h2 className="text-3xl font-black text-black mb-3">Reservation Confirmed!</h2>
            <p className="text-lg font-bold text-gray-700 mb-6">
              Your reservation at <span className="text-teal-600">{business.name}</span> has been confirmed.
            </p>
            <div className="bg-yellow-50 border-4 border-black p-6 mb-6 text-left">
              <h3 className="text-lg font-black text-black mb-3">Reservation Details</h3>
              <div className="space-y-2 text-sm font-bold text-gray-700">
                <p>📅 Date: {formData.date}</p>
                <p>🕐 Time: {formData.time}</p>
                <p>👥 Guests: {formData.guests}</p>
                <p>📧 Confirmation sent to: {formData.email}</p>
              </div>
            </div>
            <p className="text-sm font-bold text-gray-600">
              A confirmation email has been sent to your inbox.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
