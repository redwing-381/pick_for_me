// Authentication type definitions
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
  providerId: string;
  createdAt: Date;
  lastLoginAt: Date;
  customClaims?: Record<string, any>;
}

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  issuedAt: Date;
  provider: AuthProvider;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: import('../lib/errors').AuthError | null;
  initialized: boolean;
  sessionPersisted: boolean;
}

export interface AuthError {
  code: string;
  message: string;
  userMessage: string;
  field?: string;
  timestamp: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormErrors {
  email?: ValidationError;
  password?: ValidationError;
  confirmPassword?: ValidationError;
  displayName?: ValidationError;
  general?: import('../lib/errors').AuthError;
}

export type AuthProvider = 'email' | 'google' | 'github';

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyPasswordResetCode: (code: string) => Promise<string>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;
  updateProfile: (data: ProfileData) => Promise<void>;
  updateEmail: (newEmail: string, currentPassword: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
}

export interface ProfileData {
  displayName?: string;
  photoURL?: string;
}