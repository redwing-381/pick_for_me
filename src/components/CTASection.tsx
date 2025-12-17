'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function CTASection() {
  return (
    <div className="py-20 relative">
      {/* Decorative background elements */}
      <div className="absolute top-16 left-8 w-32 h-32 bg-teal-400 border-4 border-black opacity-10 -rotate-12 pointer-events-none"></div>
      <div className="absolute bottom-16 right-8 w-28 h-28 bg-purple-400 border-4 border-black opacity-10 rotate-45 pointer-events-none"></div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-black text-black mb-8">
          READY TO STOP
          <br />
          <span className="text-red-500">OVERTHINKING?</span>
        </h2>
        
        <p className="text-xl font-bold text-gray-700 mb-12">
          Join thousands of people who've already freed themselves from decision fatigue.
        </p>

        <Link href="/register">
          <Button
            size="lg"
            variant="primary"
            className="text-2xl font-black px-16 py-8 hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-4px] hover:translate-y-[-4px]"
          >
            LET AI DECIDE FOR ME
          </Button>
        </Link>
      </div>
    </div>
  );
}