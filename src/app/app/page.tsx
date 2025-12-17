'use client';

import { useAuth } from '@/hooks/useAuth';
import { ConversationProvider } from '@/contexts/ConversationContext';
import ChatInterface from '@/components/ChatInterface';
import { AppLayout } from '@/components/layouts/AppLayout';
import { RequireEmailVerification } from '@/components/auth/RequireEmailVerification';
import SimpleLocationInput from '@/components/SimpleLocationInput';
import ConversationSidebar from '@/components/ConversationSidebar';
import BookingModal from '@/components/BookingModal';
import SmartInsightsPanel from '@/components/SmartInsightsPanel';
import OnboardingQuestionnaire from '@/components/OnboardingQuestionnaire';
import { GridBackground } from '@/components/ui/GridBackground';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Location, Business, UserPreferences } from '@/lib/types';

export default function AppPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [location, setLocation] = useState<Location | null>(null);
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [insightsPanelOpen, setInsightsPanelOpen] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  // Check if user has completed onboarding
  useEffect(() => {
    if (user) {
      const hasCompletedOnboarding = localStorage.getItem(`onboarding_${user.uid}`);
      const savedPreferences = localStorage.getItem(`preferences_${user.uid}`);
      
      if (savedPreferences) {
        setUserPreferences(JSON.parse(savedPreferences));
      }
      
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <GridBackground className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-yellow-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mx-auto mb-6 flex items-center justify-center animate-pulse p-3">
            <img 
              src="/logo.png" 
              alt="Pick For Me Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xl font-bold text-black mb-4">Loading your AI assistant...</p>
          <Progress value={66} className="w-full" />
        </div>
      </GridBackground>
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

  const handleOnboardingComplete = (preferences: UserPreferences) => {
    if (user) {
      // Save preferences to localStorage
      localStorage.setItem(`preferences_${user.uid}`, JSON.stringify(preferences));
      localStorage.setItem(`onboarding_${user.uid}`, 'true');
      
      setUserPreferences(preferences);
      setShowOnboarding(false);
    }
  };

  const getUserName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Friend';
  };

  return (
    <RequireEmailVerification message="Please verify your email to access the AI decision engine.">
      <ConversationProvider>
        <GridBackground className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b-4 border-black shadow-[0px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between gap-2">
                {/* Left: Menu + Logo */}
                <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center flex-shrink-0"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center flex-shrink-0 p-1.5 sm:p-2">
                      <img 
                        src="/logo.png" 
                        alt="Pick For Me Logo" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="hidden sm:block min-w-0">
                      <h1 className="text-lg sm:text-2xl font-black text-black truncate">Pick For Me</h1>
                      <p className="text-xs font-bold text-gray-700 hidden lg:block">AI-Powered Decision Engine</p>
                    </div>
                  </div>
                </div>

                {/* Right: Location + Insights */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Location Display - Hidden on mobile, shown on tablet+ */}
                  <div className="hidden md:flex items-center space-x-2 px-2 sm:px-3 py-2 bg-teal-50 border-2 border-black">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-black flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="min-w-0">
                      {location ? (
                        <p className="text-xs sm:text-sm font-bold text-black truncate">{location.city}</p>
                      ) : (
                        <button
                          onClick={() => setShowLocationInput(true)}
                          className="text-xs sm:text-sm font-bold text-teal-600 hover:text-teal-800 whitespace-nowrap"
                        >
                          Set Location
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Smart Insights Button */}
                  <button
                    onClick={() => setInsightsPanelOpen(true)}
                    className="px-2 sm:px-4 py-2 bg-purple-400 text-black font-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center space-x-1 sm:space-x-2"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="hidden sm:inline text-sm">INSIGHTS</span>
                  </button>
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

          {/* Smart Insights Panel */}
          <SmartInsightsPanel
            isOpen={insightsPanelOpen}
            onClose={() => setInsightsPanelOpen(false)}
          />

          {/* Quick Actions Floating Button */}
          <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-30">
            {quickActionsOpen && (
              <div className="absolute bottom-14 sm:bottom-16 right-0 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-3 sm:p-4 w-56 sm:w-64 space-y-2 animate-fade-in max-h-[60vh] overflow-y-auto">
                <button 
                  onClick={() => {
                    setQuickActionsOpen(false);
                    const event = new CustomEvent('quickAction', { detail: 'Surprise me with a highly rated restaurant nearby!' });
                    window.dispatchEvent(event);
                  }}
                  className="w-full px-4 py-3 bg-teal-400 text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left flex items-center space-x-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Surprise Me!</span>
                </button>
                <button 
                  onClick={() => {
                    setQuickActionsOpen(false);
                    const event = new CustomEvent('quickAction', { detail: 'Find a romantic restaurant perfect for a date night' });
                    window.dispatchEvent(event);
                  }}
                  className="w-full px-4 py-3 bg-yellow-400 text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left flex items-center space-x-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Plan Date Night</span>
                </button>
                <button 
                  onClick={() => {
                    setQuickActionsOpen(false);
                    const event = new CustomEvent('quickAction', { detail: 'Suggest a place good for groups of 6-8 people' });
                    window.dispatchEvent(event);
                  }}
                  className="w-full px-4 py-3 bg-pink-400 text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left flex items-center space-x-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>Group Outing</span>
                </button>
                <button 
                  onClick={() => {
                    setQuickActionsOpen(false);
                    const event = new CustomEvent('quickAction', { detail: 'Find great restaurants under $30 per person' });
                    window.dispatchEvent(event);
                  }}
                  className="w-full px-4 py-3 bg-blue-400 text-black font-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all text-left flex items-center space-x-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Budget Finder</span>
                </button>
              </div>
            )}
            <button
              onClick={() => setQuickActionsOpen(!quickActionsOpen)}
              className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-yellow-400 to-orange-400 text-black font-black text-2xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center justify-center rounded-full"
            >
              {quickActionsOpen ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Location Input Modal */}
          {showLocationInput && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
              <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-4 sm:p-6 mx-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-black text-black">SET YOUR LOCATION</h2>
                  <button
                    onClick={() => setShowLocationInput(false)}
                    className="w-8 h-8 bg-black text-white font-black flex items-center justify-center hover:bg-gray-800 flex-shrink-0"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <SimpleLocationInput
                  onLocationSet={handleLocationSet}
                  currentLocation={location}
                />
              </div>
            </div>
          )}

          {/* Onboarding Questionnaire */}
          {showOnboarding && (
            <OnboardingQuestionnaire
              userName={getUserName()}
              onComplete={handleOnboardingComplete}
            />
          )}

          {/* Main Chat Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 py-4 sm:py-6 overflow-hidden">
            <ChatInterface 
              className="h-full" 
              location={location}
              userPreferences={userPreferences || undefined}
              onBusinessSelected={handleBusinessSelect}
            />
          </main>
        </GridBackground>
      </ConversationProvider>
    </RequireEmailVerification>
  );
}