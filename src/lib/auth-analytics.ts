/**
 * Authentication Analytics Service
 * Tracks authentication events, user behavior, and system performance
 */

import { secureStorage } from './secure-storage';
import { AuthError } from './errors';

export interface AuthAnalyticsEvent {
  id: string;
  type: 'login' | 'logout' | 'register' | 'password_reset' | 'profile_update' | 'error' | 'performance';
  timestamp: number;
  sessionId?: string;
  userId?: string;
  metadata: {
    method?: 'email' | 'google' | 'restored';
    success: boolean;
    duration?: number;
    errorCode?: string;
    errorMessage?: string;
    userAgent?: string;
    location?: string;
    [key: string]: any;
  };
}

export interface AuthMetrics {
  totalLogins: number;
  totalRegistrations: number;
  totalErrors: number;
  averageSessionDuration: number;
  loginMethodDistribution: {
    email: number;
    google: number;
    restored: number;
  };
  errorDistribution: Record<string, number>;
  performanceMetrics: {
    averageLoginTime: number;
    averageRegistrationTime: number;
    averageTokenRefreshTime: number;
  };
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionsPerUser: number;
  };
}

export interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  metadata?: any;
}

class AuthAnalyticsService {
  private events: AuthAnalyticsEvent[] = [];
  private performanceMetrics: PerformanceMetric[] = [];
  private isEnabled: boolean = true;
  private flushInterval: NodeJS.Timeout | null = null;
  private readonly STORAGE_KEY = 'auth_analytics_events';
  private readonly METRICS_KEY = 'auth_analytics_metrics';
  private readonly MAX_EVENTS = 1000;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.loadStoredEvents();
    this.startPeriodicFlush();
  }

  /**
   * Enable or disable analytics collection
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.clearAllData();
    }
  }

  /**
   * Track authentication event
   */
  trackEvent(
    type: AuthAnalyticsEvent['type'],
    metadata: AuthAnalyticsEvent['metadata'],
    sessionId?: string,
    userId?: string
  ): void {
    if (!this.isEnabled) return;

    const event: AuthAnalyticsEvent = {
      id: this.generateEventId(),
      type,
      timestamp: Date.now(),
      sessionId,
      userId,
      metadata: {
        ...metadata,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
        location: typeof window !== 'undefined' ? window.location.pathname : 'server'
      }
    };

    this.events.push(event);
    this.trimEvents();
  }

  /**
   * Track login attempt
   */
  trackLogin(
    method: 'email' | 'google' | 'restored',
    success: boolean,
    duration: number,
    sessionId?: string,
    userId?: string,
    error?: AuthError
  ): void {
    this.trackEvent('login', {
      method,
      success,
      duration,
      errorCode: error?.code,
      errorMessage: error?.userMessage
    }, sessionId, userId);
  }

  /**
   * Track registration attempt
   */
  trackRegistration(
    success: boolean,
    duration: number,
    sessionId?: string,
    userId?: string,
    error?: AuthError
  ): void {
    this.trackEvent('register', {
      success,
      duration,
      errorCode: error?.code,
      errorMessage: error?.userMessage
    }, sessionId, userId);
  }

  /**
   * Track logout
   */
  trackLogout(
    sessionId?: string,
    userId?: string,
    sessionDuration?: number
  ): void {
    this.trackEvent('logout', {
      success: true,
      sessionDuration
    }, sessionId, userId);
  }

  /**
   * Track password reset
   */
  trackPasswordReset(
    success: boolean,
    duration: number,
    sessionId?: string,
    error?: AuthError
  ): void {
    this.trackEvent('password_reset', {
      success,
      duration,
      errorCode: error?.code,
      errorMessage: error?.userMessage
    }, sessionId);
  }

  /**
   * Track profile update
   */
  trackProfileUpdate(
    updateType: 'display_name' | 'email' | 'password',
    success: boolean,
    duration: number,
    sessionId?: string,
    userId?: string,
    error?: AuthError
  ): void {
    this.trackEvent('profile_update', {
      updateType,
      success,
      duration,
      errorCode: error?.code,
      errorMessage: error?.userMessage
    }, sessionId, userId);
  }

  /**
   * Track authentication error
   */
  trackError(
    error: AuthError,
    context: string,
    sessionId?: string,
    userId?: string
  ): void {
    this.trackEvent('error', {
      success: false,
      errorCode: error.code,
      errorMessage: error.userMessage,
      context,
      technicalDetails: error.technicalMessage
    }, sessionId, userId);
  }

  /**
   * Start performance measurement
   */
  startPerformanceMeasurement(operation: string, metadata?: any): string {
    const id = this.generateEventId();
    const metric: PerformanceMetric = {
      operation,
      startTime: performance.now(),
      success: false,
      metadata
    };

    this.performanceMetrics.push(metric);
    return id;
  }

  /**
   * End performance measurement
   */
  endPerformanceMeasurement(id: string, success: boolean = true): void {
    const metric = this.performanceMetrics.find(m => 
      m.operation === id || m.metadata?.id === id
    );

    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.success = success;

      this.trackEvent('performance', {
        operation: metric.operation,
        duration: metric.duration,
        success: metric.success,
        ...metric.metadata
      });
    }
  }

  /**
   * Get analytics metrics
   */
  async getMetrics(): Promise<AuthMetrics> {
    const events = await this.getAllEvents();
    
    const loginEvents = events.filter(e => e.type === 'login');
    const registerEvents = events.filter(e => e.type === 'register');
    const errorEvents = events.filter(e => e.type === 'error');
    const logoutEvents = events.filter(e => e.type === 'logout');

    // Calculate metrics
    const totalLogins = loginEvents.filter(e => e.metadata.success).length;
    const totalRegistrations = registerEvents.filter(e => e.metadata.success).length;
    const totalErrors = errorEvents.length;

    // Session duration calculation
    const sessionDurations = logoutEvents
      .filter(e => e.metadata.sessionDuration)
      .map(e => e.metadata.sessionDuration as number);
    const averageSessionDuration = sessionDurations.length > 0 
      ? sessionDurations.reduce((a, b) => a + b, 0) / sessionDurations.length 
      : 0;

    // Login method distribution
    const loginMethodDistribution = {
      email: loginEvents.filter(e => e.metadata.method === 'email').length,
      google: loginEvents.filter(e => e.metadata.method === 'google').length,
      restored: loginEvents.filter(e => e.metadata.method === 'restored').length
    };

    // Error distribution
    const errorDistribution: Record<string, number> = {};
    errorEvents.forEach(e => {
      const errorCode = e.metadata.errorCode as string;
      if (errorCode) {
        errorDistribution[errorCode] = (errorDistribution[errorCode] || 0) + 1;
      }
    });

    // Performance metrics
    const performanceEvents = events.filter(e => e.type === 'performance');
    const loginPerf = performanceEvents.filter(e => e.metadata.operation === 'login');
    const registerPerf = performanceEvents.filter(e => e.metadata.operation === 'register');
    const refreshPerf = performanceEvents.filter(e => e.metadata.operation === 'token_refresh');

    const performanceMetrics = {
      averageLoginTime: this.calculateAverageDuration(loginPerf),
      averageRegistrationTime: this.calculateAverageDuration(registerPerf),
      averageTokenRefreshTime: this.calculateAverageDuration(refreshPerf)
    };

    // User engagement (simplified - would need more sophisticated tracking in production)
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    const recentEvents = events.filter(e => e.type === 'login' && e.metadata.success);
    const dailyActiveUsers = new Set(
      recentEvents
        .filter(e => now - e.timestamp < dayMs)
        .map(e => e.userId)
        .filter(Boolean)
    ).size;

    const weeklyActiveUsers = new Set(
      recentEvents
        .filter(e => now - e.timestamp < weekMs)
        .map(e => e.userId)
        .filter(Boolean)
    ).size;

    const monthlyActiveUsers = new Set(
      recentEvents
        .filter(e => now - e.timestamp < monthMs)
        .map(e => e.userId)
        .filter(Boolean)
    ).size;

    const userEngagement = {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      averageSessionsPerUser: monthlyActiveUsers > 0 ? totalLogins / monthlyActiveUsers : 0
    };

    return {
      totalLogins,
      totalRegistrations,
      totalErrors,
      averageSessionDuration,
      loginMethodDistribution,
      errorDistribution,
      performanceMetrics,
      userEngagement
    };
  }

  /**
   * Get recent events
   */
  async getRecentEvents(limit: number = 100): Promise<AuthAnalyticsEvent[]> {
    const allEvents = await this.getAllEvents();
    return allEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Export analytics data
   */
  async exportData(): Promise<{
    events: AuthAnalyticsEvent[];
    metrics: AuthMetrics;
    exportTimestamp: number;
  }> {
    const events = await this.getAllEvents();
    const metrics = await this.getMetrics();

    return {
      events,
      metrics,
      exportTimestamp: Date.now()
    };
  }

  /**
   * Clear all analytics data
   */
  async clearAllData(): Promise<void> {
    this.events = [];
    this.performanceMetrics = [];
    await secureStorage.removeItem(this.STORAGE_KEY);
    await secureStorage.removeItem(this.METRICS_KEY);
  }

  /**
   * Destroy analytics service
   */
  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushToStorage();
  }

  // Private methods

  private async loadStoredEvents(): Promise<void> {
    try {
      const storedEvents = await secureStorage.getItem<AuthAnalyticsEvent[]>(this.STORAGE_KEY);
      if (storedEvents && Array.isArray(storedEvents)) {
        this.events = storedEvents;
      }
    } catch (error) {
      console.error('Failed to load stored analytics events:', error);
    }
  }

  private async getAllEvents(): Promise<AuthAnalyticsEvent[]> {
    const storedEvents = await secureStorage.getItem<AuthAnalyticsEvent[]>(this.STORAGE_KEY) || [];
    return [...storedEvents, ...this.events];
  }

  private startPeriodicFlush(): void {
    this.flushInterval = setInterval(() => {
      this.flushToStorage();
    }, this.FLUSH_INTERVAL);
  }

  private async flushToStorage(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      const existingEvents = await secureStorage.getItem<AuthAnalyticsEvent[]>(this.STORAGE_KEY) || [];
      const allEvents = [...existingEvents, ...this.events];
      
      // Keep only the most recent events
      const recentEvents = allEvents
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.MAX_EVENTS);

      await secureStorage.setItem(this.STORAGE_KEY, recentEvents);
      this.events = [];
    } catch (error) {
      console.error('Failed to flush analytics to storage:', error);
    }
  }

  private trimEvents(): void {
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private calculateAverageDuration(events: AuthAnalyticsEvent[]): number {
    const durations = events
      .map(e => e.metadata.duration as number)
      .filter(d => typeof d === 'number' && d > 0);
    
    return durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;
  }
}

// Export singleton instance
export const authAnalytics = new AuthAnalyticsService();