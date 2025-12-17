---
inclusion: manual
---

# Yelp API Complete Reference Guide

This document provides a comprehensive reference for all available Yelp API endpoints and their potential use cases in the Pick For Me application.

## Table of Contents

1. [Core Search & AI APIs](#core-search--ai-apis)
2. [Business Information APIs](#business-information-apis)
3. [Authentication & OAuth](#authentication--oauth)
4. [Partner & Order Management APIs](#partner--order-management-apis)
5. [Lead Management APIs](#lead-management-apis)
6. [Events & Categories APIs](#events--categories-apis)
7. [Implementation Recommendations](#implementation-recommendations)

---

## Core Search & AI APIs

### ✅ Currently Implemented

#### Yelp AI API (Search & Chat)
- **Endpoint**: `POST https://api.yelp.com/ai/chat/v2`
- **Status**: ✅ **IMPLEMENTED**
- **Use Case**: Primary conversational AI for restaurant recommendations
- **Parameters**: `query`, `location`, `request_context`
- **Implementation**: `src/lib/yelp-client.ts` - `chatWithAI()`

#### Business Search
- **Endpoint**: `GET https://api.yelp.com/v3/businesses/search`
- **Status**: ✅ **IMPLEMENTED**
- **Use Case**: Fallback search and additional restaurant discovery
- **Parameters**: `location`, `term`, `categories`, `price`, `radius`, `limit`, `sort_by`
- **Implementation**: `src/lib/yelp-client.ts` - `searchBusinesses()`

### 🔄 Available for Enhancement

#### Phone Search
- **Endpoint**: `GET https://api.yelp.com/v3/businesses/search/phone`
- **Potential Use**: Find restaurants by phone number for verification
- **Use Case**: User provides restaurant phone number to find specific venue

#### Business Match
- **Endpoint**: `GET https://api.yelp.com/v3/businesses/matches`
- **Potential Use**: Match user-provided restaurant names to Yelp businesses
- **Use Case**: "I want to book at Tony's Italian" → find exact match

#### Autocomplete
- **Endpoint**: `GET https://api.yelp.com/v3/autocomplete`
- **Potential Use**: Search suggestions as user types
- **Use Case**: Enhanced UX with real-time search suggestions

---

## Business Information APIs

### Business Details
- **Endpoint**: `GET https://api.yelp.com/v3/businesses/{business_id_or_alias}`
- **Potential Use**: Get comprehensive restaurant information
- **Use Case**: Enhanced restaurant cards with full details, hours, attributes

### Reviews
- **Endpoint**: `GET https://api.yelp.com/v3/businesses/{business_id_or_alias}/reviews`
- **Potential Use**: Show actual customer reviews
- **Use Case**: Help users make informed decisions with real feedback

### Review Highlights
- **Endpoint**: `GET https://api.yelp.com/v3/businesses/{business_id_or_alias}/review_highlights`
- **Potential Use**: Show key review insights
- **Use Case**: Quick summary of what customers love/dislike

### Business Insights
- **Endpoint**: `GET https://api.yelp.com/v3/businesses/insights`
- **Potential Use**: Analytics and trending data
- **Use Case**: Recommend trending restaurants, popular times

### Food & Drinks Insights
- **Endpoint**: `GET https://api.yelp.com/v3/businesses/{business_id_or_alias}/insights/food_and_drinks`
- **Potential Use**: Menu insights and dietary information
- **Use Case**: Better matching for dietary restrictions, popular dishes

### Risk Signal Insights
- **Endpoint**: `GET https://api.yelp.com/v3/businesses/{business_id_or_alias}/insights/risk_signals`
- **Potential Use**: Safety and reliability indicators
- **Use Case**: Avoid recommending problematic venues

### Service Offerings
- **Endpoint**: `GET https://api.yelp.com/v3/businesses/{business_id_or_alias}/service_offerings`
- **Potential Use**: Available services (delivery, takeout, reservations)
- **Use Case**: Filter by available services, show delivery options

### Engagement Metrics
- **Endpoint**: `GET https://api.yelp.com/v3/businesses/engagement`
- **Potential Use**: Popularity and engagement data
- **Use Case**: Recommend highly engaged restaurants

---

## Authentication & OAuth

### Get Access Token v2
- **Endpoint**: `POST https://api.yelp.com/oauth2/token`
- **Use Case**: OAuth flow for user authentication
- **Implementation Need**: If we want users to connect their Yelp accounts

### Revoke Access Token
- **Endpoint**: `POST https://api.yelp.com/oauth2/revoke`
- **Use Case**: Logout functionality
- **Implementation Need**: User account management

### Get Access Token v3
- **Endpoint**: `POST https://api.yelp.com/oauth2/token/v3`
- **Use Case**: Updated OAuth flow
- **Implementation Need**: Modern authentication

---

## Partner & Order Management APIs

*Note: These require partner-level access and are primarily for restaurant owners*

### Business Updates
- **Endpoint**: `POST https://partner-api.yelp.com/v1/ingest/create`
- **Use Case**: Update business information
- **Relevance**: Low for Pick For Me (consumer app)

### Order Management
- **Endpoints**: 
  - `POST https://partner-api.yelp.com/checkout/orders/create/v3`
  - `PUT https://partner-api.yelp.com/checkout/orders/{yelp_order_id}/update/v3`
  - `POST https://partner-api.yelp.com/checkout/orders/{yelp_order_id}/cancel/v3`
- **Use Case**: Food delivery/pickup orders
- **Potential Enhancement**: Integrate food ordering alongside reservations

### Order Status & Tracking
- **Endpoints**: Various order status endpoints
- **Use Case**: Track delivery orders
- **Potential Enhancement**: Complete food ordering experience

---

## Lead Management APIs

*Note: These are for business owners to manage customer inquiries*

### Lead Operations
- **Endpoints**: Various lead management endpoints
- **Use Case**: Business-side customer relationship management
- **Relevance**: Low for Pick For Me (consumer-focused)

---

## Events & Categories APIs

### Event Search
- **Endpoint**: `GET https://api.yelp.com/v3/events`
- **Potential Use**: Find dining events, food festivals
- **Use Case**: "Find restaurants with live music tonight"

### Event Details
- **Endpoint**: `GET https://api.yelp.com/v3/events/{event_id}`
- **Potential Use**: Detailed event information
- **Use Case**: Enhanced recommendations with events

### Featured Events
- **Endpoint**: `GET https://api.yelp.com/v3/events/featured`
- **Potential Use**: Highlight special dining events
- **Use Case**: "What's happening this weekend?"

### Categories
- **Endpoint**: `GET https://api.yelp.com/v3/categories`
- **Potential Use**: Dynamic cuisine type filtering
- **Use Case**: More accurate categorization than hardcoded lists

### Category Details
- **Endpoint**: `GET https://api.yelp.com/v3/categories/{alias}`
- **Potential Use**: Detailed category information
- **Use Case**: Better understanding of cuisine types

---

## Implementation Recommendations

### High Priority Enhancements

1. **Business Details Integration**
   ```typescript
   // Enhance restaurant cards with full details
   async getBusinessDetails(businessId: string): Promise<BusinessDetails>
   ```

2. **Reviews Integration**
   ```typescript
   // Show customer reviews in restaurant cards
   async getBusinessReviews(businessId: string): Promise<Review[]>
   ```

3. **Autocomplete Search**
   ```typescript
   // Add search suggestions
   async getAutocomplete(text: string): Promise<Suggestion[]>
   ```

### Medium Priority Enhancements

4. **Food & Drinks Insights**
   ```typescript
   // Better dietary restriction matching
   async getFoodInsights(businessId: string): Promise<FoodInsights>
   ```

5. **Events Integration**
   ```typescript
   // Find restaurants with events
   async searchEvents(location: Location): Promise<Event[]>
   ```

6. **Service Offerings**
   ```typescript
   // Filter by delivery, takeout, etc.
   async getServiceOfferings(businessId: string): Promise<ServiceOfferings>
   ```

### Future Considerations

7. **Order Management** (Requires Partner Access)
   - Food delivery integration
   - Pickup order management
   - Complete dining experience

8. **OAuth Integration**
   - User account management
   - Personalized recommendations
   - Saved preferences

### Implementation Strategy

#### Phase 1: Enhanced Information
- Business Details API for richer restaurant cards
- Reviews API for customer feedback
- Review Highlights for quick insights

#### Phase 2: Better Discovery
- Autocomplete for search suggestions
- Food & Drinks Insights for dietary matching
- Service Offerings for filtering

#### Phase 3: Events & Experiences
- Events API for special occasions
- Categories API for dynamic filtering
- Business Insights for trending recommendations

#### Phase 4: Advanced Features
- OAuth for user accounts
- Order Management (if partner access available)
- Lead Management (for business features)

---

## Code Examples

### Enhanced Business Details
```typescript
// Get comprehensive business information
const businessDetails = await yelpClient.getBusinessDetails(businessId);

// Enhanced restaurant card with full details
<RestaurantCard 
  restaurant={businessDetails}
  reviews={await yelpClient.getBusinessReviews(businessId)}
  highlights={await yelpClient.getReviewHighlights(businessId)}
  insights={await yelpClient.getFoodInsights(businessId)}
/>
```

### Search with Autocomplete
```typescript
// Real-time search suggestions
const suggestions = await yelpClient.getAutocomplete(userInput);

// Enhanced search experience
<SearchInput 
  onInput={(text) => getSuggestions(text)}
  suggestions={suggestions}
/>
```

### Events Integration
```typescript
// Find restaurants with events
const events = await yelpClient.searchEvents({
  location: userLocation,
  categories: ['food', 'nightlife']
});

// Show restaurants with special events
const restaurantsWithEvents = events
  .filter(event => event.attending_count > 50)
  .map(event => event.business);
```

---

## Notes for Future Development

1. **API Rate Limits**: Monitor usage across all endpoints
2. **Partner Access**: Some features require business partnership
3. **OAuth Flow**: User authentication enables personalized features
4. **Data Consistency**: Ensure consistent data models across endpoints
5. **Error Handling**: Implement robust error handling for all endpoints
6. **Caching Strategy**: Cache frequently accessed data (categories, business details)
7. **Performance**: Batch requests where possible to minimize API calls

This reference provides a roadmap for enhancing Pick For Me with Yelp's full API capabilities while maintaining focus on the core user experience of autonomous restaurant selection and booking.