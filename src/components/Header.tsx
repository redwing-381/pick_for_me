'use client';

import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-white border-b-4 border-black relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
              <span className="text-black font-black text-2xl">🤖</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-black">Pick For Me</h1>
              <p className="text-lg font-bold text-gray-700">AI-Powered Decision Engine</p>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="neutral" className="font-bold">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" className="font-bold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}