/**
 * Advanced Session Manager for Extended Sessions and Analytics
 * Handles remember me functionality, session restoration, and analytics
 */

import { User } from 'firebase/auth';
import { secureStorage } from './secure-storage';
import { AuthError, AuthErrorCode } from './errors';
import { networkMonitor } from './network-utils';

export interface ExtendedSessionConfig {
  rememberMeDuration: number; // in milliseconds
  standardSessionDuration: number; // in milliseconds
  maxInactivityTime: number; // in milliseconds
  enableAnalytics: boolean;
  enableOfflineMode: boolean;
}

export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  loginMethod: 'email' | 'google' | 'restored';
  rememberMeEnabled: boolean;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
    timezone: string;
  };
  networkInfo: {
    isOnline: boolean;
    connectionType?: string;
    effectiveType?: string;
  };
  authEvents: Array<{
    type: 'login' | 'logout' | 'refresh' | 'error' | 'activity';
    timestamp: number;
    details?: any;
  }>;
}

export interface OfflineAuthState {
  isOffline: boolean;
  lastOnlineTime: number;
  cachedUserData: any;
  pendingActions: Array<{
    type: string;
    data: any;
    timestamp: number;
  }>;
}

const DEFAULT_CONFIG: ExtendedSessionConfig = {
  rememberMeDuration: 30 * 24 * 60 * 60 * 1000, // 30 days
  standardSessionDuration: 24 * 60 * 60 * 1000, // 24 hours
  maxInactivityTime: 2 * 60 * 60 * 1000, // 2 hours
  enableAnalytics: true,
  enableOfflineMode: true,
};

export class SessionManager {
  private config: ExtendedSessionConfig;
  private currentSession: SessionMetrics | null = null;
  private offlineState: OfflineAuthState | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private analyticsQueue: Array<any> = [];
  private listeners: Array<(session: SessionMetrics | null) => void> = [];

  constructor(config: Partial<ExtendedSessionConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupActivityTracking();
    this.setupNetworkMonitoring();
    this.restoreSession();
  }

  /**
   * Create a new session with enhanced tracking
   */
  async createSession(
    user: User,
    loginMethod: 'email' | 'google' | 'restored',
    rememberMe: boolean = false
  ): Promise<SessionMetrics> {
    const sessionId = this.generateSessionId();
    const now = Date.now();

    const session: SessionMetrics = {
      sessionId,
      startTime: now,
      lastActivity: now,
      loginMethod,
      rememberMeEnabled: rememberMe,
      deviceInfo: this.getDeviceInfo(),
      networkInfo: this.getNetworkInfo(),
      authEvents: [{
        type: 'login',
        timestamp: now,
        details: { method: loginMethod, rememberMe }
      }]
    };

    this.currentSession = session;
    await this.persistSession(session, rememberMe);
    this.scheduleSessionExpiry(rememberMe);
    this.trackAnalyticsEvent('session_start', session);
    this.notifyListeners(session);

    return session;
  }

  /**
   * Update session activity and extend expiry
   */
  updateActivity(): void {
    if (!this.currentSession) return;

    const now = Date.now();
    this.currentSession.lastActivity = now;
    this.currentSession.authEvents.push({
      type: 'activity',
      timestamp: now
    });

    // Persist updated session
    this.persistSession(this.currentSession, this.currentSession.rememberMeEnabled);
    this.resetActivityTimer();
  }

  /**
   * Add authentication event to session
   */
  addAuthEvent(type: 'refresh' | 'error' | 'logout', details?: any): void {
    if (!this.currentSession) return;

    this.currentSession.authEvents.push({
      type,
      timestamp: Date.now(),
      details
    });

    this.persistSession(this.currentSession, this.currentSession.rememberMeEnabled);
    this.trackAnalyticsEvent(`auth_${type}`, { sessionId: this.currentSession.sessionId, details });
  }

  /**
   * Check if session is valid and not expired
   */
  isSessionValid(): boolean {
    if (!this.currentSession) return false;

    const now = Date.now();
    const sessionAge = now - this.currentSession.startTime;
    const inactivityTime = now - this.currentSession.lastActivity;

    const maxAge = this.currentSession.rememberMeEnabled 
      ? this.config.rememberMeDuration 
      : this.config.standardSessionDuration;

    return sessionAge < maxAge && inactivityTime < this.config.maxInactivityTime;
  }

  /**
   * Get current session metrics
   */
  getCurrentSession(): SessionMetrics | null {
    return this.currentSession;
  }

  /**
   * Clear current session
   */
  async clearSession(): Promise<void> {
    if (this.currentSession) {
      this.addAuthEvent('logout');
      this.trackAnalyticsEvent('session_end', {
        sessionId: this.currentSession.sessionId,
        duration: Date.now() - this.currentSession.startTime,
        eventCount: this.currentSession.authEvents.length
      });
    }

    this.currentSession = null;
    this.clearActivityTimer();
    await secureStorage.removeItem('extended_session');
    await secureStorage.removeItem('offline_auth_state');
    this.notifyListeners(null);
  }

  /**
   * Enable offline mode with cached authentication state
   */
  async enableOfflineMode(user: any): Promise<void> {
    if (!this.config.enableOfflineMode) return;

    this.offlineState = {
      isOffline: true,
      lastOnlineTime: Date.now(),
      cachedUserData: user,
      pendingActions: []
    };

    await secureStorage.setItem('offline_auth_state', this.offlineState);
    this.trackAnalyticsEvent('offline_mode_enabled', { sessionId: this.currentSession?.sessionId });
  }

