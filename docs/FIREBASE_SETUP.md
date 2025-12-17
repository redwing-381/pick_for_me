# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for the Pick For Me application.

## Prerequisites

- Node.js and npm installed
- A Google account
- Firebase CLI (optional, for emulator)

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "pick-for-me-auth")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click on the "Get started" button
3. Go to the "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click on it and toggle "Enable"
   - **Google**: Click on it, toggle "Enable", and add your project's support email

## Step 3: Get Firebase Configuration

1. In your Firebase project console, click on the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click on the web icon (`</>`) to add a web app
4. Enter your app name (e.g., "Pick For Me Web")
5. Check "Also set up Firebase Hosting" if you plan to deploy (optional)
6. Click "Register app"
7. Copy the Firebase configuration object

## Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Update the Firebase configuration in `.env.local`:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # Firebase Emulator Configuration (Development)
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
   NEXT_PUBLIC_FIREBASE_EMULATOR_HOST=localhost
   NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_PORT=9099
   ```

## Step 5: Development with Firebase Emulator (Optional)

For local development, you can use the Firebase Emulator:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init emulators
   ```
   - Select "Authentication Emulator"
   - Use default ports (Auth: 9099, UI: 4000)

4. Set emulator mode in `.env.local`:
   ```env
   NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true
   ```

5. Start development with emulator:
   ```bash
   npm run dev:emulator
   ```

   Or start emulator separately:
   ```bash
   npm run firebase:emulator
   ```

## Step 6: Configure Authentication Settings

### Email/Password Settings

1. In Firebase Console → Authentication → Settings
2. Configure "Authorized domains" to include:
   - `localhost` (for development)
   - Your production domain

### Email Templates (Optional)

1. Go to Authentication → Templates
2. Customize email verification and password reset templates
3. Set your app name and support email

## Step 7: Security Rules (Production)

For production, consider setting up Firebase Security Rules:

1. Go to Firebase Console → Authentication → Settings
2. Configure user management settings
3. Set up appropriate security rules for your use case

## Verification

To verify your setup is working:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Check the browser console for Firebase status logs
3. Try registering a new user
4. Check the Firebase Console → Authentication → Users to see registered users

## Troubleshooting

### Common Issues

1. **"Firebase not configured" warning**:
   - Ensure all environment variables are set correctly
   - Check that values are not placeholder text

2. **Emulator connection issues**:
   - Ensure Firebase CLI is installed and logged in
   - Check that emulator ports are not in use
   - Verify `firebase.json` configuration

3. **Authentication errors**:
   - Check Firebase Console for error logs
   - Verify authorized domains include your development domain
   - Ensure authentication providers are enabled

### Environment Variables Checklist

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

## Next Steps

After completing this setup:

1. Test the authentication flow
2. Implement user registration and login components
3. Set up protected routes
4. Configure email verification
5. Implement password reset functionality

For more detailed implementation, refer to the authentication components in the `src/components/auth/` directory.