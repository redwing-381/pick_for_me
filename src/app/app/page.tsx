'use client';

import { useAuth } from '@/hooks/useAuth';
import { ConversationProvider } from '@/contexts/ConversationContext';
import ChatInterface from '@/components/ChatInterface';
import { AppLayout } from '@/components/layouts/AppLayout';
import { RequireEmailVerification } from '@/components/auth/RequireEmailVerification';
import SimpleLocationInput from '@/components/SimpleLocationInput';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Location } from '@/lib/types';

export default function AppPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showLocationInput, setShowLocationInput] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-4 flex items-center justify-center animate-bounce">
            <span className="text-black font-black text-2xl">🤖</span>
          </div>
          <p className="text-lg font-bold text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const handleLocationSet = (newLocation: Location) => {
    setLocation(newLocation);
    setLocationError(null);
    setShowLocationInput(false);
  };

  return (
    <AppLayout>
      <RequireEmailVerification message="Please verify your email to access the AI decision engine.">
        <ConversationProvider>
          <div className="space-y-4">
            {/* Location Bar */}
            <div className="bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-teal-400 border-4 border-black flex items-center justify-center">
                    <span className="text-black font-black text-xl">📍</span>
                  </div>
                  <div>
                    {location ? (
                      <>
                        <p className="text-sm font-black text-black">Location Set</p>
                        <p className="text-xs font-bold text-gray-700">{location.city}, {location.state}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-black text-black">No Location Set</p>
                        <p className="text-xs font-bold text-gray-700">Set your location for better results</p>
                      </>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowLocationInput(!showLocationInput)}
                  className="px-4 py-2 bg-teal-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all"
                >
                  {showLocationInput ? 'Hide' : location ? 'Change' : 'Set Location'}
                </button>
              </div>
              
              {showLocationInput && (
                <div className="mt-4 pt-4 border-t-4 border-black">
                  <SimpleLocationInput
                    onLocationSet={handleLocationSet}
                    currentLocation={location}
                  />
                </div>
              )}
            </div>

            {/* Chat Interface */}
            <div className="h-[calc(100vh-350px)] min-h-[500px]">
              <ChatInterface className="h-full" location={location} />
            </div>
          </div>
        </ConversationProvider>
      </RequireEmailVerification>
    </AppLayout>
  );
}