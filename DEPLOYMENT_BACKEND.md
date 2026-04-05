# 🚀 Deployment Guide — Vercel Backend Setup

## Overview

Your TruthBot app now has **backend API functions** running on Vercel for secure API key management. Users don't need to enter their own API keys anymore!

## Architecture

```
┌─────────────────────────┐
│  User's Browser         │
│  (Frontend HTML/CSS/JS) │
└────────┬────────────────┘
         │ fetch('/api/analyze')
         │ fetch('/api/chat')
         │
         ▼
┌─────────────────────────────────────┐
│  Vercel Serverless Functions        │
│  - api/analyze.js                   │
│  - api/chat.js                      │
│  (Has GEMINI_API_KEY env var)       │
└────────┬────────────────────────────┘
         │ Uses hidden API key
         │
         ▼
┌─────────────────────────┐
│  Google Gemini API      │
│  + Google News API      │
└─────────────────────────┘
```

## Step 1: Push Code to Git

✅ Already done! Your changes are committed.

## Step 2: Set Up Vercel Environment Variables

You need to add your **API keys to Vercel** so the backend functions can access them:

### Option A: Via Vercel Dashboard (Recommended)

1. Go to [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your TruthBot project
3. Navigate to **Settings** → **Environment Variables**
4. Add two variables:

```
Variable Name: GEMINI_API_KEY
Value: AIzaSyD3iL0a9ZmDhbZZ-U902T8oYqb0F0jNq1M

Variable Name: NEWS_API_KEY  
Value: 942795ec40c040e989cba7eb388d2292
```

5. Select which environments (Production, Preview, Development)
6. Click "Save"

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Link your project
vercel link

# Add environment variables
vercel env add GEMINI_API_KEY
# Paste your Gemini API key when prompted

vercel env add NEWS_API_KEY
# Paste your News API key when prompted
```

## Step 3: Deploy to Vercel

```bash
# Push to Git (already done ✅)
git push

# Vercel auto-deploys on push, OR manually deploy:
vercel deploy --prod
```

## Step 4: Verify Deployment

After deployment:

1. Go to your Vercel deployment URL (shown in dashboard)
2. Open the browser DevTools (F12)
3. Go to **Network** tab
4. Send a message in the chat
5. Look for requests to `/api/analyze` or `/api/chat`
6. Should see `200 OK` response ✅

## Testing During Local Development

To test locally before deploying:

```bash
# Option 1: Use Python HTTP server + local Node.js backend
# Terminal 1:
python -m http.server 8000

# Terminal 2 (Install Vercel Functions locally)
npm install -g vercel
vercel dev

# Visit: http://localhost:3000
```

## Troubleshooting

### "Gemini API key not configured"

- Check that `GEMINI_API_KEY` is added to Vercel environment variables
- Redeploy: `vercel deploy --prod`
- Wait 2-3 minutes for environment to update

### API requests returning 500 errors

- Check Vercel function logs: Dashboard → Deployments → Logs
- Ensure both `GEMINI_API_KEY` and `NEWS_API_KEY` are set
- Verify API keys are valid and haven't expired

### "Cannot find module 'fetch'"

- The functions use native `fetch()` available in Node.js 18+
- Vercel uses Node.js 18+ by default ✅

## Files Changed

```
api/
├── analyze.js          ← NEW: Fact-checking backend
└── chat.js             ← NEW: Chat backend

js/
├── api.js              ← UPDATED: Calls backend instead of Gemini
└── config.js           ← UPDATED: Simplified (no modal needed)

vercel.json            ← UPDATED: Configure Node.js builds
```

## Benefits

✅ **Secure**: API keys never exposed to frontend  
✅ **Scalable**: Handle more users with shared quota  
✅ **Free**: Vercel's free tier includes serverless functions  
✅ **Easy**: Users just visit the URL, no setup needed  

## Next Steps

1. ✅ Push code to Git (done)
2. ⏭️ Add environment variables to Vercel
3. ⏭️ Deploy
4. ⏭️ Test at your deployment URL
5. Share the link! 🎉

## Deployment URL

After deploying, your app will be at:
```
https://<your-project-name>.vercel.app
```

## Recovery: Rollback to Frontend-Only Mode

If you want to revert to users entering their own API keys:

```bash
git revert HEAD
vercel deploy --prod
```

---

Need help? Check Vercel docs: https://vercel.com/docs/concepts/functions/serverless-functions
