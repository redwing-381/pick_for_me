import { User, getIdToken, onIdTokenChanged } from 'firebase/auth';
import { auth } from './firebase';
import { AuthError, AuthErrorCode } from './errors';
import { networkMonitor } from './network-utils';
import { secureStorage } from './secure-storage';
// Session sync removed

export interface TokenInfo {
  token: string;
  expirationTime: number;
  refreshTime: number;
  issuedAt: number;
}

export interface SessionData {
  userId: string;
  email: string;
  tokenInfo: TokenInfo;
  lastActivity: number;
  sessionId: string;
  deviceInfo?: {
    userAgent: string;
    platform: string;
    timestamp: number;
  };
}

export interface TokenManagerOptions {
  refreshThreshold: number; // Minutes before expiry to refresh
  maxRetries: number;
  storageKey: string;
  enableCrossTabSync: boolean;
  enableEncryption: boolean;
  sessionTimeout: number; // Minutes of inactivity before session expires
}

const DEFAULT_OPTIONS: TokenManagerOptions = {
  refreshThreshold: 5, // Refresh 5 minutes before expiry
  maxRetries: 3,
  storageKey: 'auth_session',
  enableCrossTabSync: true,
  enableEncryption: true,
  sessionTimeout: 60, // 1 hour of inactivity
};

export class TokenManager {
  private options: TokenManagerOptions;
  private refreshTimer: NodeJS.Timeout | null = null;
  private sessionData: SessionData | null = null;
  private listeners: Array<(sessionData: SessionData | null) => void> = [];
  private isRefreshing = false;
  private refreshPromise: Promise<TokenInfo> | null = null;
  private storageListener: ((event: StorageEvent) => void) | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private networkUnsubscribe: (() => void) | null = null;

  constructor(options: Partial<TokenManagerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.setupEventListeners();
    this.setupNetworkListener();
    // Session sync setup removed
    this.restoreSession();
  }

  /**
   * Initialize token manager with current user
   */
  async initialize(user: User | null): Promise<void> {
    if (user) {
      try {
        const tokenInfo = await this.getTokenInfo(user);
        const sessionData = this.createSessionData(user, tokenInfo);
        await this.setSession(sessionData);
        this.scheduleTokenRefresh(tokenInfo);
        this.resetActivityTimer();
      } catch (error) {
        throw AuthError.fromError(error as Error, {
          component: 'TokenManager',
          action: 'initialize',
        });
      }
    } else {
      await this.clearSession();
    }
  }

  /**
   * Get current session data
   */
  getSession(): SessionData | null {
    return this.sessionData;
  }

  /**
   * Get current token, refreshing if necessary
   */
  async getToken(forceRefresh = false): Promise<string | null> {
    if (!this.sessionData) {
      return null;
    }

    const now = Date.now();
    const { tokenInfo } = this.sessionData;

    // Check if token needs refresh
    const needsRefresh = forceRefresh || 
                        now >= tokenInfo.refreshTime || 
                        now >= tokenInfo.expirationTime;

    if (needsRefresh) {
      try {
        const newTokenInfo = await this.refreshToken();
        return newTokenInfo.token;
      } catch (error) {
        throw AuthError.fromError(error as Error, {
          component: 'TokenManager',
          action: 'getToken',
        });
      }
    }

    return tokenInfo.token;
  }

