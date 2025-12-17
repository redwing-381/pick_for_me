// FirebaseError type definition for compatibility
interface FirebaseError extends Error {
  code: string;
  customData?: Record<string, unknown>;
}

export enum AuthErrorCode {
  // Authentication errors
  INVALID_EMAIL = 'auth/invalid-email',
  USER_DISABLED = 'auth/user-disabled',
  USER_NOT_FOUND = 'auth/user-not-found',
  WRONG_PASSWORD = 'auth/wrong-password',
  EMAIL_ALREADY_IN_USE = 'auth/email-already-in-use',
  WEAK_PASSWORD = 'auth/weak-password',
  OPERATION_NOT_ALLOWED = 'auth/operation-not-allowed',
  
  // Network errors
  NETWORK_REQUEST_FAILED = 'auth/network-request-failed',
  TOO_MANY_REQUESTS = 'auth/too-many-requests',
  
  // Token errors
  INVALID_CUSTOM_TOKEN = 'auth/invalid-custom-token',
  CUSTOM_TOKEN_MISMATCH = 'auth/custom-token-mismatch',
  INVALID_CREDENTIAL = 'auth/invalid-credential',
  USER_TOKEN_EXPIRED = 'auth/user-token-expired',
  
  // OAuth errors
  ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL = 'auth/account-exists-with-different-credential',
  CREDENTIAL_ALREADY_IN_USE = 'auth/credential-already-in-use',
  
  // Email verification errors
  INVALID_ACTION_CODE = 'auth/invalid-action-code',
  EXPIRED_ACTION_CODE = 'auth/expired-action-code',
  
  // Custom application errors
  VALIDATION_ERROR = 'app/validation-error',
  UNKNOWN_ERROR = 'app/unknown-error',
  FORM_VALIDATION_ERROR = 'app/form-validation-error',
  SESSION_EXPIRED = 'app/session-expired',
  PERMISSION_DENIED = 'app/permission-denied',
}

export enum AuthErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface AuthErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  userAgent?: string;
  url?: string;
  additionalData?: Record<string, any>;
}

export class AuthError extends Error {
  public readonly code: AuthErrorCode;
  public readonly severity: AuthErrorSeverity;
  public readonly context: AuthErrorContext;
  public readonly originalError?: Error;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly retryable: boolean;
  public readonly timestamp: Date;

