// Firebase Authentication Service
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode,
  updateProfile as firebaseUpdateProfile,
  updateEmail as firebaseUpdateEmail,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendEmailVerification,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { UserProfile, ProfileData } from '../types/auth';

class AuthService {
  // Convert Firebase User to UserProfile
  mapFirebaseUserToProfile(firebaseUser: FirebaseUser): UserProfile {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || null,
      photoURL: firebaseUser.photoURL || null,
      emailVerified: firebaseUser.emailVerified,
      phoneNumber: firebaseUser.phoneNumber || null,
      providerId: firebaseUser.providerId || 'firebase',
      createdAt: firebaseUser.metadata.creationTime 
        ? new Date(firebaseUser.metadata.creationTime) 
        : new Date(),
      lastLoginAt: firebaseUser.metadata.lastSignInTime 
        ? new Date(firebaseUser.metadata.lastSignInTime) 
        : new Date(),
    };
  }

  // Get current user
  getCurrentUser(): UserProfile | null {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    return this.mapFirebaseUserToProfile(firebaseUser);
  }

  // Login with email and password
  async loginWithEmail(email: string, password: string): Promise<UserProfile> {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return this.mapFirebaseUserToProfile(result.user);
  }

  // Register with email and password
  async registerWithEmail(
    email: string,
    password: string,
    displayName?: string
  ): Promise<UserProfile> {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update profile with display name if provided
    if (displayName && result.user) {
      await firebaseUpdateProfile(result.user, { displayName });
    }
    
    // Send email verification
    await sendEmailVerification(result.user);
    
    return this.mapFirebaseUserToProfile(result.user);
  }

  // Login with Google
  async loginWithGoogle(): Promise<UserProfile> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return this.mapFirebaseUserToProfile(result.user);
  }

  // Logout
  async logout(): Promise<void> {
    await signOut(auth);
  }

  // Reset password
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  // Verify password reset code
  async verifyPasswordResetCode(code: string): Promise<string> {
    return await firebaseVerifyPasswordResetCode(auth, code);
  }

  // Confirm password reset
  async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    await firebaseConfirmPasswordReset(auth, code, newPassword);
  }

  // Update user profile
  async updateUserProfile(data: ProfileData): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    
    await firebaseUpdateProfile(user, {
      displayName: data.displayName,
      photoURL: data.photoURL,
    });
  }

  // Update user email
  async updateUserEmail(newEmail: string, currentPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No authenticated user');
    
    // Reauthenticate before email update
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update email
    await firebaseUpdateEmail(user, newEmail);
    
    // Send verification email to new address
    await sendEmailVerification(user);
  }

  // Update user password
  async updateUserPassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) throw new Error('No authenticated user');
    
    // Reauthenticate before password update
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    
    // Update password
    await firebaseUpdatePassword(user, newPassword);
  }

  // Send email verification
  async sendEmailVerification(): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    
    await sendEmailVerification(user);
  }
}

export const authService = new AuthService();