  /**
   * Disable offline mode and sync pending actions
   */
  async disableOfflineMode(): Promise<void> {
    if (!this.offlineState) return;

    const pendingActions = this.offlineState.pendingActions;
    this.offlineState = null;
    await secureStorage.removeItem('offline_auth_state');

    // Process pending actions when back online
    if (pendingActions.length > 0) {
      this.trackAnalyticsEvent('offline_sync', {
        sessionId: this.currentSession?.sessionId,
        pendingActionsCount: pendingActions.length
      });
      // TODO: Implement pending action processing
    }
  }

  /**
   * Add action to offline queue
   */
  addOfflineAction(type: string, data: any): void {
    if (!this.offlineState) return;

    this.offlineState.pendingActions.push({
      type,
      data,
      timestamp: Date.now()
    });

    secureStorage.setItem('offline_auth_state', this.offlineState);
  }

  /**
   * Get session analytics data
   */
  getSessionAnalytics(): any {
    if (!this.currentSession) return null;

    const now = Date.now();
    return {
      sessionId: this.currentSession.sessionId,
      duration: now - this.currentSession.startTime,
      eventCount: this.currentSession.authEvents.length,
      loginMethod: this.currentSession.loginMethod,
      rememberMeEnabled: this.currentSession.rememberMeEnabled,
      deviceInfo: this.currentSession.deviceInfo,
      networkInfo: this.currentSession.networkInfo,
      lastActivity: this.currentSession.lastActivity,
      isActive: (now - this.currentSession.lastActivity) < (5 * 60 * 1000) // Active in last 5 minutes
    };
  }

  /**
   * Add session change listener
   */
  addListener(listener: (session: SessionMetrics | null) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Destroy session manager and cleanup
   */
  destroy(): void {
    this.clearActivityTimer();
    this.listeners = [];
    if (this.config.enableAnalytics) {
      this.flushAnalytics();
    }
  }

  // Private methods

  private async persistSession(session: SessionMetrics, rememberMe: boolean): Promise<void> {
    const expirationTime = rememberMe ? this.config.rememberMeDuration : this.config.standardSessionDuration;
    await secureStorage.setItem('extended_session', session, expirationTime);
  }

  private async restoreSession(): Promise<void> {
    try {
      const storedSession = await secureStorage.getItem<SessionMetrics>('extended_session');
      if (storedSession && this.isStoredSessionValid(storedSession)) {
        this.currentSession = storedSession;
        this.scheduleSessionExpiry(storedSession.rememberMeEnabled);
        this.trackAnalyticsEvent('session_restored', { sessionId: storedSession.sessionId });
        this.notifyListeners(storedSession);
      }

      // Restore offline state if exists
      const offlineState = await secureStorage.getItem<OfflineAuthState>('offline_auth_state');
      if (offlineState) {
        this.offlineState = offlineState;
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }

  private isStoredSessionValid(session: SessionMetrics): boolean {
    const now = Date.now();
    const sessionAge = now - session.startTime;
    const maxAge = session.rememberMeEnabled ? this.config.rememberMeDuration : this.config.standardSessionDuration;
    return sessionAge < maxAge;
  }

  private scheduleSessionExpiry(rememberMe: boolean): void {
    this.clearActivityTimer();
    const expiryTime = rememberMe ? this.config.rememberMeDuration : this.config.standardSessionDuration;
    
    this.activityTimer = setTimeout(() => {
      this.clearSession();
    }, expiryTime);
  }

  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    const handleActivity = () => this.updateActivity();

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
  }

  private setupNetworkMonitoring(): void {
    networkMonitor.addListener((status) => {
      if (status.isOnline && this.offlineState) {
        this.disableOfflineMode();
      } else if (!status.isOnline && !this.offlineState && this.currentSession) {
        this.enableOfflineMode(this.currentSession);
      }

      // Update network info in current session
      if (this.currentSession) {
        this.currentSession.networkInfo = this.getNetworkInfo();
      }
    });
  }

  private resetActivityTimer(): void {
    this.clearActivityTimer();
    this.activityTimer = setTimeout(() => {
      if (this.currentSession) {
        const inactivityTime = Date.now() - this.currentSession.lastActivity;
        if (inactivityTime >= this.config.maxInactivityTime) {
          this.clearSession();
        }
      }
    }, this.config.maxInactivityTime);
  }

  private clearActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDeviceInfo() {
    if (typeof navigator === 'undefined') {
      return {
        userAgent: 'server',
        platform: 'server',
        language: 'en',
        timezone: 'UTC'
      };
    }

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private getNetworkInfo() {
    if (typeof navigator === 'undefined') {
      return { isOnline: true };
    }

    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type,
      effectiveType: connection?.effectiveType
    };
  }

  private trackAnalyticsEvent(eventName: string, data: any): void {
    if (!this.config.enableAnalytics) return;

    const event = {
      name: eventName,
      timestamp: Date.now(),
      data,
      sessionId: this.currentSession?.sessionId
    };

    this.analyticsQueue.push(event);

    // Flush analytics periodically or when queue gets large
    if (this.analyticsQueue.length >= 10) {
      this.flushAnalytics();
    }
  }

  private async flushAnalytics(): Promise<void> {
    if (this.analyticsQueue.length === 0) return;

    try {
      // Store analytics events for later processing
      const existingEvents = await secureStorage.getItem<any[]>('auth_analytics') || [];
      const allEvents = [...existingEvents, ...this.analyticsQueue];
      
      // Keep only last 1000 events to prevent storage bloat
      const recentEvents = allEvents.slice(-1000);
      await secureStorage.setItem('auth_analytics', recentEvents);
      
      this.analyticsQueue = [];
    } catch (error) {
      console.error('Failed to flush analytics:', error);
    }
  }

  private notifyListeners(session: SessionMetrics | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(session);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();