  constructor(
    code: AuthErrorCode,
    userMessage: string,
    technicalMessage?: string,
    severity: AuthErrorSeverity = AuthErrorSeverity.MEDIUM,
    context: AuthErrorContext = {},
    originalError?: Error,
    retryable: boolean = false
  ) {
    super(technicalMessage || userMessage);
    
    this.name = 'AuthError';
    this.code = code;
    this.severity = severity;
    this.context = {
      ...context,
      timestamp: new Date(),
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
    this.originalError = originalError;
    this.userMessage = userMessage;
    this.technicalMessage = technicalMessage || userMessage;
    this.retryable = retryable;
    this.timestamp = new Date();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }

  /**
   * Create AuthError from Firebase error
   */
  static fromFirebaseError(
    firebaseError: FirebaseError,
    context: AuthErrorContext = {}
  ): AuthError {
    const errorMapping = getFirebaseErrorMapping();
    const mapping = errorMapping[firebaseError.code as AuthErrorCode];
    
    if (mapping) {
      return new AuthError(
        firebaseError.code as AuthErrorCode,
        mapping.userMessage,
        mapping.technicalMessage,
        mapping.severity,
        context,
        firebaseError,
        mapping.retryable
      );
    }

    // Fallback for unmapped Firebase errors
    return new AuthError(
      AuthErrorCode.UNKNOWN_ERROR,
      'An unexpected error occurred. Please try again.',
      `Firebase error: ${firebaseError.code} - ${firebaseError.message}`,
      AuthErrorSeverity.MEDIUM,
      context,
      firebaseError,
      true
    );
  }

  /**
   * Create AuthError from generic error
   */
  static fromError(
    error: Error,
    context: AuthErrorContext = {},
    userMessage?: string
  ): AuthError {
    if (error instanceof AuthError) {
      return error;
    }

    // Check if it's a Firebase error by checking for code property
    if (error && typeof error === 'object' && 'code' in error && typeof (error as any).code === 'string') {
      return AuthError.fromFirebaseError(error as FirebaseError, context);
    }

    return new AuthError(
      AuthErrorCode.UNKNOWN_ERROR,
      userMessage || 'An unexpected error occurred. Please try again.',
      error.message,
      AuthErrorSeverity.MEDIUM,
      context,
      error,
      false
    );
  }

  /**
   * Create validation error
   */
  static validation(
    message: string,
    context: AuthErrorContext = {}
  ): AuthError {
    return new AuthError(
      AuthErrorCode.VALIDATION_ERROR,
      message,
      `Validation failed: ${message}`,
      AuthErrorSeverity.LOW,
      context,
      undefined,
      false
    );
  }

  /**
   * Create form validation error
   */
  static formValidation(
    fieldErrors: Record<string, string>,
    context: AuthErrorContext = {}
  ): AuthError {
    const message = 'Please correct the errors in the form and try again.';
    return new AuthError(
      AuthErrorCode.FORM_VALIDATION_ERROR,
      message,
      `Form validation failed: ${JSON.stringify(fieldErrors)}`,
      AuthErrorSeverity.LOW,
      { ...context, additionalData: { fieldErrors } },
      undefined,
      false
    );
  }

  /**
   * Create network error
   */
  static network(
    context: AuthErrorContext = {}
  ): AuthError {
    return new AuthError(
      AuthErrorCode.NETWORK_REQUEST_FAILED,
      'Network connection failed. Please check your internet connection and try again.',
      'Network request failed',
      AuthErrorSeverity.HIGH,
      context,
      undefined,
      true
    );
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.retryable;
  }

  /**
   * Check if error is critical
   */
  isCritical(): boolean {
    return this.severity === AuthErrorSeverity.CRITICAL;
  }

  /**
   * Get error for logging
   */
  toLogObject(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      severity: this.severity,
      userMessage: this.userMessage,
      technicalMessage: this.technicalMessage,
      retryable: this.retryable,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack,
      } : undefined,
    };
  }
}

interface ErrorMapping {
  userMessage: string;
  technicalMessage: string;
  severity: AuthErrorSeverity;
  retryable: boolean;
}

/**
 * Firebase error code to user-friendly message mapping
 */
