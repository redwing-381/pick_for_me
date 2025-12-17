// Form data type definitions
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
  acceptTerms: boolean;
}

export interface ProfileUpdateData {
  displayName?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface PasswordResetData {
  email: string;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message: string;
}

export interface ValidationRules {
  email: ValidationRule[];
  password: ValidationRule[];
  displayName: ValidationRule[];
}