'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';

export function HeroSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
      <div className="text-center">
        <div className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-teal-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-6 sm:mb-8">
          <span className="text-black font-black text-sm sm:text-base lg:text-lg">AI-POWERED DECISION ENGINE</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-black mb-4 sm:mb-6 leading-tight px-2">
          INTELLIGENT DECISIONS
          <br />
          <span className="text-red-500">MADE SIMPLE</span>
        </h1>
        
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-gray-700 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
          Enterprise-grade AI that analyzes thousands of data points to deliver 
          the perfect recommendation. No more decision fatigue.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 px-4">
          <span className="text-gray-600 font-bold text-sm sm:text-base">Powered by</span>
          <div className="bg-white border-4 border-black px-3 sm:px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Image 
              src="/yelp_logo.png" 
              alt="Yelp API" 
              width={80} 
              height={30}
              className="object-contain w-16 sm:w-20 h-auto"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-stretch sm:items-center mb-12 sm:mb-16 px-4">
          <Link href="/register" className="w-full sm:w-auto">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base sm:text-lg lg:text-xl font-black px-8 sm:px-12 py-4 sm:py-6"
            >
              GET STARTED FREE
            </Button>
          </Link>
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="neutral"
              className="w-full sm:w-auto text-base sm:text-lg lg:text-xl font-black px-8 sm:px-12 py-4 sm:py-6"
            >
              SIGN IN
            </Button>
          </Link>
        </div>

        {/* How It Works Demo */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
          <h3 className="text-xl sm:text-2xl font-black text-black mb-4 sm:mb-6">HOW IT WORKS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-black font-black text-xl sm:text-2xl">1</span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-black mb-2">DEFINE YOUR NEEDS</h4>
              <p className="text-sm sm:text-base text-gray-700 font-bold">Describe what you're looking for in natural language</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-black font-black text-xl sm:text-2xl">2</span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-black mb-2">AI ANALYSIS</h4>
              <p className="text-sm sm:text-base text-gray-700 font-bold">Advanced algorithms process reviews, ratings, and preferences</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                <span className="text-black font-black text-xl sm:text-2xl">3</span>
              </div>
              <h4 className="text-base sm:text-lg font-black text-black mb-2">OPTIMAL RECOMMENDATION</h4>
              <p className="text-sm sm:text-base text-gray-700 font-bold">Receive data-driven suggestions tailored to your criteria</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}