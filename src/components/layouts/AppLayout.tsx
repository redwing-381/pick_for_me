'use client';

import { LogoutButton } from '@/components/auth/LogoutButton';
import { useAuth } from '@/hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with logout */}
      <header className="bg-white shadow-sm border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center">
                <span className="text-black font-black text-xl">🤖</span>
              </div>
              <div>
                <h1 className="text-2xl font-black text-black">Pick For Me</h1>
                <p className="text-sm font-bold text-gray-700">AI-Powered Decision Engine</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm font-bold text-gray-700">
                Welcome, {user?.displayName || user?.email}!
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}