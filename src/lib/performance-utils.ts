// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// =============================================================================
// DEBOUNCE HOOK
// =============================================================================

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]) as T;
}

// =============================================================================
// THROTTLE HOOK
// =============================================================================

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef(Date.now());
  
  return useCallback((...args: Parameters<T>) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]) as T;
}

// =============================================================================
// INTERSECTION OBSERVER HOOK
// =============================================================================

export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      options
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [elementRef, options]);
  
  return isIntersecting;
}

// =============================================================================
// MEMOIZED CALCULATIONS
// =============================================================================

export function useMemoizedDistance(
  lat1?: number,
  lon1?: number,
  lat2?: number,
  lon2?: number
): number | null {
  return useMemo(() => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, [lat1, lon1, lat2, lon2]);
}

// =============================================================================
// IMAGE OPTIMIZATION
// =============================================================================

export function useOptimizedImage(src: string, fallback: string) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
    };
    img.onerror = () => {
      setImageSrc(fallback);
      setHasError(true);
      setIsLoading(false);
    };
    img.src = src;
  }, [src, fallback]);
  
  return { imageSrc, isLoading, hasError };
}

// =============================================================================
// LOCAL STORAGE CACHE
// =============================================================================

export function useLocalStorageCache<T>(
  key: string,
  defaultValue: T,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp > ttl) {
        localStorage.removeItem(key);
        return defaultValue;
      }
      
      return parsed.value;
    } catch {
      return defaultValue;
    }
  });
  
  const setCachedValue = useCallback((newValue: T) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        value: newValue,
        timestamp: Date.now()
      }));
      setValue(newValue);
    } catch {
      // Silently fail if localStorage is not available
      setValue(newValue);
    }
  }, [key]);
  
  return [value, setCachedValue] as const;
}

// =============================================================================
// PERFORMANCE MONITORING
// =============================================================================

export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(Date.now());
  
  useEffect(() => {
    renderCount.current += 1;
  });
  
  useEffect(() => {
    const endTime = Date.now();
    const renderTime = endTime - startTime.current;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} - Renders: ${renderCount.current}, Time: ${renderTime}ms`);
    }
  });
  
  return {
    renderCount: renderCount.current,
    renderTime: Date.now() - startTime.current
  };
}

