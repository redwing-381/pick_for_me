// Authentication Context Provider with React Context and useReducer
'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { authService } from '../lib/auth-service';
import { 
  AuthState, 
  AuthContextType, 
  UserProfile, 
  ProfileData 
} from '../types/auth';
import { AuthError, AuthErrorCode } from '../lib/errors';
import { 
  storeUserSession, 
  getUserSession, 
  clearUserSession, 
  setupCrossTabSync 
} from '../lib/storage';
import { sessionManager } from '../lib/session-manager';
import { authAnalytics } from '../lib/auth-analytics';
// Offline auth removed
// Auth performance tracking removed

// Action types for useReducer
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: UserProfile | null }
  | { type: 'SET_ERROR'; payload: AuthError | null }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_SESSION_PERSISTED'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
  initialized: false,
  sessionPersisted: false,
};

// Reducer function
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_INITIALIZED':
      return { ...state, initialized: action.payload };
    case 'SET_SESSION_PERSISTED':
      return { ...state, sessionPersisted: action.payload };
    case 'RESET_STATE':
      return { ...initialState, initialized: true, loading: false };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Helper function to handle authentication errors
  const handleAuthError = (error: unknown) => {
    console.error('Authentication error:', error);
    
    // If it's already an AuthError, use it directly
    if (error instanceof AuthError) {
      dispatch({ type: 'SET_ERROR', payload: error });
      return;
    }
    
    // Try to convert from Firebase error or generic error
    const authError = AuthError.fromError(
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'AuthContext',
        action: 'handleAuthError',
      }
    );
    
    dispatch({ type: 'SET_ERROR', payload: authError });
  };

  // Helper function to clear error
  const clearError = () => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Login with email and password
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<void> => {
    // Performance measurement removed
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      
      const user = await authService.loginWithEmail(email, password);
      
      // Store session with remember me preference
      const sessionStored = storeUserSession(user, rememberMe);
      dispatch({ type: 'SET_SESSION_PERSISTED', payload: sessionStored });
      
      // Create enhanced session with analytics and extended duration for remember me
      const session = await sessionManager.createSession(
        user as any, 
        'email', 
        rememberMe
      );
      
      // Initialize offline capabilities with enhanced permissions for remembered sessions
      const permissions = rememberMe 
        ? ['view_profile', 'update_profile', 'access_protected'] 
        : ['view_profile', 'update_profile'];
      // Offline mode initialization removed
      
      // Track successful login with remember me flag
      authAnalytics.trackLogin(
        'email',
        true,
        0, // Performance duration removed
        session.sessionId,
        user.uid
      );
      
      // Track remember me usage for analytics
      if (rememberMe) {
        authAnalytics.trackEvent('login', {
          success: true,
          method: 'email',
          rememberMeEnabled: true,
          sessionId: session.sessionId,
          userId: user.uid
        }, session.sessionId, user.uid);
      }
      
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      // Track failed login
      authAnalytics.trackLogin(
        'email',
        false,
        0, // Performance duration removed
        undefined,
        undefined,
        error as AuthError
      );
      
      handleAuthError(error);
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Register with email and password
  const register = async (email: string, password: string, displayName?: string): Promise<void> => {
    // Performance measurement removed
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      
      const user = await authService.registerWithEmail(email, password, displayName);
      
      // Store session after registration
      const sessionStored = storeUserSession(user, false);
      dispatch({ type: 'SET_SESSION_PERSISTED', payload: sessionStored });
      
      // Create enhanced session
      const session = await sessionManager.createSession(user as any, 'email', false);
      
      // Offline capabilities removed
      
      // Track successful registration
      authAnalytics.trackRegistration(
        true,
        0, // Performance duration removed
        session.sessionId,
        user.uid
      );
      
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      // Track failed registration
      authAnalytics.trackRegistration(
        false,
        0, // Performance duration removed
        undefined,
        undefined,
        error as AuthError
      );
      
      handleAuthError(error);
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Login with Google OAuth
  const loginWithGoogle = async (): Promise<void> => {
    // Performance measurement removed
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      
      const user = await authService.loginWithGoogle();
      
      // Store session after OAuth login (default to remember OAuth users for better UX)
      const rememberMe = true;
      const sessionStored = storeUserSession(user, rememberMe);
      dispatch({ type: 'SET_SESSION_PERSISTED', payload: sessionStored });
      
      // Create enhanced session for OAuth login
      const session = await sessionManager.createSession(
        user as any, 
        'google', 
        rememberMe
      );
      
      // Offline capabilities removed
      
      // Track successful OAuth login
      authAnalytics.trackLogin(
        'google',
        true,
        0, // Performance duration removed
        session.sessionId,
        user.uid
      );
      
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      // Track failed OAuth login
      authAnalytics.trackLogin(
        'google',
        false,
        0, // Performance duration removed
        undefined,
        undefined,
        error as AuthError
      );
      
      handleAuthError(error);
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    const currentSession = sessionManager.getCurrentSession();
    const sessionDuration = currentSession 
      ? Date.now() - currentSession.startTime 
      : undefined;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      
      await authService.logout();
      
      // Clear stored session
      clearUserSession();
      
      // Clear enhanced session
      await sessionManager.clearSession();
      // Offline state clearing removed
      
      // Track logout
      authAnalytics.trackLogout(
        currentSession?.sessionId,
        state.user?.uid,
        sessionDuration
      );
      
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      // Even if logout fails, clear local state
      clearUserSession();
      await sessionManager.clearSession();
      // Offline state clearing removed
      
      // Track logout attempt
      authAnalytics.trackLogout(
        currentSession?.sessionId,
        state.user?.uid,
        sessionDuration
      );
      
      dispatch({ type: 'RESET_STATE' });
      handleAuthError(error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      
      await authService.resetPassword(email);
    } catch (error) {
      handleAuthError(error);
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Verify password reset code
  const verifyPasswordResetCode = async (code: string): Promise<string> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      
      return await authService.verifyPasswordResetCode(code);
    } catch (error) {
      handleAuthError(error);
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Confirm password reset
  const confirmPasswordReset = async (code: string, newPassword: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      
      await authService.confirmPasswordReset(code, newPassword);
      
      // Clear session after password reset (handled by auth service)
      clearUserSession();
      dispatch({ type: 'RESET_STATE' });
    } catch (error) {
      handleAuthError(error);
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update profile
  const updateProfile = async (data: ProfileData): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      
      await authService.updateUserProfile(data);
      
      // Get updated user profile
      const updatedUser = authService.getCurrentUser();
      if (updatedUser) {
        dispatch({ type: 'SET_USER', payload: updatedUser });
        
        // Update stored session
        storeUserSession(updatedUser, state.sessionPersisted);
      }
    } catch (error) {
      handleAuthError(error);
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update email
  const updateEmail = async (newEmail: string, currentPassword: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      
      await authService.updateUserEmail(newEmail, currentPassword);
      
      // Get updated user profile
      const updatedUser = authService.getCurrentUser();
      if (updatedUser) {
        dispatch({ type: 'SET_USER', payload: updatedUser });
        
        // Update stored session
        storeUserSession(updatedUser, state.sessionPersisted);
      }
    } catch (error) {
      handleAuthError(error);
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Update password
  const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      
      await authService.updateUserPassword(currentPassword, newPassword);
      
      // Password update doesn't change user profile, but we should refresh the user
      const updatedUser = authService.getCurrentUser();
      if (updatedUser) {
        dispatch({ type: 'SET_USER', payload: updatedUser });
        
        // Update stored session
        storeUserSession(updatedUser, state.sessionPersisted);
      }
    } catch (error) {
      handleAuthError(error);
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Send email verification
  const sendEmailVerification = async (): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      clearError();
      
      await authService.sendEmailVerification();
    } catch (error) {
      handleAuthError(error);
      throw error; // Re-throw for component handling
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Initialize authentication state
  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    let unsubscribeCrossTab: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        // Preload authentication components for better performance
        // authPerformance.preloadAuthComponents();
        
        // Check for stored session first
        const storedSession = getUserSession();
        if (storedSession) {
          dispatch({ type: 'SET_USER', payload: storedSession.user });
          dispatch({ type: 'SET_SESSION_PERSISTED', payload: true });
          
          // Restore enhanced session if available
          const currentSession = sessionManager.getCurrentSession();
          if (currentSession) {
            // Track session restoration
            authAnalytics.trackLogin(
              'restored',
              true,
              0,
              currentSession.sessionId,
              storedSession.user.uid
            );
            
            // Offline capabilities removed
          }
        }

        // Set up Firebase auth state listener
        unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            // Convert Firebase user to UserProfile
            const userProfile = authService.getCurrentUser();
            if (userProfile) {
              dispatch({ type: 'SET_USER', payload: userProfile });
              
              // Update stored session if it exists
              const existingSession = getUserSession();
              if (existingSession) {
                storeUserSession(userProfile, existingSession.rememberMe);
                dispatch({ type: 'SET_SESSION_PERSISTED', payload: true });
                
                // Update enhanced session
                await sessionManager.createSession(
                  firebaseUser,
                  'restored',
                  existingSession.rememberMe
                );
              }
            }
          } else {
            // User is signed out
            dispatch({ type: 'SET_USER', payload: null });
            clearUserSession();
            await sessionManager.clearSession();
            // Offline state clearing removed
            dispatch({ type: 'SET_SESSION_PERSISTED', payload: false });
          }
          
          if (!state.initialized) {
            dispatch({ type: 'SET_INITIALIZED', payload: true });
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        });

        // Set up cross-tab session synchronization
        unsubscribeCrossTab = setupCrossTabSync((user: any) => {
          dispatch({ type: 'SET_USER', payload: user });
        });

      } catch (error) {
        console.error('Failed to initialize auth:', error);
        authAnalytics.trackError(
          error as AuthError,
          'auth_initialization'
        );
        dispatch({ type: 'SET_INITIALIZED', payload: true });
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      if (unsubscribeAuth) {
        unsubscribeAuth();
      }
      if (unsubscribeCrossTab) {
        unsubscribeCrossTab();
      }
    };
  }, [state.initialized]);

  // Context value
  const contextValue: AuthContextType = {
    user: state.user,
    loading: state.loading,
    error: state.error?.userMessage || null,
    login: (email: string, password: string, rememberMe: boolean = false) => login(email, password, rememberMe),
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    verifyPasswordResetCode,
    confirmPasswordReset,
    updateProfile,
    updateEmail,
    updatePassword,
    sendEmailVerification,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// Export context for advanced usage
export { AuthContext };