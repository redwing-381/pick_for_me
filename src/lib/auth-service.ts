// Authentication service layer
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  signOut,
  User,
  UserCredential,
  AuthError as FirebaseAuthError,
} from 'firebase/auth';
import { auth } from './firebase';
import { UserProfile } from '../types/auth';
import { AuthError, AuthErrorCode } from './errors';
import { withNetworkRetry } from './network-utils';

export class AuthService {
  private googleProvider: GoogleAuthProvider;

  constructor() {
    this.googleProvider = new GoogleAuthProvider();
    // Configure Google provider with comprehensive scopes
    this.googleProvider.addScope('email');
    this.googleProvider.addScope('profile');
    
    // Configure additional OAuth settings
    this.googleProvider.setCustomParameters({
      prompt: 'select_account', // Always show account selection
      // hd can be set to restrict to specific domains (e.g., 'company.com')
    });
  }

  /**
   * Convert Firebase User to UserProfile
   */
  private mapFirebaseUserToProfile(user: User): UserProfile {
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
      providerId: user.providerData[0]?.providerId || 'email',
      createdAt: user.metadata.creationTime ? new Date(user.metadata.creationTime) : new Date(),
      lastLoginAt: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : new Date(),
    };
  }

  /**
   * Convert Firebase Auth Error to AuthError
   */
  private mapFirebaseError(error: FirebaseAuthError, context: Record<string, any> = {}): AuthError {
    return AuthError.fromFirebaseError(error, {
      component: 'AuthService',
      ...context,
    });
  }

  /**
   * Register user with email and password
   */
  async registerWithEmail(email: string, password: string, displayName?: string): Promise<UserProfile> {
    const registerWithRetry = withNetworkRetry(async () => {
      const result: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name if provided
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      // Send email verification
      await sendEmailVerification(result.user);
      
      return this.mapFirebaseUserToProfile(result.user);
    });

    try {
      return await registerWithRetry();
    } catch (error) {
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'registerWithEmail',
        email,
        displayName: !!displayName,
      });
    }
  }

  /**
   * Sign in with email and password
   */
  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    const loginWithRetry = withNetworkRetry(async () => {
      const result: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      return this.mapFirebaseUserToProfile(result.user);
    });

    try {
      return await loginWithRetry();
    } catch (error) {
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'loginWithEmail',
        email,
      });
    }
  }

  /**
   * Sign in with Google OAuth
   */
  async loginWithGoogle(): Promise<UserProfile> {
    const googleLoginWithRetry = withNetworkRetry(async () => {
      const result: UserCredential = await signInWithPopup(auth, this.googleProvider);
      
      // Check if this is a new user or existing user
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      // For new users, we might want to perform additional setup
      if (isNewUser) {
        console.log('New Google user registered:', result.user.email);
      }
      
      return this.mapFirebaseUserToProfile(result.user);
    });

    try {
      return await googleLoginWithRetry();
    } catch (error) {
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'loginWithGoogle',
      });
    }
  }

  /**
   * Sign in with Google OAuth using redirect (alternative to popup)
   */
  async loginWithGoogleRedirect(): Promise<void> {
    const redirectWithRetry = withNetworkRetry(async () => {
      const { signInWithRedirect } = await import('firebase/auth');
      await signInWithRedirect(auth, this.googleProvider);
      // Note: The result will be handled by getRedirectResult() after redirect
    });

    try {
      await redirectWithRetry();
    } catch (error) {
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'loginWithGoogleRedirect',
      });
    }
  }

  /**
   * Get redirect result after Google OAuth redirect
   */
  async getGoogleRedirectResult(): Promise<UserProfile | null> {
    const getRedirectWithRetry = withNetworkRetry(async () => {
      const { getRedirectResult } = await import('firebase/auth');
      const result = await getRedirectResult(auth);
      
      if (result && result.user) {
        return this.mapFirebaseUserToProfile(result.user);
      }
      
      return null;
    });

    try {
      return await getRedirectWithRetry();
    } catch (error) {
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'getGoogleRedirectResult',
      });
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<void> {
    const resetWithRetry = withNetworkRetry(async () => {
      await sendPasswordResetEmail(auth, email);
    });

    try {
      await resetWithRetry();
    } catch (error) {
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'resetPassword',
        email,
      });
    }
  }

  /**
   * Verify password reset code
   */
  async verifyPasswordResetCode(code: string): Promise<string> {
    const verifyWithRetry = withNetworkRetry(async () => {
      const email = await verifyPasswordResetCode(auth, code);
      return email;
    });

    try {
      return await verifyWithRetry();
    } catch (error) {
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'verifyPasswordResetCode',
        code,
      });
    }
  }

  /**
   * Confirm password reset with new password
   */
  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    const confirmWithRetry = withNetworkRetry(async () => {
      await confirmPasswordReset(auth, code, newPassword);
      
      // After successful password reset, sign out all sessions for security
      // This is handled automatically by Firebase, but we can ensure it
      if (auth.currentUser) {
        await signOut(auth);
      }
    });

    try {
      await confirmWithRetry();
    } catch (error) {
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'confirmPasswordReset',
        code,
      });
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(data: { displayName?: string; photoURL?: string }): Promise<void> {
    const updateProfileWithRetry = withNetworkRetry(async () => {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, data);
      } else {
        throw new Error('No authenticated user found');
      }
    });

    try {
      await updateProfileWithRetry();
    } catch (error) {
      if (error instanceof Error && error.message === 'No authenticated user found') {
        throw new AuthError(
          AuthErrorCode.SESSION_EXPIRED,
          'Please sign in again to update your profile.',
          'No authenticated user found',
        );
      }
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'updateUserProfile',
        data,
      });
    }
  }

  /**
   * Update user email (requires recent authentication)
   */
  async updateUserEmail(newEmail: string, currentPassword: string): Promise<void> {
    const updateEmailWithRetry = withNetworkRetry(async () => {
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      // Re-authenticate user before email change
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update email
      await updateEmail(auth.currentUser, newEmail);

      // Send verification email to new address
      await sendEmailVerification(auth.currentUser);
    });

    try {
      await updateEmailWithRetry();
    } catch (error) {
      if (error instanceof Error && error.message === 'No authenticated user found') {
        throw new AuthError(
          AuthErrorCode.SESSION_EXPIRED,
          'Please sign in again to update your email.',
          'No authenticated user found',
        );
      }
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'updateUserEmail',
        newEmail,
      });
    }
  }

  /**
   * Update user password (requires recent authentication)
   */
  async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    const updatePasswordWithRetry = withNetworkRetry(async () => {
      if (!auth.currentUser) {
        throw new Error('No authenticated user found');
      }

      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update password
      await updatePassword(auth.currentUser, newPassword);
    });

    try {
      await updatePasswordWithRetry();
    } catch (error) {
      if (error instanceof Error && error.message === 'No authenticated user found') {
        throw new AuthError(
          AuthErrorCode.SESSION_EXPIRED,
          'Please sign in again to update your password.',
          'No authenticated user found',
        );
      }
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'updateUserPassword',
      });
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<void> {
    const sendVerificationWithRetry = withNetworkRetry(async () => {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
      } else {
        throw new Error('No authenticated user found');
      }
    });

    try {
      await sendVerificationWithRetry();
    } catch (error) {
      if (error instanceof Error && error.message === 'No authenticated user found') {
        throw new AuthError(
          AuthErrorCode.SESSION_EXPIRED,
          'Please sign in again to send email verification.',
          'No authenticated user found',
        );
      }
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'sendEmailVerification',
      });
    }
  }

  /**
   * Sign out user
   */
  async logout(): Promise<void> {
    const logoutWithRetry = withNetworkRetry(async () => {
      await signOut(auth);
    });

    try {
      await logoutWithRetry();
    } catch (error) {
      throw this.mapFirebaseError(error as FirebaseAuthError, {
        action: 'logout',
      });
    }
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): UserProfile | null {
    if (auth.currentUser) {
      return this.mapFirebaseUserToProfile(auth.currentUser);
    }
    return null;
  }
}

// Export singleton instance
export const authService = new AuthService();