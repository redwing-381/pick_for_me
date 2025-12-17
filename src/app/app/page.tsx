'use client';

import { useAuth } from '@/hooks/useAuth';
import { ConversationProvider } from '@/contexts/ConversationContext';
import ChatInterface from '@/components/ChatInterface';
import { AppLayout } from '@/components/layouts/AppLayout';
import { RequireEmailVerification } from '@/components/auth/RequireEmailVerification';
import SimpleLocationInput from '@/components/SimpleLocationInput';
import ConversationSidebar from '@/components/ConversationSidebar';
import BookingModal from '@/components/BookingModal';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Location, Business } from '@/lib/types';

export default function AppPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);

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
    setShowLocationInput(false);
  };

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    setBookingModalOpen(true);
  };

  const handleNewChat = () => {
    // Mock new chat - in real app would clear conversation
    window.location.reload();
  };

  return (
    <RequireEmailVerification message="Please verify your email to access the AI decision engine.">
      <ConversationProvider>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b-4 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                {/* Left: Menu + Logo */}
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="w-12 h-12 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center font-black text-xl"
                  >
                    ☰
                  </button>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                      <span className="text-black font-black text-xl">🤖</span>
                    </div>
                    <div>
                      <h1 className="text-2xl font-black text-black">Pick For Me</h1>
                      <p className="text-xs font-bold text-gray-700">AI-Powered Decision Engine</p>
                    </div>
                  </div>
                </div>

                {/* Right: Location + User */}
                <div className="flex items-center space-x-4">
                  {/* Location Display */}
                  <div className="flex items-center space-x-2 px-3 py-2 bg-teal-50 border-2 border-black">
                    <span className="text-lg">📍</span>
                    <div>
                      {location ? (
                        <p className="text-sm font-bold text-black">{location.city}</p>
                      ) : (
                        <button
                          onClick={() => setShowLocationInput(true)}
                          className="text-sm font-bold text-teal-600 hover:text-teal-800"
                        >
                          Set Location
                        </button>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="text-sm font-bold text-gray-700">
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Sidebar */}
          <ConversationSidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            onNewChat={handleNewChat}
          />

          {/* Booking Modal */}
          <BookingModal
            business={selectedBusiness}
            isOpen={bookingModalOpen}
            onClose={() => {
              setBookingModalOpen(false);
              setSelectedBusiness(null);
            }}
          />

          {/* Location Input Modal */}
          {showLocationInput && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
              <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-black text-black">Set Your Location</h2>
                  <button
                    onClick={() => setShowLocationInput(false)}
                    className="w-8 h-8 bg-black text-white font-black flex items-center justify-center hover:bg-gray-800"
                  >
                    ✕
                  </button>
                </div>
                <SimpleLocationInput
                  onLocationSet={handleLocationSet}
                  currentLocation={location}
                />
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 overflow-hidden">
            <ChatInterface 
              className="h-full" 
              location={location}
              onBusinessSelected={handleBusinessSelect}
            />
          </main>
        </div>
      </ConversationProvider>
    </RequireEmailVerification>
  );
}