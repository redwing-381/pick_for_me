# Pick For Me - Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables ✅
Make sure you have all required environment variables set:

**Required:**
- `YELP_API_KEY` - Your Yelp API key
- `YELP_CLIENT_ID` - Your Yelp Client ID
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` - Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID` - Firebase app ID

**Optional:**
- `NEXT_PUBLIC_APP_URL` - Your production URL (e.g., https://pickforme.app)

### 2. Build Test 🔨
Test that your app builds successfully:

```bash
bun run build
```

If there are any errors, fix them before deploying.

### 3. Firebase Setup 🔥

**Enable Authentication Methods:**
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable:
   - Email/Password
   - Google (if using OAuth)

**Set Authorized Domains:**
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add your production domain (e.g., `pickforme.app`)

**Email Verification:**
1. Go to Firebase Console → Authentication → Templates
2. Customize email verification template if needed

### 4. Security Rules 🔒

**Firebase Security Rules:**
Make sure your Firebase security rules are set up properly for production.

---

## Deployment Options

### Option 1: Vercel (Recommended) ⚡

**Why Vercel?**
- Built for Next.js
- Automatic deployments from Git
- Free SSL certificates
- Global CDN
- Serverless functions

**Steps:**

1. **Install Vercel CLI (optional):**
   ```bash
   npm i -g vercel
   ```

2. **Connect to Git:**
   - Push your code to GitHub/GitLab/Bitbucket
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your repository

3. **Configure Environment Variables:**
   - In Vercel dashboard → Settings → Environment Variables
   - Add all variables from your `.env` file
   - Make sure to add them for Production, Preview, and Development

4. **Deploy:**
   - Vercel will automatically deploy on every push to main branch
   - Or manually deploy: `vercel --prod`

5. **Custom Domain (optional):**
   - Go to Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

**Build Settings:**
- Framework Preset: Next.js
- Build Command: `bun run build` or `npm run build`
- Output Directory: `.next`
- Install Command: `bun install` or `npm install`

---

### Option 2: Netlify 🌐

**Steps:**

1. **Connect to Git:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository

2. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Add environment variables in Site settings → Environment variables

3. **Deploy:**
   - Netlify will automatically deploy on every push

---

### Option 3: Railway 🚂

**Steps:**

1. **Connect to Git:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"

2. **Add Environment Variables:**
   - In project settings → Variables
   - Add all your environment variables

3. **Deploy:**
   - Railway will automatically build and deploy

---

### Option 4: Self-Hosted (VPS/Cloud) ☁️

**Requirements:**
- Node.js 18+ or Bun
- PM2 or similar process manager
- Nginx or similar reverse proxy

**Steps:**

1. **Build the app:**
   ```bash
   bun run build
   ```

2. **Start with PM2:**
   ```bash
   pm2 start npm --name "pickforme" -- start
   ```

3. **Configure Nginx:**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **SSL with Let's Encrypt:**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

---

## Post-Deployment Checklist

### 1. Test Core Features ✅
- [ ] Landing page loads
- [ ] User registration works
- [ ] Email verification works
- [ ] Login works
- [ ] Google OAuth works (if enabled)
- [ ] Location input works
- [ ] Chat interface works
- [ ] Yelp API returns results
- [ ] Logout works

### 2. Performance Optimization 🚀

**Enable Caching:**
- Vercel automatically handles this
- For self-hosted, configure Nginx caching

**Monitor Performance:**
- Use Vercel Analytics or Google Analytics
- Monitor Core Web Vitals

### 3. Security Checks 🔐

- [ ] HTTPS is enabled
- [ ] Environment variables are not exposed
- [ ] Firebase security rules are set
- [ ] CORS is configured properly
- [ ] Rate limiting is in place (if needed)

### 4. Monitoring & Logging 📊

**Set up monitoring:**
- Vercel: Built-in analytics
- Sentry: Error tracking
- LogRocket: Session replay
- Google Analytics: User analytics

**Firebase Monitoring:**
- Go to Firebase Console → Analytics
- Monitor authentication events
- Track user engagement

---

## Environment Variables Template

Create a `.env.production` file (don't commit this):

```bash
# Yelp API
YELP_API_KEY=your_yelp_api_key_here
YELP_CLIENT_ID=your_yelp_client_id_here

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

---

## Troubleshooting

### Build Fails
- Check Node.js version (18+)
- Clear cache: `rm -rf .next node_modules && bun install`
- Check for TypeScript errors: `bun run build`

### Firebase Auth Not Working
- Check authorized domains in Firebase Console
- Verify environment variables are set correctly
- Check browser console for errors

### Yelp API Not Working
- Verify API key is correct
- Check API rate limits
- Verify API key has proper permissions

### 404 Errors
- Make sure `next.config.js` is configured correctly
- Check that all routes are properly defined
- Verify build output includes all pages

---

## Quick Deploy Commands

**Vercel:**
```bash
vercel --prod
```

**Build locally:**
```bash
bun run build
bun run start
```

**Test production build locally:**
```bash
bun run build
bun run start
# Visit http://localhost:3000
```

---

## Support & Resources

- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel Docs:** https://vercel.com/docs
- **Firebase Docs:** https://firebase.google.com/docs
- **Yelp API Docs:** https://docs.developer.yelp.com/

---

## Success! 🎉

Once deployed, your Pick For Me app will be live and ready to help users discover amazing places!

**Share your deployment:**
- Test all features thoroughly
- Share with friends and get feedback
- Monitor analytics and user behavior
- Iterate and improve based on feedback

Good luck with your deployment! 🚀
