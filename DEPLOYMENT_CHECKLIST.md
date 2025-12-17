# Quick Deployment Checklist

## Before Deployment

- [ ] **Test build locally**
  ```bash
  bun run build
  ```

- [ ] **Check all environment variables are set**
  - YELP_API_KEY
  - YELP_CLIENT_ID
  - All Firebase variables (6 total)

- [ ] **Firebase Console Setup**
  - [ ] Enable Email/Password authentication
  - [ ] Enable Google OAuth (if using)
  - [ ] Add production domain to authorized domains
  - [ ] Customize email templates

- [ ] **Test locally in production mode**
  ```bash
  bun run build
  bun run start
  ```

## Deployment Steps (Vercel - Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your GitHub repository
   - Add environment variables
   - Click "Deploy"

3. **Add Environment Variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add each variable from your `.env` file
   - Select "Production", "Preview", and "Development"

## After Deployment

- [ ] **Test all features on production**
  - [ ] Landing page loads
  - [ ] Registration works
  - [ ] Login works
  - [ ] Email verification works
  - [ ] Location input works
  - [ ] Chat works and returns results
  - [ ] Logout works

- [ ] **Update Firebase authorized domains**
  - Add your Vercel domain (e.g., `your-app.vercel.app`)
  - Add custom domain if you have one

- [ ] **Monitor for errors**
  - Check Vercel logs
  - Check Firebase Console for auth errors
  - Test on different devices/browsers

## Optional Enhancements

- [ ] **Add custom domain**
  - Buy domain (Namecheap, GoDaddy, etc.)
  - Add to Vercel in Settings → Domains
  - Update DNS records

- [ ] **Set up analytics**
  - Vercel Analytics (built-in)
  - Google Analytics
  - Firebase Analytics

- [ ] **Enable monitoring**
  - Sentry for error tracking
  - LogRocket for session replay

## Quick Commands

```bash
# Test build
bun run build

# Test production locally
bun run build && bun run start

# Deploy to Vercel (if using CLI)
vercel --prod

# Check for errors
bun run lint
```

## Need Help?

See `DEPLOYMENT.md` for detailed instructions!
