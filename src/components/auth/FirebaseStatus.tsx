// Firebase status component for development
'use client';

import { useEffect, useState } from 'react';
import { getFirebaseStatus, logFirebaseStatus } from '../../lib/firebase-setup';

interface FirebaseStatusProps {
  showInProduction?: boolean;
}

export function FirebaseStatus({ showInProduction = false }: FirebaseStatusProps) {
  const [status, setStatus] = useState<{
    configured: boolean;
    emulatorMode: boolean;
    projectId: string | undefined;
    authDomain: string | undefined;
  } | null>(null);

  useEffect(() => {
    // Only show in development unless explicitly enabled for production
    if (process.env.NODE_ENV === 'production' && !showInProduction) {
      return;
    }

    const firebaseStatus = getFirebaseStatus();
    setStatus(firebaseStatus);
    logFirebaseStatus();
  }, [showInProduction]);

  // Don't render in production unless explicitly enabled
  if (process.env.NODE_ENV === 'production' && !showInProduction) {
    return null;
  }

  if (!status) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 max-w-sm z-50">
      <div className="font-bold text-sm mb-2">🔥 Firebase Status</div>
      
      <div className="space-y-1 text-xs">
        <div className="flex items-center gap-2">
          <span className={status.configured ? '✅' : '❌'}></span>
          <span>Configuration: {status.configured ? 'Ready' : 'Missing'}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={status.emulatorMode ? '🧪' : '🌐'}></span>
          <span>Mode: {status.emulatorMode ? 'Emulator' : 'Production'}</span>
        </div>
        
        {status.projectId && (
          <div className="flex items-center gap-2">
            <span>📋</span>
            <span>Project: {status.projectId}</span>
          </div>
        )}
      </div>
      
      {!status.configured && (
        <div className="mt-2 p-2 bg-yellow-100 border-2 border-yellow-400 text-xs">
          <div className="font-bold">Setup Required:</div>
          <div>Configure Firebase environment variables</div>
          <div className="text-blue-600 underline cursor-pointer" 
               onClick={() => window.open('/docs/FIREBASE_SETUP.md', '_blank')}>
            View Setup Guide
          </div>
        </div>
      )}
    </div>
  );
}