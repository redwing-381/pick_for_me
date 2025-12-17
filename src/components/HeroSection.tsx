'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function HeroSection() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="text-center">
        <div className="inline-block px-6 py-3 bg-teal-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-8">
          <span className="text-black font-black text-lg">✨ AI DECIDES FOR YOU</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black text-black mb-6 leading-tight">
          STOP
          <br />
          <span className="text-red-500">OVERTHINKING</span>
          <br />
          DECISIONS
        </h1>
        
        <p className="text-xl md:text-2xl font-bold text-gray-700 mb-12 max-w-3xl mx-auto">
          Let our AI make the perfect choice for you. No more endless scrolling, 
          comparing, or decision fatigue. Just tell us what you need, and we'll pick the best option.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Link href="/register">
            <Button
              size="lg"
              variant="primary"
              className="text-xl font-black px-12 py-6"
            >
              START DECIDING FOR ME
            </Button>
          </Link>
          <Link href="/login">
            <Button
              size="lg"
              variant="neutral"
              className="text-xl font-black px-12 py-6"
            >
              I ALREADY HAVE AN ACCOUNT
            </Button>
          </Link>
        </div>

        {/* How It Works Demo */}
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 max-w-4xl mx-auto">
          <h3 className="text-2xl font-black text-black mb-6">HOW IT WORKS</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-4 flex items-center justify-center">
                <span className="text-black font-black text-2xl">1</span>
              </div>
              <h4 className="text-lg font-black text-black mb-2">TELL US WHAT YOU NEED</h4>
              <p className="text-gray-700 font-bold">"Pick a restaurant for dinner tonight"</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-4 flex items-center justify-center">
                <span className="text-black font-black text-2xl">2</span>
              </div>
              <h4 className="text-lg font-black text-black mb-2">AI ANALYZES OPTIONS</h4>
              <p className="text-gray-700 font-bold">We consider reviews, location, price, and your preferences</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-4 flex items-center justify-center">
                <span className="text-black font-black text-2xl">3</span>
              </div>
              <h4 className="text-lg font-black text-black mb-2">GET THE PERFECT CHOICE</h4>
              <p className="text-gray-700 font-bold">One recommendation, perfectly tailored to you</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}