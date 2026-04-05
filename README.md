# TruthLens — AI Fake News Detector

> A hybrid AI-powered web app for detecting fake news with real-time article verification.
> Fact-checking powered by Google Gemini + News API.
> Deploy to Vercel with secure backend API functions! 🚀

---

## 🚀 Quick Start Guide

### **1️⃣ Setup API Keys (Required)**

#### Get Free API Keys:

**Google Gemini API:**
1. Go to: https://makersuite.google.com/app/apikey
2. Click **"Create API Key"** (free tier available)
3. Copy your key
4. ✅ Save it

**Google News API:**
1. Go to: https://newsapi.org/register
2. Sign up (free tier available)
3. Copy your key
4. ✅ Save it

---

### **2️⃣ Local Development (Test Locally)**

#### Start the Project:

```bash
# Navigate to project directory
cd "c:\Users\kaush\Desktop\AI PROJECT_"

# Option A: Using Python (Simplest)
python -m http.server 8000
# → Open: http://localhost:8000

# Option B: Using Vercel CLI (Includes Backend Functions)
npm install -g vercel  # One time only
vercel dev
# → Open: http://localhost:3000
```

#### Configure Local Keys:

Create/edit `.env.local` file:
```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
NEWS_API_KEY=YOUR_NEWS_API_KEY_HERE
```

**Note:** `.env.local` is in `.gitignore` (won't be committed) ✅

---

### **3️⃣ Production Deployment (Vercel)**

#### Step 1: Create Vercel Project

```bash
cd "c:\Users\kaush\Desktop\AI PROJECT_"
vercel
```

When prompted:
- **"Set up and deploy?"** → `Y`
- **"Create new project?"** → `Y`
- **"What's your project's name?"** → Enter a name (e.g., `fake-news-detector`)

#### Step 2: Add Environment Variables

1. Go to https://vercel.com/dashboard
2. Select your project
3. **Settings → Environment Variables**
4. Add two variables:
   ```
   GEMINI_API_KEY = [YOUR_KEY]
   NEWS_API_KEY = [YOUR_KEY]
   ```
5. Select: ☑️ Production, ☑️ Preview, ☑️ Development
6. Click **Save**

#### Step 3: Deploy

```bash
# Push to GitHub (automatic redeploy)
git push

# Or manually deploy
vercel deploy --prod
```

#### Step 4: Test Your Deployment

1. Visit your Vercel URL (shown in dashboard)
2. Send a message in the chatbot
3. Check DevTools (F12) → Network tab → `/api/analyze` request
4. Should see `200 OK` ✅

---

## 📁 Project Structure

```
AI PROJECT_/
├── index.html                   ← Main app
├── css/
│   ├── style.css                ← Global styles
│   ├── dashboard.css            ← Dashboard UI
│   └── chat.css                 ← Chat UI
├── js/
│   ├── api.js                   ← Calls /api/analyze & /api/chat
│   ├── chat.js                  ← Chat logic
│   ├── config.js                ← Config initialization
│   ├── fact-checker.js          ← Keyword extraction & caching
│   ├── app.js                   ← SPA navigation
│   ├── demo.js                  ← Demo articles
│   ├── history.js               ← Chat history
│   ├── config-env.js            ← Environment loader
│   └── env-loader.js            ← Env file loader
├── api/                         ← Backend Functions (Vercel Serverless)
│   ├── analyze.js               ← POST /api/analyze (fact-checking)
│   └── chat.js                  ← POST /api/chat (conversations)
├── vercel.json                  ← Deployment config
├── .env                         ← Local dev keys (with placeholders)
├── .env.local                   ← YOUR local keys (in .gitignore)
├── .gitignore                   ← Protects .env files ✅
├── DEPLOYMENT_SECURE.md         ← Security guide
└── README.md
```

---

## 🔑 Getting API Keys

### Google Gemini API (Required)
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) and sign in
2. Click **"Create API Key"** (FREE!)
3. Copy your API key
4. Add to `.env.local`: `GEMINI_API_KEY=AIzaSy_...`

