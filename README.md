# Pick For Me - AI-Powered Travel Assistant

An intelligent travel companion that makes autonomous decisions for your travel needs. Built with Next.js 14, TypeScript, and Yelp AI API integration.

## 🚀 Features

- **Conversational AI**: Natural language travel queries powered by Yelp AI
- **Autonomous Decision Making**: AI picks the best options for you automatically
- **Multi-Category Travel**: Hotels, restaurants, attractions, transportation
- **Location Intelligence**: GPS detection and smart location resolution
- **Booking Integration**: Seamless reservation coordination
- **Responsive Design**: Works perfectly on mobile and desktop

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **AI Integration**: Yelp AI API for conversational intelligence
- **State Management**: React Context with useReducer
- **Performance**: Optimized caching, lazy loading, and performance monitoring

## 🏃‍♂️ Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pick-for-me
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Add your Yelp API key to .env
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   bun dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How to Use

1. **Set Your Location**: Use GPS detection or manually enter your location
2. **Ask for Anything**: Type natural language queries like:
   - "Find me a hotel in downtown Miami"
   - "What's a good Italian restaurant for dinner?"
   - "Show me attractions in New York"
   - "Plan a 3-day trip to Los Angeles"
3. **Get AI Decisions**: The system autonomously picks the best options
4. **Book Instantly**: Complete reservations through integrated booking

## 🏗️ Architecture

- **API Routes**: RESTful endpoints for chat, location, booking, and decisions
- **Components**: Reusable UI components with responsive design
- **Services**: Business logic for travel planning and booking coordination
- **Error Handling**: Comprehensive error recovery and user guidance

## 📱 Core Components

- **ChatInterface**: Main conversational UI
- **LocationInput**: GPS detection and manual entry
- **RestaurantCard**: Business information display
- **TravelRecommendationCard**: Multi-category travel options
- **BookingModal**: Reservation interface

## 🚀 Deployment

The app is optimized for production deployment on Vercel, Netlify, or any Node.js hosting platform.

```bash
npm run build
npm start
```

## Environment Variables

- `YELP_API_KEY`: Your Yelp API key
- `YELP_CLIENT_ID`: Your Yelp client ID (optional)
- `NEXT_PUBLIC_APP_URL`: Application URL (default: http://localhost:3000)

## 🎉 Demo Ready

This application is production-ready and perfect for demonstrations. It showcases:
- Advanced AI conversation capabilities
- Autonomous decision-making algorithms
- Modern web development practices
- Responsive user experience design

---

**Built for the future of travel planning** 🌟