# Neo-Brutalism Design System Context

This document provides comprehensive information about the neo-brutalism design system used in Mirmer AI, enabling Kiro to replicate and extend this design language in other projects.

## Design Philosophy

The neo-brutalism design system emphasizes:
- **Bold, chunky borders** (4px black borders everywhere)
- **Strong shadows** with offset positioning
- **High contrast** colors and typography
- **Interactive feedback** through shadow and position changes
- **Geometric shapes** and sharp edges
- **Bold typography** with heavy font weights
- **Bright, saturated colors** against neutral backgrounds

## Core Design Tokens

### Colors
```javascript
// Primary Colors
colors: {
  border: "hsl(0 0% 0%)",           // Pure black for all borders
  main: "#f97316",                  // Orange accent
  mainAccent: "#fb923c",            // Lighter orange
  overlay: "rgba(0,0,0,0.8)",       // Dark overlay
  bg: "#dfe5f2",                    // Light blue-gray background
  text: "#000",                     // Black text
  darkBg: "#1e293b",                // Dark mode background
  darkText: "#eeefe9",              // Dark mode text
  secondaryBlack: "#212121",        // Secondary black
}

// Component Colors
- Blue: #4ECDC4 (teal-like blue)
- Yellow: #FFE66D (bright yellow)
- Red: #FF6B6B (coral red)
- Green: #4ECDC4 (same as blue)
- Purple: #DDD6FE (light purple)
```

### Shadows & Effects
```css
/* Base shadow - used everywhere */
box-shadow: 4px 4px 0px 0px rgba(0,0,0,1);

/* Hover shadow - larger offset */
box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);

/* Active shadow - no shadow (pressed effect) */
box-shadow: none;

/* Card shadows - larger for more prominence */
box-shadow: 8px 8px 0px 0px rgba(0,0,0,1);
box-shadow: 12px 12px 0px 0px rgba(0,0,0,1); /* highlighted */
box-shadow: 16px 16px 0px 0px rgba(0,0,0,1); /* hover */
```

### Typography
```css
/* Font weights */
font-weight: 500;  /* base */
font-weight: 700;  /* heading */
font-weight: 800;  /* bold */
font-weight: 900;  /* black/extra bold */

/* Common patterns */
.font-bold { font-weight: 700; }
.font-black { font-weight: 900; }
```

### Borders & Spacing
```css
/* Standard border */
border: 4px solid black;

/* Border radius (minimal) */
border-radius: 6px; /* base radius, rarely used - prefer sharp edges */

/* Standard spacing */
padding: 1rem 1.5rem; /* buttons */
padding: 1.5rem;      /* cards */
padding: 2rem;        /* sections */
```

## Component Library

### Button Component
```jsx
// Base button with neo-brutalism styling
const baseStyles = 'font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all'

// Variants
const variants = {
  default: 'bg-blue-500 hover:bg-blue-600 text-white',
  neutral: 'bg-white hover:bg-gray-50 text-black',
  primary: 'bg-yellow-400 hover:bg-yellow-500 text-black',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
}

// Interactive states
hover: shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] translate-x-[-2px] translate-y-[-2px]
active: shadow-none translate-x-1 translate-y-1
```

### Card Component
```jsx
// Base card styling
className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6"

// Interactive card states
hover: shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] -translate-y-2
```

### Input Component
```jsx
// Input styling
className="w-full px-4 py-3 text-base font-medium bg-white border-4 border-black focus:outline-none focus:ring-4 focus:ring-yellow-400"
```

### Badge Component
```jsx
// Badge styling
className="inline-block px-3 py-1 text-sm font-bold border-2 border-black"

// Badge variants
variants = {
  default: 'bg-blue-400 text-black',
  success: 'bg-green-400 text-black',
  warning: 'bg-yellow-400 text-black',
  danger: 'bg-red-400 text-white',
  neutral: 'bg-gray-200 text-black',
}
```

### Toast Component
```jsx
// Toast styling with animation
className="flex items-center gap-3 p-4 pr-12 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-w-[300px] max-w-md animate-slide-in"
```

### Alert Dialog
```jsx
// Dialog content
className="relative bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 max-w-md w-full mx-4 z-50"
```

## Animation Patterns

### Hover Effects
```css
/* Standard hover - lift and enhance shadow */
.hover-lift {
  transition: all 0.2s ease;
}
.hover-lift:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px 0px rgba(0,0,0,1);
}

/* Button press effect */
.button-press:active {
  transform: translate(1px, 1px);
  box-shadow: none;
}
```

