'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showRegisterLink?: boolean;
  showLoginLink?: boolean;
}

export function AuthLayout({ 
  children, 
  title, 
  subtitle, 
  showRegisterLink = false, 
  showLoginLink = false 
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f5] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-16 left-8 w-32 h-32 bg-teal-400 border-4 border-black opacity-10 -rotate-12 pointer-events-none"></div>
      <div className="absolute top-32 right-16 w-24 h-24 bg-yellow-400 border-4 border-black opacity-10 rotate-12 pointer-events-none"></div>
      <div className="absolute bottom-32 left-16 w-40 h-40 bg-red-400 border-4 border-black opacity-10 rotate-45 pointer-events-none"></div>
      <div className="absolute bottom-16 right-8 w-28 h-28 bg-purple-400 border-4 border-black opacity-10 -rotate-45 pointer-events-none"></div>

      {/* Header */}
      <header className="bg-white border-b-4 border-black relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <span className="text-black font-black text-2xl">🤖</span>
              </div>
              <div>
                <h1 className="text-3xl font-black text-black">Pick For Me</h1>
                <p className="text-lg font-bold text-gray-700">AI-Powered Decision Engine</p>
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              {showLoginLink && (
                <Link href="/login">
                  <Button variant="neutral" className="font-bold">
                    Sign In
                  </Button>
                </Link>
              )}
              {showRegisterLink && (
                <Link href="/register">
                  <Button variant="primary" className="font-bold">
                    Get Started
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-black text-black mb-2">{title}</h2>
              <p className="text-gray-700 font-bold">{subtitle}</p>
            </div>
            
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}