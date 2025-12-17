import { useEffect, useState, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { tokenManager, SessionData } from '../lib/token-manager';

export interface UseTokenManagerReturn {
  sessionData: SessionData | null;
  isTokenValid: boolean;
  isRefreshing: boolean;
  getToken: (forceRefresh?: boolean) => Promise<string | null>;
  refreshToken: () => Promise<void>;
  clearSession: () => Promise<void>;
  updateActivity: () => void;
  isSessionExpired: boolean;
}

export function useTokenManager(): UseTokenManagerReturn {
  const [user, setUser] = useState<User | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(
    tokenManager.getSession()
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return unsubscribe;
  }, []);

  // Initialize token manager when user changes
  useEffect(() => {
    const initializeTokenManager = async () => {
      try {
        await tokenManager.initialize(user);
      } catch (error) {
        console.error('Failed to initialize token manager:', error);
      }
    };

    initializeTokenManager();
  }, [user]);

  // Listen for session changes
  useEffect(() => {
    const unsubscribe = tokenManager.addListener((newSessionData) => {
      setSessionData(newSessionData);
    });

    return unsubscribe;
  }, []);

  // Check if current token is valid (not expired)
  const isTokenValid = useCallback((): boolean => {
    if (!sessionData) {
      return false;
    }

    const now = Date.now();
    return now < sessionData.tokenInfo.expirationTime;
  }, [sessionData]);

  // Get token with optional force refresh
  const getToken = useCallback(async (forceRefresh = false): Promise<string | null> => {
    try {
      setIsRefreshing(true);
      const token = await tokenManager.getToken(forceRefresh);
      return token;
    } catch (error) {
      console.error('Failed to get token:', error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Refresh token manually
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      setIsRefreshing(true);
      await tokenManager.refreshToken();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Clear session
  const clearSession = useCallback(async (): Promise<void> => {
    try {
      await tokenManager.clearSession();
    } catch (error) {
      console.error('Failed to clear session:', error);
      throw error;
    }
  }, []);

  // Update activity timestamp
  const updateActivity = useCallback((): void => {
    tokenManager.updateActivity();
  }, []);

  // Check if session is expired due to inactivity
  const isSessionExpired = tokenManager.isSessionExpired();

  return {
    sessionData,
    isTokenValid: isTokenValid(),
    isRefreshing,
    getToken,
    refreshToken,
    clearSession,
    updateActivity,
    isSessionExpired,
  };
}