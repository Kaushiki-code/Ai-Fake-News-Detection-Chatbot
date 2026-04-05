# 🚀 Secure Deployment Guide - Vercel Backend

## ⚠️ SECURITY ALERT

Your old API keys have been **exposed in git history**. You need **new API keys**:

### Step 1: Create New API Keys (REQUIRED)

#### Gemini API Key
1. Go to: https://makersuite.google.com/app/apikey
2. Sign in with Google
3. Click **"Create API Key"** (free tier available)
4. Copy the new key
5. ✅ Mark old key as exposed in Google Cloud console

#### News API Key
1. Go to: https://newsapi.org/register
2. Sign up (free tier available)
3. Copy your API key
4. ✅ Mark old key as exposed

---

## Step 2: Add Keys to Vercel (NOT in Git)

### Option A: Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard:**
   - https://vercel.com/dashboard

2. **Select Your Project:** `ai-project`

3. **Settings → Environment Variables**

4. **Add Variables:**
   ```
   GEMINI_API_KEY = [YOUR_NEW_GEMINI_KEY]
   NEWS_API_KEY = [YOUR_NEW_NEWS_KEY]
   ```

5. **Select Environments:**
   - ☑️ Production
   - ☑️ Preview
   - ☑️ Development

6. **Save** ✅

### Option B: Vercel CLI

```bash
vercel env add GEMINI_API_KEY
# Paste your new Gemini key when prompted

vercel env add NEWS_API_KEY
# Paste your new News API key when prompted
```

---

## Step 3: Push to Vercel

```bash
git add .
git commit -m "🔐 Security: Replace exposed API keys with secure env variables"
git push
```

**Vercel auto-deploys** → your app will use the backend functions with secure keys ✅

---

## Step 4: Verify Deployment

After deployment:

1. **Visit your Vercel URL** (e.g., `https://ai-project.vercel.app`)
2. **Open DevTools** (F12)
3. **Go to Network tab**
4. **Send a message in chat**
5. **Check requests:**
   - Look for `/api/analyze` or `/api/chat`
   - Should see `200 OK` ✅
   - Response should have `verdict`, `confidence` fields

---

## File Structure (Safe for Git)

```
✅ SAFE TO COMMIT:
├── index.html
├── js/
│   ├── api.js (calls backend)
│   ├── config.js (updated for backend)
│   └── ...
├── css/
├── api/
│   ├── analyze.js (uses process.env)
│   └── chat.js (uses process.env)
├── vercel.json
├── .gitignore ✅
├── .env ✅ (has placeholders, not real keys)
└── .env.local ✅ (in .gitignore)

❌ NOT COMMITTED:
├── .env (in .gitignore) - Local only
├── .env.local (in .gitignore) - Local only
├── node_modules/
└── .vercel/
```

---

## Local Testing (Before Deploying)

1. **Get your new API keys** (Step 1 above)

2. **Fill in `.env` file:**
   ```bash
   GEMINI_API_KEY=AIzaSy_YOUR_NEW_KEY_HERE
   NEWS_API_KEY=your_new_news_key_here
   ```

3. **Start local dev:**
   ```bash
   vercel dev
   ```

4. **Test at:** http://localhost:3000

---

## How Backend Functions Work

```
User Browser
    ↓ fetch('/api/analyze')
    ↓
Vercel Function (api/analyze.js)
    ↓ reads process.env.GEMINI_API_KEY (SECURE)
    ↓
Google Gemini API
    ↓
Response (verdict JSON)
    ↓
User Browser (no API key exposed)
```

**Benefits:**
- ✅ API keys never exposed to frontend
- ✅ Users don't need to enter keys
- ✅ Everyone shares the same quota
- ✅ Production ready

---

## Troubleshooting

### "Cannot find module 'fetch'"
- **Fix:** Make sure `api/*.js` files use `module.exports` not `export default`
- Status: ✅ Fixed

### "ChatFailed: Unexpected token '<'"
- **Problem:** Backend functions returning HTML (404)
- **Fix:** Check environment variables are set in Vercel dashboard
- **Verify:** Go to Deployments → Logs and check for errors

### "Gemini API error: 403"
- **Problem:** Old API key is still in use
- **Fix:** Create a NEW key (Step 1) and update in Vercel
- **Verify:** Check env vars in Vercel dashboard match

### "ENV variables not found"
- **Problem:** Variables not set in Vercel
- **Fix:** Go to Settings → Environment Variables and add them again
- **Verify:** Run `vercel env pull` to confirm

---

## Security Checklist

- ✅ `.env` file has `.gitignore` entry
- ✅ `.env.local` has `.gitignore` entry
- ✅ API keys never appear in `*.js` files
- ✅ API keys stored in `process.env` (backend only)
- ✅ Vercel environment variables configured
- ✅ Old exposed keys marked as compromised
- ✅ New API keys generated
- ✅ Frontend calls `/api/*` routes (not direct Gemini calls)

---

## Next Steps

1. ✅ Create new API keys (Step 1)
2. ⏭️ Add to Vercel environment variables (Step 2)
3. ⏭️ Push to GitHub (Step 3)
4. ⏭️ Verify deployment (Step 4)
5. 🎉 Share the live URL!

---

## Emergency: Revoke Old Keys

If keys are compromised:

**Google Cloud Console:**
- Go to https://console.cloud.google.com
- API Keys section
- Delete/disable the old key

**NewsAPI:**
- Go to https://newsapi.org/account
- Manage your keys
- Delete the old key

---

**Questions?** Check Vercel docs: https://vercel.com/docs/concepts/projects/environment-variables
