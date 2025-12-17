// Minimal storage utilities for session management
import { UserProfile } from '../types/auth';

interface StoredSession {
  user: UserProfile;
  rememberMe: boolean;
  timestamp: number;
}

const SESSION_KEY = 'auth_session';

export function storeUserSession(user: UserProfile, rememberMe: boolean): boolean {
  try {
    const session: StoredSession = {
      user,
      rememberMe,
      timestamp: Date.now()
    };
    
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch (error) {
    console.error('Failed to store session:', error);
    return false;
  }
}

export function getUserSession(): StoredSession | null {
  try {
    // Check both storages
    const localSession = localStorage.getItem(SESSION_KEY);
    const sessionSession = sessionStorage.getItem(SESSION_KEY);
    
    const sessionData = localSession || sessionSession;
    if (!sessionData) return null;
    
    return JSON.parse(sessionData) as StoredSession;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
}

export function clearUserSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
}

export function setupCrossTabSync(callback: (user: UserProfile | null) => void): () => void {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === SESSION_KEY) {
      if (event.newValue) {
        try {
          const session = JSON.parse(event.newValue) as StoredSession;
          callback(session.user);
        } catch (error) {
          console.error('Failed to parse session from storage event:', error);
        }
      } else {
        callback(null);
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}
