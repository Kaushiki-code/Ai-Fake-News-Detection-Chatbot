# TruthLens — AI Fake News Detector

> A lightweight, frontend-only AI web app for detecting fake news with a glassmorphism UI.
> Deploy directly to Vercel in seconds! 🚀

---

## 🗂 Project Structure

```
AI PROJECT_/
├── frontend/                    ← Complete Static App (Deploy to Vercel)
│   ├── index.html               ← Main page
│   ├── .env.local               ← Local API key (git-ignored)
│   ├── .env.example             ← Template
│   ├── css/
│   │   ├── style.css            ← Global design system
│   │   ├── dashboard.css        ← Dashboard styles
│   │   └── chat.css             ← Chat + demo + history
│   ├── js/
│   │   ├── app.js               ← SPA navigation, toasts, ripple
│   │   ├── api.js               ← OpenRouter API client
│   │   ├── config.js            ← API key setup modal
│   │   ├── chat.js              ← Chatbot logic
│   │   ├── demo.js              ← Demo news cards
│   │   └── history.js           ← localStorage history
│   └── assets/
│       ├── images/
│       └── icons/
├── vercel.json                  ← Deployment config
└── README.md
```

---

## ⚡ Quick Start

### Option 1: Direct Browser
```bash
# Simply open the file in your browser
frontend/index.html
```

A modal will appear asking for your OpenRouter API key. Enter it and start analyzing!

### Option 2: Local Server
```bash
cd frontend
python -m http.server 8000
# → Open http://localhost:8000
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
