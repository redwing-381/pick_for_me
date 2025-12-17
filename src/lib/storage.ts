// Session storage utilities for authentication
import { UserProfile } from '../types/auth';

const STORAGE_KEYS = {
  USER_SESSION: 'firebase_auth_user_session',
  REMEMBER_ME: 'firebase_auth_remember_me',
  LAST_LOGIN: 'firebase_auth_last_login',
} as const;

/**
 * Check if localStorage is available
 */
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely get item from localStorage
 */
function getStorageItem(key: string): string | null {
  if (!isStorageAvailable()) return null;
  
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/**
 * Safely set item in localStorage
 */
function setStorageItem(key: string, value: string): boolean {
  if (!isStorageAvailable()) return false;
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely remove item from localStorage
 */
function removeStorageItem(key: string): boolean {
  if (!isStorageAvailable()) return false;
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Store user session data
 */
export function storeUserSession(user: UserProfile, rememberMe: boolean = false): boolean {
  const sessionData = {
    user,
    timestamp: Date.now(),
    rememberMe,
  };

  const success = setStorageItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
  
  if (success && rememberMe) {
    setStorageItem(STORAGE_KEYS.REMEMBER_ME, 'true');
    setStorageItem(STORAGE_KEYS.LAST_LOGIN, new Date().toISOString());
  }

  return success;
}

/**
 * Retrieve user session data
 */
export function getUserSession(): { user: UserProfile; timestamp: number; rememberMe: boolean } | null {
  const sessionData = getStorageItem(STORAGE_KEYS.USER_SESSION);
  
  if (!sessionData) return null;

  try {
    const parsed = JSON.parse(sessionData);
    
    // Check if session is expired (24 hours for regular sessions, 30 days for remember me)
    const now = Date.now();
    const sessionAge = now - parsed.timestamp;
    const maxAge = parsed.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 24 hours
    
    if (sessionAge > maxAge) {
      clearUserSession();
      return null;
    }

    return parsed;
  } catch {
    clearUserSession();
    return null;
  }
}

/**
 * Clear user session data
 */
export function clearUserSession(): void {
  removeStorageItem(STORAGE_KEYS.USER_SESSION);
  removeStorageItem(STORAGE_KEYS.REMEMBER_ME);
}

/**
 * Check if user has remember me enabled
 */
export function hasRememberMe(): boolean {
  return getStorageItem(STORAGE_KEYS.REMEMBER_ME) === 'true';
}

/**
 * Get last login timestamp
 */
export function getLastLogin(): Date | null {
  const lastLogin = getStorageItem(STORAGE_KEYS.LAST_LOGIN);
  return lastLogin ? new Date(lastLogin) : null;
}

/**
 * Update user session with new data
 */
export function updateUserSession(user: UserProfile): boolean {
  const existingSession = getUserSession();
  
  if (!existingSession) return false;

  return storeUserSession(user, existingSession.rememberMe);
}

/**
 * Check if session is valid and not expired
 */
export function isSessionValid(): boolean {
  const session = getUserSession();
  return session !== null;
}

/**
 * Cross-tab session synchronization
 */
export function setupCrossTabSync(onSessionChange: (user: UserProfile | null) => void): () => void {
  if (!isStorageAvailable()) return () => {};

  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === STORAGE_KEYS.USER_SESSION) {
      if (event.newValue === null) {
        // Session was cleared
        onSessionChange(null);
      } else {
        // Session was updated
        const session = getUserSession();
        onSessionChange(session?.user || null);
      }
    }
  };

  window.addEventListener('storage', handleStorageChange);

  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}