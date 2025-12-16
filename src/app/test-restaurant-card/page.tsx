'use client';

import { useState } from 'react';
import RestaurantCard from '@/components/RestaurantCard';
import type { Business } from '@/lib/types';

export default function TestRestaurantCardPage() {
  const [selectedRestaurant, setSelectedRestaurant] = useState<Business | null>(null);

  // Sample restaurant data
  const sampleRestaurants: Business[] = [
    {
      id: 'sample-restaurant-1',
      name: 'The Perfect Italian Kitchen',
      rating: 4.5,
      review_count: 324,
      price: '$$',
      categories: [
        { alias: 'italian', title: 'Italian' },
        { alias: 'pizza', title: 'Pizza' }
      ],
      location: {
        address1: '123 Main St',
        address2: 'Suite 100',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94102',
        country: 'US',
        display_address: ['123 Main St', 'Suite 100', 'San Francisco, CA 94102']
      },
      coordinates: {
        latitude: 37.7749,
        longitude: -122.4194
      },
      photos: [
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600'
      ],
      phone: '+14155551234',
      display_phone: '(415) 555-1234',
      url: 'https://www.yelp.com/biz/the-perfect-italian-kitchen',
      image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600',
      is_closed: false,
      distance: 0.5,
      transactions: ['restaurant_reservation', 'delivery', 'pickup'],
      reservationUrl: 'https://www.yelp.com/reservations/the-perfect-italian-kitchen',
      hours: [{
        open: [
          { is_overnight: false, start: '1100', end: '2200', day: 0 },
          { is_overnight: false, start: '1100', end: '2200', day: 1 },
          { is_overnight: false, start: '1100', end: '2200', day: 2 },
          { is_overnight: false, start: '1100', end: '2200', day: 3 },
          { is_overnight: false, start: '1100', end: '2300', day: 4 },
          { is_overnight: false, start: '1100', end: '2300', day: 5 },
          { is_overnight: false, start: '1000', end: '2200', day: 6 }
        ],
        hours_type: 'REGULAR',
        is_open_now: true
      }]
    },
    {
      id: 'sample-restaurant-2',
      name: 'Budget Burger Joint',
      rating: 3.8,
      review_count: 156,
      price: '$',
      categories: [
        { alias: 'burgers', title: 'Burgers' },
        { alias: 'american', title: 'American' }
      ],
      location: {
        address1: '456 Oak Ave',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94103',
        country: 'US',
        display_address: ['456 Oak Ave', 'San Francisco, CA 94103']
      },
      coordinates: {
        latitude: 37.7849,
        longitude: -122.4094
      },
      photos: [
        'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600'
      ],
      phone: '+14155555678',
      display_phone: '(415) 555-5678',
      url: 'https://www.yelp.com/biz/budget-burger-joint',
      image_url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600',
      is_closed: false,
      distance: 1.2,
      transactions: ['pickup', 'delivery'],
      hours: [{
        open: [
          { is_overnight: false, start: '1000', end: '2200', day: 0 },
          { is_overnight: false, start: '1000', end: '2200', day: 1 },
          { is_overnight: false, start: '1000', end: '2200', day: 2 },
          { is_overnight: false, start: '1000', end: '2200', day: 3 },
          { is_overnight: false, start: '1000', end: '2300', day: 4 },
          { is_overnight: false, start: '1000', end: '2300', day: 5 },
          { is_overnight: false, start: '1000', end: '2200', day: 6 }
        ],
        hours_type: 'REGULAR',
        is_open_now: true
      }]
    },
    {
      id: 'sample-restaurant-3',
      name: 'Upscale French Bistro',
      rating: 4.8,
      review_count: 89,
      price: '$$$',
      categories: [
        { alias: 'french', title: 'French' },
        { alias: 'bistros', title: 'Bistros' }
      ],
      location: {
        address1: '789 Pine St',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94108',
        country: 'US',
        display_address: ['789 Pine St', 'San Francisco, CA 94108']
      },
      coordinates: {
        latitude: 37.7849,
        longitude: -122.4094
      },
      photos: [
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
        'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=600'
      ],
      phone: '+14155559999',
      display_phone: '(415) 555-9999',
      url: 'https://www.yelp.com/biz/upscale-french-bistro',
      image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
      is_closed: true,
      distance: 0.8,
      transactions: ['restaurant_reservation'],
      hours: [{
        open: [
          { is_overnight: false, start: '1700', end: '2200', day: 0 },
          { is_overnight: false, start: '1700', end: '2200', day: 1 },
          { is_overnight: false, start: '1700', end: '2200', day: 2 },
          { is_overnight: false, start: '1700', end: '2200', day: 3 },
          { is_overnight: false, start: '1700', end: '2300', day: 4 },
          { is_overnight: false, start: '1700', end: '2300', day: 5 },
          { is_overnight: false, start: '1700', end: '2200', day: 6 }
        ],
        hours_type: 'REGULAR',
        is_open_now: false
      }]
    }
  ];

  const handleBooking = (restaurant: Business) => {
    alert(`Booking reservation at ${restaurant.name}`);
  };

  const handleSelection = (restaurant: Business) => {
    setSelectedRestaurant(restaurant);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Restaurant Card Component Test
        </h1>

        {/* Compact Variant */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Compact Variant</h2>
          <div className="space-y-4">
            {sampleRestaurants.map((restaurant) => (
              <RestaurantCard
                key={`compact-${restaurant.id}`}
                restaurant={restaurant}
                variant="compact"
                onBook={handleBooking}
                onSelect={handleSelection}
                isSelected={selectedRestaurant?.id === restaurant.id}
              />
            ))}
          </div>
        </section>

        {/* Default Variant */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Default Variant</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sampleRestaurants.map((restaurant) => (
              <RestaurantCard
                key={`default-${restaurant.id}`}
                restaurant={restaurant}
                variant="default"
                onBook={handleBooking}
                onSelect={handleSelection}
                isSelected={selectedRestaurant?.id === restaurant.id}
              />
            ))}
          </div>
        </section>

        {/* Detailed Variant */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Detailed Variant</h2>
          <div className="space-y-8">
            {sampleRestaurants.map((restaurant) => (
              <RestaurantCard
                key={`detailed-${restaurant.id}`}
                restaurant={restaurant}
                variant="detailed"
                onBook={handleBooking}
                onSelect={handleSelection}
                isSelected={selectedRestaurant?.id === restaurant.id}
              />
            ))}
          </div>
        </section>

        {/* Selected Restaurant Info */}
        {selectedRestaurant && (
          <section className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Selected Restaurant</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900">{selectedRestaurant.name}</h3>
              <p className="text-blue-700">
                {selectedRestaurant.categories.map(c => c.title).join(', ')} • {selectedRestaurant.price}
              </p>
              <p className="text-blue-600 text-sm mt-1">
                {selectedRestaurant.location.display_address.join(', ')}
              </p>
            </div>
          </section>
        )}

        {/* Feature Showcase */}
        <section className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Features Demonstrated</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📱 Responsive Design</h3>
              <p className="text-sm text-gray-600">Cards adapt to different screen sizes and layouts</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🖼️ Image Handling</h3>
              <p className="text-sm text-gray-600">Graceful fallbacks for missing images and photo galleries</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📍 Location Integration</h3>
              <p className="text-sm text-gray-600">Google Maps integration for directions</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">📞 Contact Actions</h3>
              <p className="text-sm text-gray-600">Direct calling and website links</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🕒 Hours Display</h3>
              <p className="text-sm text-gray-600">Formatted business hours with open/closed status</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Interactive Elements</h3>
              <p className="text-sm text-gray-600">Booking buttons, selection states, and hover effects</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}