  /**
   * Refresh the current token
   */
  async refreshToken(): Promise<TokenInfo> {
    if (!auth.currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Please sign in again.',
        'No current user for token refresh'
      );
    }

    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const tokenInfo = await this.refreshPromise;
      this.isRefreshing = false;
      this.refreshPromise = null;
      return tokenInfo;
    } catch (error) {
      this.isRefreshing = false;
      this.refreshPromise = null;
      throw error;
    }
  }

  /**
   * Clear current session
   */
  async clearSession(): Promise<void> {
    this.clearRefreshTimer();
    this.clearActivityTimer();
    this.sessionData = null;
    
    // Remove from storage
    await this.removeFromStorage();
    
    // Cross-tab sync removed
    
    this.notifyListeners(null);
  }

  /**
   * Add session change listener
   */
  addListener(listener: (sessionData: SessionData | null) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    if (this.sessionData) {
      this.sessionData.lastActivity = Date.now();
      this.saveToStorage().catch(error => {
        console.error('Failed to save activity update:', error);
      });
      this.resetActivityTimer();
    }
  }

  /**
   * Check if session is expired due to inactivity
   */
  isSessionExpired(): boolean {
    if (!this.sessionData) {
      return true;
    }

    const now = Date.now();
    const inactivityLimit = this.options.sessionTimeout * 60 * 1000; // Convert to milliseconds
    const timeSinceActivity = now - this.sessionData.lastActivity;

    return timeSinceActivity > inactivityLimit;
  }

  /**
   * Destroy token manager and cleanup
   */
  destroy(): void {
    this.clearRefreshTimer();
    this.clearActivityTimer();
    this.removeStorageListener();
    
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
    
    // Session sync cleanup removed
    
    this.listeners = [];
    this.sessionData = null;
  }

  /**
   * Get token information from Firebase user
   */
  private async getTokenInfo(user: User): Promise<TokenInfo> {
    const token = await getIdToken(user, false);
    const tokenResult = await user.getIdTokenResult();
    
    const issuedAt = new Date(tokenResult.issuedAtTime).getTime();
    const expirationTime = new Date(tokenResult.expirationTime).getTime();
    const refreshTime = expirationTime - (this.options.refreshThreshold * 60 * 1000);

    return {
      token,
      expirationTime,
      refreshTime,
      issuedAt,
    };
  }

  /**
   * Create session data object
   */
  private createSessionData(user: User, tokenInfo: TokenInfo): SessionData {
    return {
      userId: user.uid,
      email: user.email || '',
      tokenInfo,
      lastActivity: Date.now(),
      sessionId: this.generateSessionId(),
      deviceInfo: this.getDeviceInfo(),
    };
  }

  /**
   * Perform the actual token refresh
   */
  private async performTokenRefresh(): Promise<TokenInfo> {
    if (!auth.currentUser) {
      throw new AuthError(
        AuthErrorCode.SESSION_EXPIRED,
        'Please sign in again.',
        'No current user for token refresh'
      );
    }

    let retries = 0;
    let lastError: Error;

    while (retries < this.options.maxRetries) {
      try {
        const tokenInfo = await this.getTokenInfo(auth.currentUser);
        
        // Update session with new token info
        if (this.sessionData) {
          this.sessionData.tokenInfo = tokenInfo;
          this.sessionData.lastActivity = Date.now();
          await this.setSession(this.sessionData);
        }

        this.scheduleTokenRefresh(tokenInfo);
        return tokenInfo;
      } catch (error) {
        lastError = error as Error;
        retries++;
        
        if (retries < this.options.maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.pow(2, retries) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw AuthError.fromError(lastError!, {
      component: 'TokenManager',
      action: 'performTokenRefresh',
      additionalData: { retries },
    });
  }

  /**
   * Schedule next token refresh
   */
  private scheduleTokenRefresh(tokenInfo: TokenInfo): void {
    this.clearRefreshTimer();
    
    const now = Date.now();
    const timeUntilRefresh = Math.max(0, tokenInfo.refreshTime - now);
    
    this.refreshTimer = setTimeout(async () => {
      try {
        await this.refreshToken();
      } catch (error) {
        console.error('Scheduled token refresh failed:', error);
        // Notify listeners of the error
        this.notifyListeners(null);
      }
    }, timeUntilRefresh);
  }

  /**
   * Set session data and save to storage
   */
  private async setSession(sessionData: SessionData): Promise<void> {
    this.sessionData = sessionData;
    
    // Save to storage
    await this.saveToStorage();
    
    // Cross-tab sync removed
    
    this.notifyListeners(sessionData);
  }

  /**
   * Save session to storage
   */
  private async saveToStorage(): Promise<void> {
    if (!this.sessionData || typeof window === 'undefined') {
      return;
    }

    try {
      if (this.options.enableEncryption) {
        // Use secure storage for encrypted data
        await secureStorage.setItem(this.options.storageKey, this.sessionData);
      } else {
        // Use regular localStorage for unencrypted data
        localStorage.setItem(this.options.storageKey, JSON.stringify(this.sessionData));
      }
    } catch (error) {
      console.error('Failed to save session to storage:', error);
    }
  }

  /**
   * Remove session from storage
   */
  private async removeFromStorage(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      if (this.options.enableEncryption) {
        await secureStorage.removeItem(this.options.storageKey);
      } else {
        localStorage.removeItem(this.options.storageKey);
      }
    } catch (error) {
      console.error('Failed to remove session from storage:', error);
    }
  }

  /**
   * Restore session from storage
   */
  private async restoreSession(): Promise<void> {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      let sessionData: SessionData | null = null;

      if (this.options.enableEncryption) {
        sessionData = await secureStorage.getItem<SessionData>(this.options.storageKey);
      } else {
        const stored = localStorage.getItem(this.options.storageKey);
        if (stored) {
          sessionData = JSON.parse(stored) as SessionData;
        }
      }

      // Cross-tab session sync removed

      // Validate session data
      if (sessionData && this.isValidSessionData(sessionData) && !this.isSessionExpired()) {
        this.sessionData = sessionData;
        this.scheduleTokenRefresh(sessionData.tokenInfo);
        this.resetActivityTimer();
        this.notifyListeners(sessionData);
      } else {
        await this.removeFromStorage();
      }
    } catch (error) {
      console.error('Failed to restore session from storage:', error);
      await this.removeFromStorage();
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Listen for storage changes (cross-tab sync)
    if (this.options.enableCrossTabSync) {
      this.storageListener = (event: StorageEvent) => {
        if (event.key === this.options.storageKey) {
          if (event.newValue) {
            try {
              if (this.options.enableEncryption) {
                // When encryption is enabled, we need to restore the session from storage
                // since the storage event doesn't give us direct access to decrypted data
                // Use a promise to handle the async operation without blocking
                this.restoreSession().catch(error => {
                  console.error('Failed to restore session from storage event:', error);
                });
                return;
              } else {
                const sessionData = JSON.parse(event.newValue) as SessionData;
                
                if (this.isValidSessionData(sessionData)) {
                  this.sessionData = sessionData;
                  this.scheduleTokenRefresh(sessionData.tokenInfo);
                  this.notifyListeners(sessionData);
                }
              }
            } catch (error) {
              console.error('Failed to sync session from storage:', error);
            }
          } else {
            // Session was cleared in another tab
            this.sessionData = null;
            this.clearRefreshTimer();
            this.notifyListeners(null);
          }
        }
      };

      window.addEventListener('storage', this.storageListener);
    }

    // Listen for user activity
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => this.updateActivity();
    
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
  }

  /**
   * Setup network status listener
   */
  private setupNetworkListener(): void {
    this.networkUnsubscribe = networkMonitor.addListener((status) => {
      if (status.isOnline && this.sessionData) {
        // When coming back online, check if token needs refresh
        const now = Date.now();
        if (now >= this.sessionData.tokenInfo.refreshTime) {
          this.refreshToken().catch(error => {
            console.error('Token refresh after network reconnection failed:', error);
          });
        }
      }
    });
  }

  // Session sync method removed

  /**
   * Remove storage listener
   */
  private removeStorageListener(): void {
    if (this.storageListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
  }

  /**
   * Clear refresh timer
   */
  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Reset activity timer
   */
  private resetActivityTimer(): void {
    this.clearActivityTimer();
    
    const timeoutMs = this.options.sessionTimeout * 60 * 1000;
    this.activityTimer = setTimeout(() => {
      this.clearSession();
    }, timeoutMs);
  }

  /**
   * Clear activity timer
   */
  private clearActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  /**
   * Notify all listeners of session changes
   */
  private notifyListeners(sessionData: SessionData | null): void {
    this.listeners.forEach(listener => {
      try {
        listener(sessionData);
      } catch (error) {
        console.error('Error in session listener:', error);
      }
    });
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get device information
   */
  private getDeviceInfo() {
    if (typeof navigator === 'undefined') {
      return undefined;
    }

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      timestamp: Date.now(),
    };
  }

  /**
   * Validate session data structure
   */
  private isValidSessionData(data: any): data is SessionData {
    return data &&
           typeof data.userId === 'string' &&
           typeof data.email === 'string' &&
           typeof data.sessionId === 'string' &&
           typeof data.lastActivity === 'number' &&
           data.tokenInfo &&
           typeof data.tokenInfo.token === 'string' &&
           typeof data.tokenInfo.expirationTime === 'number' &&
           typeof data.tokenInfo.refreshTime === 'number' &&
           typeof data.tokenInfo.issuedAt === 'number';
  }


}

// Global token manager instance
export const tokenManager = new TokenManager();