### Google News API (Optional but Recommended)
1. Go to [newsapi.org/register](https://newsapi.org/register) and sign up (FREE)
2. Copy your News API key
3. Add to `.env.local`: `NEWS_API_KEY=...`
4. If not provided: App falls back to AI-only (still works!)

---

## 🤖 How It Works

**Hybrid Verification Pipeline:**

```
1. User submits claim
   ↓
2. Extract keywords (removes stopwords)
   ↓
3. Fetch real articles from News API
   ↓
4. Analyze articles for evidence
   ↓
5. Send to Gemini with article context
   ↓
6. Return verdict + sources + confidence
```

**Benefits:**
- ✅ AI reasoning grounded in real articles
- ✅ Prevents hallucinations
- ✅ Shows sources for verification
- ✅ Hybrid confidence scoring

---

## 🔒 Security

- ✅ API keys **never exposed** in frontend
- ✅ Backend functions use `process.env`
- ✅ `.env.local` is in `.gitignore` (protected)
- ✅ Environment variables set in Vercel dashboard (not git)
- ✅ Safe to push to public GitHub

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Vercel Serverless Functions (Node.js) |
| AI Model | Google Gemini 2.5 Flash-Lite |
| Fact-Checking | Google News API |
| Hosting | Vercel |
| Storage | Browser localStorage |

---

## 📝 Features

✅ **Hybrid Fact-Checking** — Real news articles + AI reasoning  
✅ **Real-Time Sources** — Links to matching articles  
✅ **Backend API Functions** — Secure key handling  
✅ **No Installation** — Works in any browser  
✅ **One-Click Deploy** — Vercel integration  
✅ **Chat History** — Stored locally  
✅ **Glassmorphism UI** — Modern design  

---

## 🐛 Troubleshooting

### "Chat failed: Unexpected token"
**Problem:** Backend functions not running  
**Solution:** Make sure environment variables are set in Vercel dashboard

### "Gemini API error: 403"
**Problem:** API key invalid or expired  
**Solution:** Create new API key and update in Vercel

### "Cannot connect to /api/analyze"
**Problem:** Local dev not using backend  
**Solution:** Use `vercel dev` instead of `python -m http.server`

### "ENV variables not found"
**Problem:** Variables not set in Vercel  
**Solution:** Go to Settings → Environment Variables and add them again

---

## 📚 Deployment Guides

- **Local Development:** See "Quick Start" section above
- **Production Security:** See [DEPLOYMENT_SECURE.md](DEPLOYMENT_SECURE.md)
- **Backend Functions:** See [DEPLOYMENT_BACKEND.md](DEPLOYMENT_BACKEND.md)

---

## 📄 License

MIT
```

---

## 🔑 Getting API Keys

### Google Gemini API (Required)
1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) and sign in with your Google account
2. Click **"Create API Key"** (it's FREE!)
3. Copy your API key
4. **For local development:**
   - Copy `.env.example` to `.env.local`
   - Add your Gemini key: `GEMINI_API_KEY=AIzaSy_...`
   - Or enter it in the modal when the app loads
5. **For production (Vercel):**
   - Set the environment variable `GEMINI_API_KEY` in Vercel dashboard

### Google News API (Optional - for Hybrid Fact-Checking)
1. Go to [newsapi.org/register](https://newsapi.org/register) and sign up (FREE)
2. Copy your News API key
3. **For local development:**
   - Add to `.env.local`: `NEWS_API_KEY=... key ...`
4. **For production (Vercel):**
   - Set the environment variable `NEWS_API_KEY` in Vercel dashboard
5. ℹ️ **If not provided:** App falls back to AI-only analysis (still works great!)

### ✅ Free Tier Advantages
- ✨ **Unlimited requests** (no rate limits!)
- 🚀 **Fast responses** with Gemini 2.5 Flash-Lite
- 💰 **Completely free** to use
- 📊 Better analysis quality with real-time sources

---

## 🤖 Hybrid Fact-Checking System

Your app now uses a intelligent two-layer verification approach:

### How It Works (5-Step Pipeline)

```
┌─────────────────────────────────────────────┐
│ User Claim: "President announces new policy" │
└──────────────┬──────────────────────────────┘
               │
       Step 1: Keyword Extraction
               │ (Removes stopwords, extracts key terms)
               ↓
     ┌─────────────────────┐
     │ Keywords Found:     │
     │ - President         │
     │ - Policy            │
     │ - Announcement      │
     └────────┬────────────┘
              │
     Step 2: Real-Time News Fetch
              │ (Calls Google News API)
              ↓
     ┌──────────────────────────────┐
     │ Articles Found (from News):   │
     │ 1. Reuters: President...      │
     │ 2. BBC: Policy announced...   │
     │ 3. AP News: Statement...      │
     └────────┬─────────────────────┘
              │
     Step 3: Evidence Analysis
              │ (2+ articles = evidence found)
              │ (0 articles = AI reasoning only)
              ↓
     ┌──────────────────────────────┐
     │ Evidence Status:              │
     │ ✓ Found 3 matching articles   │
     │ → Confidence: 85%              │
     └────────┬─────────────────────┘
              │
     Step 4: AI Reasoning (Gemini)
              │ (With real articles as context)
              ↓
     ┌──────────────────────────────┐
     │ Gemini Analysis:              │
     │ - Verdict: REAL              │
     │ - Type: Factual News          │
     │ - Confidence: 95%             │
     └────────┬─────────────────────┘
              │
     Step 5: Verdict Display
              │ (Show articles + analysis)
              ↓
     ┌──────────────────────────────┐
     │ ✓ REAL NEWS                  │
     │ ✓ Verified with real sources  │
     │ [Linked articles with sources]│
     └──────────────────────────────┘
```

### Key Benefits

✅ **Grounded in Reality** — Real articles from News API prevent AI hallucinations  
✅ **Faster Verification** — News API finds articles matching the claim  
✅ **Higher Confidence** — Combination of real data + AI reasoning  
✅ **Transparent Sources** — Users see the actual articles backing the verdict  
✅ **Fallback Smart** — If no articles found, AI still analyzes independently  

### What Happens Behind the Scenes

1. **News API fetches:** Up to 5 most relevant articles matching extracted keywords
2. **Cache system:** 24-hour cache prevents duplicate API calls for same claim
3. **Evidence matching:** If 2+ articles support the claim → higher confidence
4. **Gemini gets context:** AI receives article titles, sources, and URLs as input
5. **Smart fallback:** Zero articles? App uses Gemini-only analysis (no errors!)

---

## 🚀 Deploy to Vercel (1 Click!)

**See full instructions:** [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

### Quick Steps:
1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import your repo
3. Set **Root Directory** to `frontend`
4. Add **Environment Variable:** `GEMINI_API_KEY` = your Gemini key
5. Deploy!

---

## 🛠 Tech Stack

| Layer             | Technology                                  |
|-------------------|---------------------------------------------|
| Frontend          | HTML5 · CSS3 · Vanilla JavaScript           |
| AI Model          | Google Gemini 2.5 Flash-Lite                |
| Fact-Checking API | Google News API (real-time articles)        |
| Hosting           | Vercel                                      |
| Storage           | localStorage (browser-only)                 |
| Architecture      | Hybrid pipeline (News API + AI reasoning)   |

---

## 📝 Features

✅ **Hybrid Fact-Checking** — Real News API articles + Gemini AI reasoning  
✅ **Real-Time Sources** — Linked articles backing every verdict  
✅ **No Server Backend** — Pure frontend, runs entirely in the browser  
✅ **No Installation** — Open `index.html` directly  
✅ **One-Click Deploy** — Vercel integration ready  
✅ **Smart Caching** — 24-hour cache prevents duplicate API calls  
✅ **Graceful Fallback** — Works with AI-only if News API unavailable  
✅ **Chat History** — Stored locally in browser  
✅ **API Key Modal** — Set your keys on first load  
✅ **Glassmorphism UI** — Premium, modern design  
✅ **Consistent Verdicts** — Analysis matches classified verdict (no contradictions)  

---

## 🔒 Security Notes

- Your Gemini API key is stored in browser localStorage
- Your News API key is stored in browser localStorage
- For production, use Vercel environment variables (more secure)
- Never commit `.env.local` (already in .gitignore)
- API calls go directly from browser → providers (no data stored on servers)

---

## 📦 No Build Step Needed

This is vanilla HTML/CSS/JS — just deploy and go!

```bash
# Development:
python -m http.server 8000

# Production:
# → Vercel handles it automatically
```

---

## 🎯 Common Tasks

### Understanding the Pipeline
The app uses a **5-step hybrid pipeline**:
1. **api.js** — Orchestrates the entire pipeline
2. **fact-checker.js** — Handles keyword extraction, News API calls, article caching
3. **config-env.js** — Loads both API keys from environment
4. **chat.js** — Displays articles with links and verdict

### Modify Fact-Checking Rules
Edit `frontend/js/fact-checker.js`:
- `extractKeywords()` — Change keyword extraction logic
- `analyzeArticlesForEvidence()` — Adjust the "2+ articles = confident" rule
- `clearExpiredCache()` — Change 24-hour cache TTL

### Add a New Feature
All code is in `frontend/js/` — add functions to `app.js` or create new modules

### Debug the Pipeline
Open DevTools Console → Look for pipeline logs:
- `📝 Step 1: Extracting keywords...`
- `📰 Step 2: Fetching real-time articles...`
- `🔎 Step 3: Analyzing articles for evidence...`
- `🎯 Verdict Decision: [final verdict]`

### Disable News API (Use AI-Only)
1. Don't set `NEWS_API_KEY` in environment
2. App automatically falls back to Gemini-only analysis
3. No articles will be fetched, pure AI reasoning

---

## 📄 License

MIT
