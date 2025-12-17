'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';

export function CTASection() {
  return (
    <>
      {/* Use Cases Section */}
      <div className="py-20 bg-[#f5f5f5] relative">
        <div className="absolute top-16 left-8 w-32 h-32 bg-teal-400 border-4 border-black opacity-10 -rotate-12 pointer-events-none"></div>
        <div className="absolute bottom-16 right-8 w-28 h-28 bg-purple-400 border-4 border-black opacity-10 rotate-45 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-black text-center mb-16">
            BUILT FOR EVERY SCENARIO
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
              <h3 className="text-2xl font-black text-black mb-4">BUSINESS TRAVEL</h3>
              <p className="text-gray-700 font-bold mb-4">
                Find the perfect restaurant for client meetings, team dinners, or solo dining in unfamiliar cities.
              </p>
              <ul className="space-y-2 text-gray-700 font-bold">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>Location-aware recommendations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>Budget-conscious options</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>Professional atmosphere filtering</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
              <h3 className="text-2xl font-black text-black mb-4">LOCAL EXPLORATION</h3>
              <p className="text-gray-700 font-bold mb-4">
                Discover hidden gems in your own city or explore new neighborhoods with confidence.
              </p>
              <ul className="space-y-2 text-gray-700 font-bold">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>Personalized taste matching</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>Real-time availability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>Trending venue detection</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
              <h3 className="text-2xl font-black text-black mb-4">SPECIAL OCCASIONS</h3>
              <p className="text-gray-700 font-bold mb-4">
                Make every celebration memorable with venues perfectly suited for your special moments.
              </p>
              <ul className="space-y-2 text-gray-700 font-bold">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>Ambiance optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>Group size accommodation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>Dietary restriction handling</span>
                </li>
              </ul>
            </div>

            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
              <h3 className="text-2xl font-black text-black mb-4">QUICK DECISIONS</h3>
              <p className="text-gray-700 font-bold mb-4">
                When you need an answer now, get instant recommendations without the research overhead.
              </p>
              <ul className="space-y-2 text-gray-700 font-bold">
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>Sub-2-second responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>Context-aware suggestions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-400 font-black">✓</span>
                  <span>One-click booking integration</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="py-20 bg-gradient-to-br from-yellow-400 to-teal-400 border-t-4 border-b-4 border-black relative overflow-hidden">
        <div className="absolute top-8 left-16 w-32 h-32 bg-black opacity-5 rotate-12 pointer-events-none"></div>
        <div className="absolute bottom-8 right-16 w-40 h-40 bg-black opacity-5 -rotate-12 pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black text-black mb-8">
            READY TO MAKE
            <br />
            <span className="text-white">SMARTER DECISIONS?</span>
          </h2>
          
          <p className="text-xl font-bold text-black mb-8">
            Join thousands of professionals leveraging AI-powered decision intelligence
          </p>

          <div className="flex items-center justify-center gap-3 mb-12">
            <span className="text-black font-bold">Powered by</span>
            <div className="bg-white border-4 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <Image 
                src="/yelp_logo.png" 
                alt="Yelp API" 
                width={80} 
                height={30}
                className="object-contain"
              />
            </div>
          </div>

          <Link href="/register">
            <Button
              size="lg"
              variant="neutral"
              className="text-2xl font-black px-16 py-8 bg-white hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]"
            >
              START FREE TODAY
            </Button>
          </Link>

          <p className="text-sm font-bold text-black mt-6 opacity-80">
            No credit card required • Free forever • Enterprise plans available
          </p>
        </div>
      </div>
    </>
  );
}