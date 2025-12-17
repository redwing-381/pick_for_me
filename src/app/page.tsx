'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { FeatureShowcase } from '@/components/FeatureShowcase';
import { CTASection } from '@/components/CTASection';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect to app if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push('/app');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-4 flex items-center justify-center animate-bounce">
            <span className="text-black font-black text-2xl">🤖</span>
          </div>
          <p className="text-lg font-bold text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  // Show landing page for unauthenticated users
  return (
    <div className="min-h-screen bg-[#f5f5f5] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-16 left-8 w-32 h-32 bg-teal-400 border-4 border-black opacity-10 -rotate-12 pointer-events-none"></div>
      <div className="absolute top-32 right-16 w-24 h-24 bg-yellow-400 border-4 border-black opacity-10 rotate-12 pointer-events-none"></div>
      <div className="absolute bottom-32 left-16 w-40 h-40 bg-red-400 border-4 border-black opacity-10 rotate-45 pointer-events-none"></div>
      <div className="absolute bottom-16 right-8 w-28 h-28 bg-purple-400 border-4 border-black opacity-10 -rotate-45 pointer-events-none"></div>

      <Header />
      
      <main className="relative z-10">
        <HeroSection />
        <FeatureShowcase />
        <CTASection />
      </main>
    </div>
  );
}