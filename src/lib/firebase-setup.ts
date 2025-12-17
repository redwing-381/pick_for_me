// Firebase setup utilities and helpers
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

/**
 * Check if Firebase is properly configured
 */
export function isFirebaseConfigured(): boolean {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  ];

  return requiredEnvVars.every(envVar => {
    const value = process.env[envVar];
    return value && value !== 'your_firebase_api_key_here' && value !== 'your_project_id_here';
  });
}

/**
 * Get Firebase configuration status
 */
export function getFirebaseStatus(): {
  configured: boolean;
  emulatorMode: boolean;
  projectId: string | undefined;
  authDomain: string | undefined;
} {
  return {
    configured: isFirebaseConfigured(),
    emulatorMode: process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true',
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  };
}

/**
 * Setup auth state listener
 */
export function setupAuthStateListener(
  callback: (user: User | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Wait for auth to be ready
 */
export function waitForAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Development helper to log Firebase status
 */
export function logFirebaseStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    const status = getFirebaseStatus();
    console.log('🔥 Firebase Status:', {
      configured: status.configured,
      emulatorMode: status.emulatorMode,
      projectId: status.projectId,
      authDomain: status.authDomain,
    });

    if (!status.configured) {
      console.warn('⚠️ Firebase not configured. Please set up your environment variables.');
      console.log('Required environment variables:');
      console.log('- NEXT_PUBLIC_FIREBASE_API_KEY');
      console.log('- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
      console.log('- NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      console.log('- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
      console.log('- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
      console.log('- NEXT_PUBLIC_FIREBASE_APP_ID');
    }

    if (status.emulatorMode) {
      console.log('🧪 Running in Firebase Emulator mode');
    }
  }
}