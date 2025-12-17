# Pick For Me - AI-Powered Decision Engine

> **Eliminate choice paralysis with autonomous AI decision-making**

An innovative restaurant decision engine that leverages Yelp's AI API to make autonomous choices for users. Built with Next.js 14, featuring a unique neo-brutalism design system enhanced with 3D animations, conversational AI interfaces, and automated reservation booking.

![Pick For Me Banner](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

## 🎯 **Core Philosophy**

- **Decision Delegation**: AI makes choices instead of just suggesting options
- **Conversational Interface**: Natural language interaction with Yelp AI API
- **Autonomous Actions**: AI can execute actions like booking reservations
- **Performance-First 3D**: GPU-accelerated animations with graceful degradation

## ✨ **Key Features**

### 🤖 **AI-Powered Decision Engine**
- **Conversational AI**: Natural language restaurant queries powered by Yelp AI
- **Autonomous Decision Making**: AI picks the best restaurant and books it automatically
- **Context Awareness**: Maintains conversation history and user preferences
- **Agentic Actions**: AI can take actions beyond just recommendations

### 🎨 **Neo-Brutalism Design System**
- **Bold Visual Language**: 4px black borders, chunky shadows, high contrast
- **Interactive Elements**: 3D hover effects, press animations, shadow enhancements
- **Accessibility-First**: WCAG 2.1 AA compliant with reduced motion support
- **Responsive Design**: Mobile-first approach with device-specific optimizations

### 🎭 **3D Animation System**
- **Floating Geometric Shapes**: GPU-accelerated 3D elements with physics
- **Interactive Hover Effects**: Cards tilt and lift with realistic shadows
- **Parallax Scrolling**: Multi-layer depth effects during scroll
- **Performance Monitoring**: Real-time FPS tracking with adaptive optimization

### 🔐 **Enterprise-Grade Features**
- **Firebase Authentication**: Secure user management with social login
- **Real-time Database**: Firestore integration for conversation history
- **Automated Booking**: Direct integration with Yelp Reservations API
- **Error Recovery**: Comprehensive error handling and fallback strategies

## 🛠️ **Technology Stack**

### **Frontend Architecture**
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript 5.0 with strict mode
- **Styling**: Tailwind CSS with custom design tokens
- **Animations**: CSS transforms with GPU acceleration
- **State Management**: React Context with custom hooks

### **Backend Integration**
- **AI Engine**: Yelp AI API for conversational intelligence
- **Business Data**: Yelp Places API (32 countries, millions of venues)
- **Reservations**: Yelp Reservations API (US & Canada coverage)
- **Authentication**: Firebase Auth with JWT tokens
- **Database**: Firebase Firestore with real-time sync

### **Performance & Monitoring**
- **Build System**: Webpack 5 with advanced optimizations
- **Image Optimization**: Next.js Image with WebP support
- **Code Splitting**: Route-based and component-based splitting
- **Performance Monitoring**: Real-time FPS and memory tracking
- **Analytics**: Custom event tracking and user behavior analysis

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ or Bun 1.0+
- Yelp API credentials
- Firebase project setup

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/pick-for-me.git
   cd pick-for-me
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # Using bun (recommended for faster installs)
   bun install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   # Yelp API Configuration
   YELP_API_KEY=your_yelp_api_key_here
   YELP_CLIENT_ID=your_yelp_client_id_here
   
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # Application Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NODE_ENV=development
   ```

4. **Firebase Setup**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase (if not already done)
   firebase init
   ```

5. **Run the development server**
   ```bash
   # Using npm
   npm run dev
   
   # Using bun
   bun dev
   
   # Using yarn
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### **Development Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
```

## 🎯 **How to Use**

### **For New Users**
1. **Landing Experience**: Enjoy the 3D animated landing page with floating geometric shapes
2. **Sign Up**: Create an account using email or social login
3. **Onboarding**: Complete the preference questionnaire for personalized recommendations

### **Making Decisions**
1. **Start a Conversation**: Click "Get Started" or use the chat interface
2. **Natural Language Queries**: Ask questions like:
   - *"Find me a good Italian place for dinner tonight"*
   - *"I need somewhere romantic for a date"*
   - *"Pick a restaurant for a business lunch downtown"*
   - *"Find me the best sushi place within 10 minutes"*
3. **AI Analysis**: Watch as the AI processes thousands of data points
4. **Autonomous Decision**: Receive a single, perfect recommendation
5. **Instant Booking**: AI automatically books your table if available

### **Advanced Features**
- **Location Intelligence**: Automatic GPS detection with manual override
- **Preference Learning**: AI adapts to your taste over time
- **Conversation History**: Access past decisions and bookings
- **Real-time Updates**: Get notified about booking confirmations
- **Fallback Options**: Alternative suggestions if primary choice unavailable

### **Accessibility Features**
- **Reduced Motion**: Respects system preferences for motion sensitivity
- **Keyboard Navigation**: Full keyboard accessibility support
- **Screen Reader**: ARIA labels and semantic HTML structure
- **High Contrast**: Excellent color contrast ratios (4.5:1+)

## 🏗️ **Application Architecture**

### **System Overview**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Layer     │    │   External      │
│                 │    │                 │    │   Services      │
│ • Next.js 14    │◄──►│ • Rate Limiting │◄──►│ • Yelp AI API   │
│ • React 18      │    │ • Error Handler │    │ • Yelp Places   │
│ • 3D Animations │    │ • Retry Logic   │    │ • Yelp Booking  │
│ • Neo-Brutalism │    │ • Caching       │    │ • Firebase      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Core Components**

#### **Landing Page Components**
- **`HeroSection`**: 3D animated hero with entrance effects
- **`FeatureShowcase`**: Interactive cards with tilt animations
- **`CTASection`**: Call-to-action with enhanced 3D buttons
- **`FloatingShapes`**: GPU-accelerated geometric animations
- **`GridBackground`**: Animated background with depth effects

#### **Application Interface**
- **`ChatInterface`**: Main conversational UI with typing indicators
- **`ConversationSidebar`**: Chat history with scroll animations
- **`AIDecisionCard`**: Restaurant recommendation display
- **`BookingModal`**: Reservation interface with confirmation
- **`SmartInsightsPanel`**: Analytics and preference insights

#### **Authentication & Onboarding**
- **`LoginForm`**: Firebase authentication with social login
- **`RegisterForm`**: Account creation with validation
- **`OnboardingQuestionnaire`**: Preference collection interface
- **`UserProfile`**: Account management and settings

#### **3D Animation System**
- **`AnimationController`**: Centralized animation management
- **`PerformanceMonitor`**: Real-time FPS and memory tracking
- **`FloatingShapes`**: 3D geometric elements with physics
- **`Interactive3DButton`**: Enhanced button interactions
- **`ParallaxContainer`**: Multi-layer scrolling effects

### **Data Flow Architecture**
```
User Input → UI Components → Business Logic → API Integration → External Services
     ↓              ↓              ↓              ↓              ↓
Animation     State Updates    Decision Engine   Rate Limiting   Yelp AI
Triggers      Context Sync     Booking Logic     Error Handling  Firebase
```

### **Performance Optimization**
- **Code Splitting**: Route and component-based splitting
- **Image Optimization**: Next.js Image with WebP conversion
- **Animation Optimization**: GPU acceleration with fallbacks
- **Caching Strategy**: API response caching and state persistence
- **Bundle Analysis**: Webpack Bundle Analyzer integration

## 🚀 **Deployment**

### **Production Build**
```bash
# Build the application
npm run build

# Start production server
npm start

# Or deploy to Vercel (recommended)
vercel --prod
```

### **Deployment Platforms**

#### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add YELP_API_KEY
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY
# ... add all other environment variables
```

#### **Netlify**
```bash
# Build command
npm run build

# Publish directory
out
```

#### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **Environment Variables**

#### **Required Variables**
```env
# Yelp API (Required)
YELP_API_KEY=your_yelp_api_key
YELP_CLIENT_ID=your_yelp_client_id

# Firebase (Required)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Application (Required)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### **Optional Variables**
```env
# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Performance Monitoring
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# Feature Flags
NEXT_PUBLIC_ENABLE_3D_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_VOICE_INPUT=false
```

## 🧪 **Testing**

### **Test Suite**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run visual regression tests
npm run test:visual
```

### **Testing Strategy**
- **Unit Tests**: Jest + React Testing Library
- **Property-Based Tests**: fast-check for 3D animations
- **E2E Tests**: Playwright for user journeys
- **Visual Regression**: Chromatic for UI consistency
- **Performance Tests**: Lighthouse CI integration
- **Accessibility Tests**: axe-core automation

## 📊 **Performance Metrics**

### **Core Web Vitals Targets**
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### **Animation Performance**
- **Desktop**: 60fps target
- **Mobile**: 30fps minimum
- **Memory Usage**: < 50MB additional
- **GPU Utilization**: Optimized transforms

## 🎉 **Demo & Showcase**

### **Live Demo**
🔗 **[View Live Demo](https://pickforme.vercel.app)**

### **Key Demo Features**
- **3D Landing Page**: Floating geometric shapes with physics
- **Conversational AI**: Natural language restaurant queries
- **Autonomous Booking**: AI makes decisions and books automatically
- **Neo-Brutalism Design**: Bold, accessible, and modern UI
- **Performance Optimization**: 60fps animations with graceful degradation

### **Demo Scenarios**
1. **Business Traveler**: "Find me a professional restaurant for a client dinner"
2. **Date Night**: "Pick somewhere romantic for dinner tonight"
3. **Quick Lunch**: "I need a fast, healthy lunch option nearby"
4. **Group Dining**: "Find a place for 8 people with dietary restrictions"

## 🤝 **Contributing**

### **Development Workflow**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Run the test suite: `npm test`
6. Commit with conventional commits: `git commit -m "feat: add amazing feature"`
7. Push to your branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### **Code Standards**
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration with custom rules
- **Prettier**: Consistent code formatting
- **Husky**: Pre-commit hooks for quality checks

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Yelp API**: For providing comprehensive business data and AI capabilities
- **Firebase**: For authentication and real-time database services
- **Next.js Team**: For the incredible React framework
- **Tailwind CSS**: For the utility-first CSS framework
- **React Team**: For the amazing component library

---

<div align="center">

**Built with ❤️ for the future of autonomous decision-making**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/pick-for-me)

</div>