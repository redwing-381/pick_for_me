// =============================================================================
// ANIMATION UTILITIES
// =============================================================================

// =============================================================================
// TRANSITION CLASSES
// =============================================================================

export const transitions = {
  // Standard transitions
  fast: 'transition-all duration-150 ease-out',
  normal: 'transition-all duration-200 ease-out',
  slow: 'transition-all duration-300 ease-out',
  
  // Specific property transitions
  colors: 'transition-colors duration-200 ease-out',
  transform: 'transition-transform duration-200 ease-out',
  opacity: 'transition-opacity duration-200 ease-out',
  shadow: 'transition-shadow duration-200 ease-out',
  
  // Hover effects
  hover: 'hover:scale-105 hover:shadow-lg transition-all duration-200 ease-out',
  hoverSoft: 'hover:scale-102 hover:shadow-md transition-all duration-200 ease-out',
  
  // Focus effects
  focus: 'focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none',
  focusWithin: 'focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-50',
} as const;

// =============================================================================
// ANIMATION KEYFRAMES
// =============================================================================

export const animations = {
  // Entrance animations
  fadeIn: 'animate-fade-in',
  slideInUp: 'animate-slide-in-up',
  slideInDown: 'animate-slide-in-down',
  slideInLeft: 'animate-slide-in-left',
  slideInRight: 'animate-slide-in-right',
  
  // Loading animations
  spin: 'animate-spin',
  pulse: 'animate-pulse',
  bounce: 'animate-bounce',
  
  // Custom animations
  wiggle: 'animate-wiggle',
  heartbeat: 'animate-heartbeat',
} as const;

// =============================================================================
// STAGGER ANIMATIONS
// =============================================================================

export function getStaggerDelay(index: number, baseDelay: number = 100): string {
  return `style="animation-delay: ${index * baseDelay}ms"`;
}

// =============================================================================
// SCROLL ANIMATIONS
// =============================================================================

export function useScrollAnimation(threshold: number = 0.1) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut' }
  };
}

// =============================================================================
// MICRO-INTERACTIONS
// =============================================================================

export const microInteractions = {
  // Button interactions
  buttonPress: 'active:scale-95 transition-transform duration-75',
  buttonHover: 'hover:bg-opacity-90 transition-colors duration-150',
  
  // Card interactions
  cardHover: 'hover:shadow-xl hover:-translate-y-1 transition-all duration-200',
  cardPress: 'active:scale-98 transition-transform duration-75',
  
  // Input interactions
  inputFocus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-150',
  
  // Icon interactions
  iconHover: 'hover:text-blue-600 transition-colors duration-150',
  iconSpin: 'hover:rotate-12 transition-transform duration-200',
} as const;

// =============================================================================
// LOADING STATES
// =============================================================================

export const loadingStates = {
  skeleton: 'animate-pulse bg-gray-200 rounded',
  shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-size-200',
  dots: 'animate-bounce',
} as const;

// =============================================================================
// RESPONSIVE ANIMATIONS
// =============================================================================

export const responsiveAnimations = {
  // Mobile-first animations
  mobile: {
    slideUp: 'transform translate-y-full transition-transform duration-300 ease-out',
    slideDown: 'transform -translate-y-full transition-transform duration-300 ease-out',
  },
  
  // Desktop animations
  desktop: {
    fadeScale: 'transform scale-95 opacity-0 transition-all duration-200 ease-out',
    slideLeft: 'transform -translate-x-full transition-transform duration-300 ease-out',
  }
} as const;

// =============================================================================
// ANIMATION UTILITIES
// =============================================================================

export function combineClasses(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function createAnimationClass(
  base: string,
  hover?: string,
  focus?: string,
  active?: string
): string {
  return combineClasses(
    base,
    hover && `hover:${hover}`,
    focus && `focus:${focus}`,
    active && `active:${active}`
  );
}

// =============================================================================
// PERFORMANCE OPTIMIZED ANIMATIONS
// =============================================================================

export const performanceAnimations = {
  // Use transform and opacity for better performance
  slideUp: 'transform translate-y-0 transition-transform duration-300 ease-out will-change-transform',
  fadeIn: 'opacity-100 transition-opacity duration-300 ease-out will-change-opacity',
  scale: 'transform scale-100 transition-transform duration-200 ease-out will-change-transform',
} as const;