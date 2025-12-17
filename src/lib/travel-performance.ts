// Performance optimization utilities for travel assistant features
// Includes caching, lazy loading, and performance monitoring

import { useState, useEffect, useCallback, useMemo } from 'react';

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

export interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  apiCallTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100;

  private constructor() {}

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getMetrics(componentName?: string): PerformanceMetrics[] {
    if (componentName) {
      return this.metrics.filter(m => m.componentName === componentName);
    }
    return [...this.metrics];
  }

  getAverageRenderTime(componentName: string): number {
    const componentMetrics = this.getMetrics(componentName);
    if (componentMetrics.length === 0) return 0;
    
    const totalTime = componentMetrics.reduce((sum, m) => sum + m.renderTime, 0);
    return totalTime / componentMetrics.length;
  }

  getCacheHitRate(componentName: string): number {
    const componentMetrics = this.getMetrics(componentName);
    if (componentMetrics.length === 0) return 0;
    
    const totalHitRate = componentMetrics.reduce((sum, m) => sum + m.cacheHitRate, 0);
    return totalHitRate / componentMetrics.length;
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// =============================================================================
// CACHING UTILITIES
// =============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
}

class TravelDataCache {
  private static instance: TravelDataCache;
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;
  private hitCount = 0;
  private missCount = 0;

  private constructor() {}

  public static getInstance(): TravelDataCache {
    if (!TravelDataCache.instance) {
      TravelDataCache.instance = new TravelDataCache();
    }
    return TravelDataCache.instance;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.missCount++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // Update access count and hit count
    entry.accessCount++;
    this.hitCount++;
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;
  }

  getHitRate(): number {
    const total = this.hitCount + this.missCount;
    return total > 0 ? this.hitCount / total : 0;
  }

  getStats(): {
    size: number;
    hitRate: number;
    hitCount: number;
    missCount: number;
  } {
    return {
      size: this.cache.size,
      hitRate: this.getHitRate(),
      hitCount: this.hitCount,
      missCount: this.missCount
    };
  }
}

export const travelDataCache = TravelDataCache.getInstance();

// =============================================================================
// REACT HOOKS FOR PERFORMANCE
// =============================================================================

export function usePerformanceTracking(componentName: string) {
  const [renderStart] = useState(() => performance.now());

  useEffect(() => {
    const renderTime = performance.now() - renderStart;
    
    performanceMonitor.recordMetric({
      componentName,
      renderTime,
      apiCallTime: 0,
      cacheHitRate: travelDataCache.getHitRate(),
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      timestamp: new Date()
    });
  }, [componentName, renderStart]);

  return {
    recordApiCall: useCallback((duration: number) => {
      performanceMonitor.recordMetric({
        componentName,
        renderTime: 0,
        apiCallTime: duration,
        cacheHitRate: travelDataCache.getHitRate(),
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        timestamp: new Date()
      });
    }, [componentName])
  };
}

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cachedData = travelDataCache.get<T>(key);
    if (cachedData) {
      setData(cachedData);
      return cachedData;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      travelDataCache.set(key, result, ttl);
      setData(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    clearCache: () => travelDataCache.clear()
  };
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [lastCall, setLastCall] = useState(0);

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        setLastCall(now);
        return callback(...args);
      }
    }) as T,
    [callback, delay, lastCall]
  );
}

// =============================================================================
// LAZY LOADING UTILITIES
// =============================================================================

export function useLazyLoad(threshold: number = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [element, setElement] = useState<Element | null>(null);

  useEffect(() => {
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [element, threshold]);

  return [setElement, isVisible] as const;
}

export function useImagePreloader(urls: string[]) {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const preloadImages = useCallback(async () => {
    setLoading(true);
    
    const promises = urls.map(url => {
      return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error(`Failed to load ${url}`));
        img.src = url;
      });
    });

    try {
      const loaded = await Promise.allSettled(promises);
      const successful = loaded
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map(result => result.value);
      
      setLoadedImages(new Set(successful));
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    } finally {
      setLoading(false);
    }
  }, [urls]);

  useEffect(() => {
    if (urls.length > 0) {
      preloadImages();
    }
  }, [urls, preloadImages]);

  return { loadedImages, loading, preloadImages };
}

