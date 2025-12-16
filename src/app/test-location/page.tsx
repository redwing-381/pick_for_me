'use client';

import { useState } from 'react';
import LocationInput from '@/components/LocationInput';
import type { Location } from '@/lib/types';

export default function TestLocationPage() {
  const [location, setLocation] = useState<Location | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocationChange = ({ location: newLocation, error: newError }: { location: Location | null; error: string | null }) => {
    console.log('Location changed:', { location: newLocation, error: newError });
    setLocation(newLocation);
    setError(newError);
    setIsDetecting(false);
  };

  const handleDetectLocation = () => {
    console.log('Starting location detection...');
    setIsDetecting(true);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Location Input Test</h1>
        
        <LocationInput
          onLocationChange={handleLocationChange}
          currentLocation={location}
          isDetecting={isDetecting}
          error={error}
          onDetectLocation={handleDetectLocation}
        />

        {/* Debug Information */}
        <div className="mt-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Debug Information</h2>
          
          <div className="space-y-2">
            <div>
              <strong>Geolocation Support:</strong> {typeof navigator !== 'undefined' && navigator.geolocation ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Is HTTPS:</strong> {typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Is Detecting:</strong> {isDetecting ? 'Yes' : 'No'}
            </div>
            
            {error && (
              <div>
                <strong>Error:</strong> <span className="text-red-600">{error}</span>
              </div>
            )}
            
            {location && (
              <div>
                <strong>Current Location:</strong>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-sm">
                  {JSON.stringify(location, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Direct Geolocation Test */}
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={() => {
                console.log('Testing direct geolocation...');
                if (typeof navigator !== 'undefined' && navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      console.log('Direct geolocation success:', position);
                      alert(`Direct test success: ${position.coords.latitude}, ${position.coords.longitude}`);
                    },
                    (error) => {
                      console.log('Direct geolocation error:', error);
                      alert(`Direct test error: ${error.message}`);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
                  );
                } else {
                  alert('Geolocation not supported');
                }
              }}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Direct Geolocation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}