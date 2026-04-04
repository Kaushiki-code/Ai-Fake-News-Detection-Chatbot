# Deploying to Vercel

## Step 1: Push Your Code to GitHub
```bash
git add .
git commit -m "Add Gemini API integration"
git push origin main
```

## Step 2: Connect to Vercel

### Option A: Import from GitHub (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub repo
4. In **Root Directory**, enter: `frontend`
5. Click **Continue**

### Option B: Use Vercel CLI
```bash
npm i -g vercel
cd /path/to/your/project
vercel
```

## Step 3: Add Environment Variable

**IMPORTANT:** Before deploying, you MUST add your Gemini API key to Vercel!

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `AIzaSy...YOUR_ACTUAL_KEY...`
   - **Environments:** Check **Production**, **Preview**, **Development**
3. Click **Save**

## Step 4: Deploy

1. Go back to **Deployments** tab
2. Click the most recent deployment
3. Click **Redeploy** (or just commit again to trigger auto-deploy)

---

## Verifying Deployment

After deployment completes:

1. Visit your Vercel URL (e.g., `yourapp.vercel.app`)
2. The app should load without asking for API key (it reads from environment)
3. Try analyzing news - it should use your Gemini key from the environment

---

## Troubleshooting

### "API key not set" error on Vercel?
- ✅ Check Environment Variables are set correctly
- ✅ Check variable name is exactly `GEMINI_API_KEY`
- ✅ Redeploy after adding the variable
- ✅ Clear browser cache and refresh

### "Rate limited" error?
- This shouldn't happen with Gemini - you have unlimited free requests
- Check your Gemini API key is valid at [makersuite.google.com](https://makersuite.google.com/app/apikey)

### Local development not working?
- Create `.env.local` file in `frontend/` folder
- Add: `GEMINI_API_KEY=AIzaSy...YOUR_KEY...`
- Refresh browser

---

## Environment Variables Priority

The app loads API key in this order:

1. **`.env.local`** (local development) ← Use this for local testing
2. **Vercel Environment Variable** (production) ← Use this for Vercel
3. **Modal input** (fallback) ← Only if above fail
4. **localStorage** (cached) ← If user entered it before

