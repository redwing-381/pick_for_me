'use client';

import { useAuth } from '@/hooks/useAuth';
import { PasswordReset } from '@/components/auth/PasswordReset';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ResetPasswordPage() {
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
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mx-auto mb-4 flex items-center justify-center animate-bounce">
            <span className="text-black font-black text-2xl">🤖</span>
          </div>
          <p className="text-lg font-bold text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is authenticated (will redirect)
  if (user) {
    return null;
  }

  return (
    <AuthLayout
      title="RESET PASSWORD"
      subtitle="Enter your email to receive a password reset link."
      showLoginLink={true}
      showRegisterLink={true}
    >
      <PasswordReset />
      
      <div className="mt-8 text-center">
        <p className="text-gray-700 font-bold">
          Remember your password?{' '}
          <Link 
            href="/login"
            className="text-blue-600 font-black hover:underline"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}