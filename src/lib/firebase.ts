// Firebase configuration and initialization
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase app (singleton pattern)
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth
export const auth: Auth = getAuth(app);

// Connect to Firebase Auth emulator in development
if (
  process.env.NODE_ENV === 'development' && 
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true'
) {
  const emulatorHost = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST || 'localhost';
  const emulatorPort = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT || '9099';
  
  try {
    // Only connect if not already connected
    if (!(auth as any)._delegate?._config?.emulator) {
      connectAuthEmulator(auth, `http://${emulatorHost}:${emulatorPort}`, {
        disableWarnings: true
      });
      console.log('🔥 Connected to Firebase Auth Emulator');
    }
  } catch (error) {
    console.warn('Failed to connect to Firebase Auth Emulator:', error);
  }
} else {
  console.log('🔥 Using Firebase Production Auth');
}

export default app;