'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { FeatureShowcase } from '@/components/FeatureShowcase';
import { CTASection } from '@/components/CTASection';
import { Footer } from '@/components/Footer';
import { GridBackground } from '@/components/ui/GridBackground';
import { Progress } from '@/components/ui/progress';

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
      <GridBackground className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-yellow-400 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mx-auto mb-6 flex items-center justify-center animate-pulse p-3">
            <img 
              src="/logo.png" 
              alt="Pick For Me Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xl font-bold text-black mb-4">Loading Pick For Me...</p>
          <Progress value={66} className="w-full" />
        </div>
      </GridBackground>
    );
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  // Show landing page for unauthenticated users
  return (
    <GridBackground className="min-h-screen bg-[#f5f5f5] relative overflow-hidden">
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
      
      <Footer />
    </GridBackground>
  );
}