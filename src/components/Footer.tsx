'use client';

import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-black border-t-4 border-black py-8 sm:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg sm:text-xl font-black text-yellow-400 mb-3 sm:mb-4">PICK FOR ME</h3>
            <p className="text-white font-bold text-xs sm:text-sm mb-3 sm:mb-4">
              AI-powered decision intelligence platform for professionals.
            </p>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-xs sm:text-sm">Powered by</span>
              <div className="bg-white border-2 border-white px-2 py-1">
                <Image 
                  src="/yelp_logo.png" 
                  alt="Yelp API" 
                  width={60} 
                  height={20}
                  className="object-contain w-12 sm:w-15 h-auto"
                />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-black text-white mb-3 sm:mb-4">PRODUCT</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/register" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors">
                  Get Started
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-black text-white mb-3 sm:mb-4">COMPANY</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-base sm:text-lg font-black text-white mb-3 sm:mb-4">LEGAL</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                  GDPR
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-gray-800 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 font-bold text-xs sm:text-sm text-center sm:text-left">
              © 2024 Pick For Me. All rights reserved.
            </p>
            <div className="flex gap-4 sm:gap-6">
              <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                Twitter
              </Link>
              <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                LinkedIn
              </Link>
              <Link href="/" className="text-gray-400 font-bold text-xs sm:text-sm hover:text-yellow-400 transition-colors cursor-pointer">
                GitHub
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
