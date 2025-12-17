import { AuthError, AuthErrorCode } from './errors';

export interface SecureStorageOptions {
  keyPrefix: string;
  encryptionKey?: string;
  compressionEnabled: boolean;
  expirationTime?: number; // milliseconds
}

export interface StoredData<T = any> {
  data: T;
  timestamp: number;
  expiresAt?: number;
  checksum?: string;
}

const DEFAULT_OPTIONS: SecureStorageOptions = {
  keyPrefix: 'secure_',
  compressionEnabled: false,
};

export class SecureStorage {
  private options: SecureStorageOptions;
  private encryptionKey: string;

  constructor(options: Partial<SecureStorageOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.encryptionKey = this.options.encryptionKey || this.generateEncryptionKey();
  }

  /**
   * Store data securely
   */
  async setItem<T>(key: string, data: T, expirationMs?: number): Promise<void> {
    try {
      const fullKey = this.getFullKey(key);
      const timestamp = Date.now();
      const expiresAt = expirationMs ? timestamp + expirationMs : undefined;

      const storedData: StoredData<T> = {
        data,
        timestamp,
        expiresAt,
        checksum: this.generateChecksum(data),
      };

      let serializedData = JSON.stringify(storedData);

      // Compress if enabled
      if (this.options.compressionEnabled) {
        serializedData = this.compress(serializedData);
      }

      // Encrypt the data
      const encryptedData = await this.encrypt(serializedData);

      // Store in localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(fullKey, encryptedData);
      }
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Failed to store data securely.',
        `Secure storage setItem failed: ${error}`,
      );
    }
  }

  /**
   * Retrieve data securely
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      if (typeof window === 'undefined') {
        return null;
      }

      const fullKey = this.getFullKey(key);
      const encryptedData = localStorage.getItem(fullKey);

      if (!encryptedData) {
        return null;
      }

      // Decrypt the data
      let serializedData = await this.decrypt(encryptedData);

      // Decompress if enabled
      if (this.options.compressionEnabled) {
        serializedData = this.decompress(serializedData);
      }

      const storedData: StoredData<T> = JSON.parse(serializedData);

      // Check expiration
      if (storedData.expiresAt && Date.now() > storedData.expiresAt) {
        await this.removeItem(key);
        return null;
      }

      // Verify checksum
      if (storedData.checksum && !this.verifyChecksum(storedData.data, storedData.checksum)) {
        try {
          await this.removeItem(key);
        } catch {
          // Ignore removeItem errors during checksum validation
        }
        // Return null for corrupted data (consistent with other error handling)
        return null;
      }

      return storedData.data;
    } catch (error) {
      // For all errors (including decryption), remove corrupted data and return null
      try {
        await this.removeItem(key);
      } catch {
        // Ignore removeItem errors when cleaning up corrupted data
      }
      return null;
    }
  }

  /**
   * Remove item from secure storage
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const fullKey = this.getFullKey(key);
        localStorage.removeItem(fullKey);
      }
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Failed to remove data from secure storage.',
        `Secure storage removeItem failed: ${error}`,
      );
    }
  }

  /**
   * Check if item exists
   */
  async hasItem(key: string): Promise<boolean> {
    try {
      const data = await this.getItem(key);
      return data !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all items with the current prefix
   */
  async clear(): Promise<void> {
    try {
      if (typeof window === 'undefined') {
        return;
      }

      const keysToRemove: string[] = [];
      const prefix = this.options.keyPrefix;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Failed to clear secure storage.',
        `Secure storage clear failed: ${error}`,
      );
    }
  }

  /**
   * Get all keys with the current prefix
   */
  async getKeys(): Promise<string[]> {
    try {
      if (typeof window === 'undefined') {
        return [];
      }

      const keys: string[] = [];
      const prefix = this.options.keyPrefix;

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keys.push(key.substring(prefix.length));
        }
      }

      return keys;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageInfo(): Promise<{
    totalKeys: number;
    estimatedSize: number;
    availableSpace: number;
  }> {
    try {
      if (typeof window === 'undefined') {
        return { totalKeys: 0, estimatedSize: 0, availableSpace: 0 };
      }

      const keys = await this.getKeys();
      let estimatedSize = 0;

      for (const key of keys) {
        const fullKey = this.getFullKey(key);
        const data = localStorage.getItem(fullKey);
        if (data) {
          estimatedSize += data.length * 2; // Rough estimate (UTF-16)
        }
      }

      // Estimate available space (localStorage limit is usually 5-10MB)
      const estimatedLimit = 5 * 1024 * 1024; // 5MB
      const availableSpace = Math.max(0, estimatedLimit - estimatedSize);

      return {
        totalKeys: keys.length,
        estimatedSize,
        availableSpace,
      };
    } catch (error) {
      return { totalKeys: 0, estimatedSize: 0, availableSpace: 0 };
    }
  }

  /**
   * Generate full storage key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.options.keyPrefix}${key}`;
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    // In a real implementation, this should be derived from user credentials
    // or stored securely. This is a simplified version for demo purposes.
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'server';
    const timestamp = Date.now().toString();
    return btoa(`${userAgent}-${timestamp}`).substring(0, 32);
  }

  /**
   * Encrypt data (simplified implementation)
   */
  private async encrypt(data: string): Promise<string> {
    // In a real implementation, use Web Crypto API or a proper encryption library
    // This is a basic obfuscation for demo purposes
    try {
      const key = this.encryptionKey;
      let encrypted = '';
      
      for (let i = 0; i < data.length; i++) {
        const keyChar = key.charCodeAt(i % key.length);
        const dataChar = data.charCodeAt(i);
        encrypted += String.fromCharCode(dataChar ^ keyChar);
      }
      
      return btoa(encrypted);
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Encryption failed.',
        `Data encryption error: ${error}`,
      );
    }
  }

  /**
   * Decrypt data (simplified implementation)
   */
  private async decrypt(encryptedData: string): Promise<string> {
    // In a real implementation, use Web Crypto API or a proper decryption library
    // This is a basic deobfuscation for demo purposes
    try {
      const encrypted = atob(encryptedData);
      const key = this.encryptionKey;
      let decrypted = '';
      
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = key.charCodeAt(i % key.length);
        const encryptedChar = encrypted.charCodeAt(i);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }
      
      return decrypted;
    } catch (error) {
      throw new AuthError(
        AuthErrorCode.UNKNOWN_ERROR,
        'Decryption failed.',
        `Data decryption error: ${error}`,
      );
    }
  }

  /**
   * Compress data (simplified implementation)
   */
  private compress(data: string): string {
    // In a real implementation, use a proper compression library
    // This is a placeholder for demo purposes
    return data;
  }

  /**
   * Decompress data (simplified implementation)
   */
  private decompress(data: string): string {
    // In a real implementation, use a proper decompression library
    // This is a placeholder for demo purposes
    return data;
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: any): string {
    // Simple checksum implementation
    const str = JSON.stringify(data);
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Verify data checksum
   */
  private verifyChecksum(data: any, expectedChecksum: string): boolean {
    const actualChecksum = this.generateChecksum(data);
    return actualChecksum === expectedChecksum;
  }
}

// Export default instance
export const secureStorage = new SecureStorage();