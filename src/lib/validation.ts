// Form validation rules and utilities
import { ValidationRule, ValidationRules } from '../types/forms';

export const validationRules: ValidationRules = {
  email: [
    {
      required: true,
      message: 'Email is required',
    },
    {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
  ],
  password: [
    {
      required: true,
      message: 'Password is required',
    },
    {
      minLength: 6,
      message: 'Password must be at least 6 characters long',
    },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    },
  ],
  displayName: [
    {
      minLength: 2,
      message: 'Display name must be at least 2 characters long',
    },
    {
      maxLength: 50,
      message: 'Display name must be less than 50 characters',
    },
  ],
};

/**
 * Validate a single field against its rules
 */
export function validateField(value: string, rules: ValidationRule[]): string | null {
  for (const rule of rules) {
    // Check required
    if (rule.required && (!value || value.trim() === '')) {
      return rule.message;
    }

    // Skip other validations if field is empty and not required
    if (!value || value.trim() === '') {
      continue;
    }

    // Check minimum length
    if (rule.minLength && value.length < rule.minLength) {
      return rule.message;
    }

    // Check maximum length
    if (rule.maxLength && value.length > rule.maxLength) {
      return rule.message;
    }

    // Check pattern
    if (rule.pattern && !rule.pattern.test(value)) {
      return rule.message;
    }
  }

  return null;
}

/**
 * Enhanced validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format with enhanced result
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || email.trim() === '') {
    errors.push('Email is required');
  } else {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      errors.push('Please enter a valid email address');
    }
    
    // Additional email validations
    if (email.length > 254) {
      errors.push('Email address is too long');
    }
    
    const localPart = email.split('@')[0];
    if (localPart && localPart.length > 64) {
      errors.push('Email local part is too long');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate password strength with enhanced result
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password || password.trim() === '') {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[^a-zA-Z\d])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    // Check for common weak patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters');
    }
    
    const commonPasswords = ['password', '123456', 'qwerty', 'abc123', 'password123'];
    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('Password is too common, please choose a more unique password');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate display name
 */
export function validateDisplayName(displayName: string): ValidationResult {
  const errors: string[] = [];
  
  if (displayName && displayName.trim() !== '') {
    if (displayName.trim().length < 2) {
      errors.push('Display name must be at least 2 characters long');
    }
    
    if (displayName.length > 50) {
      errors.push('Display name must be less than 50 characters');
    }
    
    // Check for valid characters (letters, numbers, spaces, basic punctuation)
    if (!/^[a-zA-Z0-9\s\-_.]+$/.test(displayName)) {
      errors.push('Display name contains invalid characters');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Enhanced form validation with recovery suggestions
 */
export function validateFormField(
  fieldName: string, 
  value: string, 
  rules?: ValidationRule[]
): {
  isValid: boolean;
  error: string | null;
  suggestion: string | null;
} {
  const fieldRules = rules || validationRules[fieldName as keyof ValidationRules];
  
  if (!fieldRules) {
    return { isValid: true, error: null, suggestion: null };
  }

  const error = validateField(value, fieldRules);
  let suggestion: string | null = null;

  if (error) {
    // Provide specific suggestions based on field type and error
    switch (fieldName) {
      case 'email':
        if (error.includes('required')) {
          suggestion = 'Enter your email address to continue';
        } else if (error.includes('valid')) {
          suggestion = 'Make sure your email includes @ and a domain (like .com)';
        }
        break;
      case 'password':
        if (error.includes('required')) {
          suggestion = 'Create a password to secure your account';
        } else if (error.includes('characters')) {
          suggestion = 'Use at least 8 characters for better security';
        } else if (error.includes('uppercase') || error.includes('lowercase') || error.includes('number')) {
          suggestion = 'Mix uppercase, lowercase, and numbers for a stronger password';
        }
        break;
      case 'displayName':
        if (error.includes('characters')) {
          suggestion = 'Use at least 2 characters for your display name';
        }
        break;
    }
  }

  return {
    isValid: !error,
    error,
    suggestion
  };
}

/**
 * Validate entire form with comprehensive error reporting
 */
export function validateForm(formData: Record<string, any>): {
  isValid: boolean;
  errors: Record<string, string>;
  suggestions: Record<string, string>;
  summary: string;
} {
  const errors: Record<string, string> = {};
  const suggestions: Record<string, string> = {};

  // Validate each field
  Object.entries(formData).forEach(([fieldName, value]) => {
    const validation = validateFormField(fieldName, String(value || ''));
    if (!validation.isValid && validation.error) {
      errors[fieldName] = validation.error;
      if (validation.suggestion) {
        suggestions[fieldName] = validation.suggestion;
      }
    }
  });

  const errorCount = Object.keys(errors).length;
  let summary = '';

  if (errorCount === 0) {
    summary = 'All fields are valid';
  } else if (errorCount === 1) {
    summary = 'Please fix 1 error to continue';
  } else {
    summary = `Please fix ${errorCount} errors to continue`;
  }

  return {
    isValid: errorCount === 0,
    errors,
    suggestions,
    summary
  };
}

/**
 * Enhanced password strength analysis
 */
export function getPasswordStrength(password: string): {
  score: number;
  level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  suggestions: string[];
  hasMinLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumbers: boolean;
  hasSpecialChars: boolean;
} {
  const suggestions: string[] = [];
  let score = 0;
  
  // Length check
  const hasMinLength = password.length >= 8;
  if (hasMinLength) {
    score += 1;
    if (password.length >= 12) score += 0.5;
  } else {
    suggestions.push('Use at least 8 characters');
  }
  
  // Character type checks
  const hasLowercase = /[a-z]/.test(password);
  if (hasLowercase) {
    score += 1;
  } else {
    suggestions.push('Include lowercase letters (a-z)');
  }
  
  const hasUppercase = /[A-Z]/.test(password);
  if (hasUppercase) {
    score += 1;
  } else {
    suggestions.push('Include uppercase letters (A-Z)');
  }
  
  const hasNumbers = /\d/.test(password);
  if (hasNumbers) {
    score += 1;
  } else {
    suggestions.push('Include numbers (0-9)');
  }
  
  const hasSpecialChars = /[^a-zA-Z\d]/.test(password);
  if (hasSpecialChars) {
    score += 1;
  } else {
    suggestions.push('Include special characters (!@#$%^&*)');
  }
  
  // Bonus points for variety and length
  if (password.length >= 12) {
    score += 0.5;
  }
  
  // Penalty for common patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    suggestions.push('Avoid repeating characters');
  }
  
  if (/123|abc|qwe/i.test(password)) {
    score -= 0.5;
    suggestions.push('Avoid common sequences');
  }
  
  // Determine level based on score
  let level: 'very-weak' | 'weak' | 'fair' | 'good' | 'strong';
  if (score < 1) {
    level = 'very-weak';
  } else if (score < 2.5) {
    level = 'weak';
  } else if (score < 3.5) {
    level = 'fair';
  } else if (score < 4.5) {
    level = 'good';
  } else {
    level = 'strong';
  }
  
  // Normalize score to 0-4 range for UI
  const normalizedScore = Math.min(4, Math.max(0, Math.floor(score)));
  
  return {
    score: normalizedScore,
    level,
    suggestions: suggestions.slice(0, 3), // Limit to 3 suggestions
    hasMinLength,
    hasLowercase,
    hasUppercase,
    hasNumbers,
    hasSpecialChars
  };
}

/**
 * Validate password confirmation
 */
export function validatePasswordConfirmation(password: string, confirmPassword: string): string | null {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
}