### Custom Animations
```css
/* Floating elements */
@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

/* Fade in with slide */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Slide in for toasts */
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```

## Layout Patterns

### Section Structure
```jsx
// Standard section with decorative elements
<section className="py-20 bg-[#f5f5f5] border-b-4 border-black relative overflow-hidden">
  {/* Decorative background elements */}
  <div className="absolute top-16 left-8 w-32 h-32 bg-teal-400 border-4 border-black opacity-10 -rotate-12 pointer-events-none"></div>
  
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
    {/* Content */}
  </div>
</section>
```

### Interactive Cards Grid
```jsx
// Responsive grid with hover effects
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  {items.map((item, index) => (
    <div
      key={index}
      className={`border-4 border-black p-8 cursor-pointer transition-all duration-300 ${
        activeItem === index 
          ? 'shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] scale-105 -translate-y-2' 
          : 'shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1'
      }`}
      style={{ backgroundColor: item.color }}
    >
      {/* Content */}
    </div>
  ))}
</div>
```

## Utility Classes

### Common Combinations
```css
/* Standard interactive element */
.neo-interactive {
  @apply border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
         hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] 
         hover:translate-x-[-2px] hover:translate-y-[-2px] 
         active:shadow-none active:translate-x-1 active:translate-y-1 
         transition-all;
}

/* Card base */
.neo-card {
  @apply bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6;
}

/* Button base */
.neo-button {
  @apply font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
         active:shadow-none active:translate-x-1 active:translate-y-1 transition-all;
}
```

## Color Combinations

### Recommended Palettes
```javascript
// Primary palette
const primaryColors = {
  background: '#f5f5f5',    // Light gray
  accent1: '#4ECDC4',       // Teal
  accent2: '#FFE66D',       // Yellow
  accent3: '#FF6B6B',       // Coral
  accent4: '#DDD6FE',       // Light purple
  text: '#000000',          // Black
  border: '#000000',        // Black
}

// Status colors
const statusColors = {
  success: '#4ECDC4',       // Teal
  warning: '#FFE66D',       // Yellow
  error: '#FF6B6B',         // Coral
  info: '#4ECDC4',          // Teal
}
```

## Implementation Guidelines

### Required Dependencies
```json
{
  "clsx": "^2.0.0",
  "tailwind-merge": "^2.0.0",
  "@radix-ui/react-dropdown-menu": "^2.0.0" // for dropdown components
}
```

### Tailwind Configuration
```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      colors: {
        border: "hsl(0 0% 0%)",
        main: "#f97316",
        mainAccent: "#fb923c",
        overlay: "rgba(0,0,0,0.8)",
        bg: "#dfe5f2",
        text: "#000",
        darkBg: "#1e293b",
        darkText: "#eeefe9",
        secondaryBlack: "#212121",
      },
      borderRadius: {
        base: "6px"
      },
      boxShadow: {
        base: "4px 4px 0px 0px rgba(0,0,0,1)",
      },
      translate: {
        boxShadowX: "4px",
        boxShadowY: "4px",
      },
      fontWeight: {
        base: "500",
        heading: "700",
      },
    },
  },
}
```

### Utility Function
```javascript
// lib/utils.js
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
```

## Best Practices

### Do's
- Always use 4px black borders
- Use bold font weights (700+) for text
- Implement hover effects with shadow and position changes
- Use bright, saturated colors for accents
- Keep backgrounds neutral (white, light gray)
- Add decorative geometric elements to sections
- Use consistent shadow patterns

### Don'ts
- Avoid rounded corners (use sparingly)
- Don't use subtle shadows or effects
- Avoid thin borders or light colors for borders
- Don't use gradients or complex effects
- Avoid small font weights (under 500)
- Don't overcomplicate animations

### Accessibility Considerations
- Maintain high contrast ratios
- Ensure interactive elements have clear focus states
- Use semantic HTML elements
- Provide alternative text for decorative elements
- Test with keyboard navigation

## Example Usage

### Creating a New Neo-Brutalism Component
```jsx
import { cn } from '../lib/utils'

export function NeoBrutalismCard({ children, className, interactive = false, ...props }) {
  return (
    <div
      className={cn(
        'bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6',
        interactive && 'cursor-pointer transition-all duration-300 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
```

This design system creates a bold, playful, and highly interactive user interface that stands out while maintaining excellent usability and accessibility.