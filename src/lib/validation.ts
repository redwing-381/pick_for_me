/**
 * Email validation utility
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isValid = emailRegex.test(email);
  return {
    isValid,
    error: isValid ? undefined : 'Invalid email format',
  };
}

/**
 * Password validation utility
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get password strength score
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) {
    score++;
  } else {
    suggestions.push('Use at least 8 characters');
  }

  if (password.length >= 12) {
    score++;
  } else if (password.length >= 8) {
    suggestions.push('Consider using 12+ characters for better security');
  }

  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    suggestions.push('Add uppercase letters');
  }

  if (/[a-z]/.test(password)) {
    score++;
  } else {
    suggestions.push('Add lowercase letters');
  }

  if (/[0-9]/.test(password)) {
    score++;
  } else {
    suggestions.push('Add numbers');
  }

  if (/[^A-Za-z0-9]/.test(password)) {
    score++;
  } else {
    suggestions.push('Add special characters (!@#$%^&*)');
  }

  if (score <= 2) {
    return { score, label: 'Weak', color: 'red', suggestions };
  } else if (score <= 4) {
    return { score, label: 'Medium', color: 'yellow', suggestions };
  } else {
    return { score, label: 'Strong', color: 'green', suggestions };
  }
}