function getFirebaseErrorMapping(): Record<AuthErrorCode, ErrorMapping> {
  return {
    [AuthErrorCode.INVALID_EMAIL]: {
      userMessage: 'Please enter a valid email address.',
      technicalMessage: 'The email address is not valid.',
      severity: AuthErrorSeverity.LOW,
      retryable: false,
    },
    [AuthErrorCode.USER_DISABLED]: {
      userMessage: 'This account has been disabled. Please contact support.',
      technicalMessage: 'The user account has been disabled by an administrator.',
      severity: AuthErrorSeverity.HIGH,
      retryable: false,
    },
    [AuthErrorCode.USER_NOT_FOUND]: {
      userMessage: 'No account found with this email address.',
      technicalMessage: 'There is no user record corresponding to this identifier.',
      severity: AuthErrorSeverity.MEDIUM,
      retryable: false,
    },
    [AuthErrorCode.WRONG_PASSWORD]: {
      userMessage: 'Incorrect password. Please try again.',
      technicalMessage: 'The password is invalid for the given email.',
      severity: AuthErrorSeverity.MEDIUM,
      retryable: false,
    },
    [AuthErrorCode.EMAIL_ALREADY_IN_USE]: {
      userMessage: 'An account with this email address already exists.',
      technicalMessage: 'The email address is already in use by another account.',
      severity: AuthErrorSeverity.MEDIUM,
      retryable: false,
    },
    [AuthErrorCode.WEAK_PASSWORD]: {
      userMessage: 'Password is too weak. Please choose a stronger password.',
      technicalMessage: 'The password must be 6 characters long or more.',
      severity: AuthErrorSeverity.LOW,
      retryable: false,
    },
    [AuthErrorCode.OPERATION_NOT_ALLOWED]: {
      userMessage: 'This sign-in method is not enabled. Please contact support.',
      technicalMessage: 'The given sign-in provider is disabled for this Firebase project.',
      severity: AuthErrorSeverity.HIGH,
      retryable: false,
    },
    [AuthErrorCode.NETWORK_REQUEST_FAILED]: {
      userMessage: 'Network connection failed. Please check your internet connection and try again.',
      technicalMessage: 'A network error has occurred.',
      severity: AuthErrorSeverity.HIGH,
      retryable: true,
    },
    [AuthErrorCode.TOO_MANY_REQUESTS]: {
      userMessage: 'Too many failed attempts. Please try again later.',
      technicalMessage: 'We have blocked all requests from this device due to unusual activity.',
      severity: AuthErrorSeverity.HIGH,
      retryable: true,
    },
    [AuthErrorCode.INVALID_CUSTOM_TOKEN]: {
      userMessage: 'Authentication failed. Please try signing in again.',
      technicalMessage: 'The custom token format is incorrect.',
      severity: AuthErrorSeverity.HIGH,
      retryable: false,
    },
    [AuthErrorCode.CUSTOM_TOKEN_MISMATCH]: {
      userMessage: 'Authentication failed. Please try signing in again.',
      technicalMessage: 'The custom token corresponds to a different audience.',
      severity: AuthErrorSeverity.HIGH,
      retryable: false,
    },
    [AuthErrorCode.INVALID_CREDENTIAL]: {
      userMessage: 'Authentication failed. Please try signing in again.',
      technicalMessage: 'The supplied auth credential is malformed or has expired.',
      severity: AuthErrorSeverity.HIGH,
      retryable: false,
    },
    [AuthErrorCode.USER_TOKEN_EXPIRED]: {
      userMessage: 'Your session has expired. Please sign in again.',
      technicalMessage: 'The user\'s credential is no longer valid.',
      severity: AuthErrorSeverity.MEDIUM,
      retryable: false,
    },
    [AuthErrorCode.ACCOUNT_EXISTS_WITH_DIFFERENT_CREDENTIAL]: {
      userMessage: 'An account already exists with the same email address but different sign-in credentials.',
      technicalMessage: 'An account already exists with the same email address but different sign-in credentials.',
      severity: AuthErrorSeverity.MEDIUM,
      retryable: false,
    },
    [AuthErrorCode.CREDENTIAL_ALREADY_IN_USE]: {
      userMessage: 'This credential is already associated with a different user account.',
      technicalMessage: 'This credential is already associated with a different user account.',
      severity: AuthErrorSeverity.MEDIUM,
      retryable: false,
    },
    [AuthErrorCode.INVALID_ACTION_CODE]: {
      userMessage: 'This verification link is invalid or has already been used.',
      technicalMessage: 'The action code is invalid.',
      severity: AuthErrorSeverity.MEDIUM,
      retryable: false,
    },
    [AuthErrorCode.EXPIRED_ACTION_CODE]: {
      userMessage: 'This verification link has expired. Please request a new one.',
      technicalMessage: 'The action code has expired.',
      severity: AuthErrorSeverity.MEDIUM,
      retryable: false,
    },
    [AuthErrorCode.VALIDATION_ERROR]: {
      userMessage: 'Please check your input and try again.',
      technicalMessage: 'Validation error occurred.',
      severity: AuthErrorSeverity.LOW,
      retryable: false,
    },
    [AuthErrorCode.UNKNOWN_ERROR]: {
      userMessage: 'An unexpected error occurred. Please try again.',
      technicalMessage: 'Unknown error occurred.',
      severity: AuthErrorSeverity.MEDIUM,
      retryable: true,
    },
    [AuthErrorCode.FORM_VALIDATION_ERROR]: {
      userMessage: 'Please correct the errors in the form and try again.',
      technicalMessage: 'Form validation failed.',
      severity: AuthErrorSeverity.LOW,
      retryable: false,
    },
    [AuthErrorCode.SESSION_EXPIRED]: {
      userMessage: 'Your session has expired. Please sign in again.',
      technicalMessage: 'User session has expired.',
      severity: AuthErrorSeverity.MEDIUM,
      retryable: false,
    },
    [AuthErrorCode.PERMISSION_DENIED]: {
      userMessage: 'You don\'t have permission to perform this action.',
      technicalMessage: 'Permission denied for this operation.',
      severity: AuthErrorSeverity.HIGH,
      retryable: false,
    },
  };
}