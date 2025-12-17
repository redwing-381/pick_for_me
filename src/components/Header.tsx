'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white border-b-4 border-black relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 sm:py-6">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center flex-shrink-0 p-2">
              <img 
                src="/logo.png" 
                alt="Pick For Me Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl sm:text-3xl font-black text-black">Pick For Me</h1>
              <p className="text-xs sm:text-sm font-bold text-gray-700">AI-Powered Decision Intelligence</p>
            </div>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link href="/login">
              <Button variant="neutral" className="font-bold text-sm sm:text-base px-3 sm:px-4 py-2">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="font-bold text-sm sm:text-base px-3 sm:px-4 py-2">
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}