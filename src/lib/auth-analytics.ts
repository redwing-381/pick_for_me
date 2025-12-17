// Minimal auth analytics
import { AuthError } from './errors';

class AuthAnalytics {
  trackLogin(
    method: string,
    success: boolean,
    duration: number,
    sessionId?: string,
    userId?: string,
    error?: AuthError
  ): void {
    // Stub implementation - can be extended with actual analytics
    console.log('Login tracked:', { method, success, sessionId, userId });
  }

  trackRegistration(
    success: boolean,
    duration: number,
    sessionId?: string,
    userId?: string,
    error?: AuthError
  ): void {
    // Stub implementation
    console.log('Registration tracked:', { success, sessionId, userId });
  }

  trackLogout(
    sessionId?: string,
    userId?: string,
    sessionDuration?: number
  ): void {
    // Stub implementation
    console.log('Logout tracked:', { sessionId, userId, sessionDuration });
  }

  trackEvent(
    eventName: string,
    properties: Record<string, any>,
    sessionId?: string,
    userId?: string
  ): void {
    // Stub implementation
    console.log('Event tracked:', eventName, properties);
  }

  trackError(
    error: AuthError,
    context: string
  ): void {
    // Stub implementation
    console.error('Error tracked:', context, error);
  }
}

export const authAnalytics = new AuthAnalytics();