// =============================================================================
// MEMORY MANAGEMENT
// =============================================================================

export function useMemoryOptimization() {
  const [memoryUsage, setMemoryUsage] = useState(0);

  useEffect(() => {
    const updateMemoryUsage = () => {
      if ((performance as any).memory) {
        setMemoryUsage((performance as any).memory.usedJSHeapSize);
      }
    };

    const interval = setInterval(updateMemoryUsage, 5000);
    updateMemoryUsage();

    return () => clearInterval(interval);
  }, []);

  const cleanup = useCallback(() => {
    // Clear caches
    travelDataCache.clear();
    
    // Force garbage collection if available
    if ((window as any).gc) {
      (window as any).gc();
    }
  }, []);

  return {
    memoryUsage,
    cleanup,
    isHighMemoryUsage: memoryUsage > 50 * 1024 * 1024 // 50MB threshold
  };
}

// =============================================================================
// BATCH PROCESSING
// =============================================================================

export function useBatchProcessor<T, R>(
  processor: (items: T[]) => Promise<R[]>,
  batchSize: number = 10,
  delay: number = 100
) {
  const [queue, setQueue] = useState<T[]>([]);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<R[]>([]);

  const addToQueue = useCallback((items: T | T[]) => {
    const itemsArray = Array.isArray(items) ? items : [items];
    setQueue(prev => [...prev, ...itemsArray]);
  }, []);

  const processBatch = useCallback(async () => {
    if (queue.length === 0 || processing) return;

    setProcessing(true);
    
    try {
      const batch = queue.slice(0, batchSize);
      const batchResults = await processor(batch);
      
      setResults(prev => [...prev, ...batchResults]);
      setQueue(prev => prev.slice(batchSize));
      
      // Process next batch after delay
      if (queue.length > batchSize) {
        setTimeout(() => processBatch(), delay);
      }
    } catch (error) {
      console.error('Batch processing error:', error);
    } finally {
      setProcessing(false);
    }
  }, [queue, processing, processor, batchSize, delay]);

  useEffect(() => {
    if (queue.length > 0 && !processing) {
      const timer = setTimeout(processBatch, delay);
      return () => clearTimeout(timer);
    }
  }, [queue.length, processing, processBatch, delay]);

  return {
    addToQueue,
    results,
    processing,
    queueLength: queue.length,
    clearQueue: () => setQueue([]),
    clearResults: () => setResults([])
  };
}

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

export function measurePerformance<T>(
  name: string,
  fn: () => T | Promise<T>
): T | Promise<T> {
  const start = performance.now();
  
  const result = fn();
  
  if (result instanceof Promise) {
    return result.finally(() => {
      const duration = performance.now() - start;
      console.log(`${name} took ${duration.toFixed(2)}ms`);
    });
  } else {
    const duration = performance.now() - start;
    console.log(`${name} took ${duration.toFixed(2)}ms`);
    return result;
  }
}

export function createMemoizedSelector<T, R>(
  selector: (data: T) => R,
  equalityFn?: (a: R, b: R) => boolean
) {
  let lastInput: T;
  let lastResult: R;
  
  return (input: T): R => {
    if (input !== lastInput) {
      const newResult = selector(input);
      
      if (!equalityFn || !equalityFn(lastResult, newResult)) {
        lastResult = newResult;
      }
      
      lastInput = input;
    }
    
    return lastResult;
  };
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

export const performanceUtils = {
  monitor: performanceMonitor,
  cache: travelDataCache,
  measurePerformance,
  createMemoizedSelector
};

export default performanceUtils;