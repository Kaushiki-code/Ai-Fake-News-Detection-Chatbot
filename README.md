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

## 🔑 Getting a Google Gemini API Key

1. Go to [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) and sign in with your Google account
2. Click **"Create API Key"** (it's FREE!)
3. Copy your API key
4. **For local development:**
   - Edit `frontend/js/config-env.js` and replace `PASTE_YOUR_GEMINI_API_KEY_HERE` with your actual key
   - Or enter it in the modal when the app loads
5. **For production (Vercel):**
   - Set the environment variable `GEMINI_API_KEY` in Vercel dashboard

### ✅ Free Tier Advantages
- ✨ **Unlimited requests** (no rate limits like free models!)
- 🚀 **Fast responses** with `gemini-2.5-flash-lite`
- 💰 **Completely free** to use
- 📊 Better analysis quality

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

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | HTML5 · CSS3 · Vanilla JavaScript   |
| AI Model  | OpenRouter API (Mistral-7B)         |
| Hosting   | Vercel                              |
| Storage   | localStorage (browser-only)         |

---

## 📝 Features

✅ **Advanced Analysis** — Classifies news as True, Misleading, or False/Fabricated  
✅ **No Backend** — Pure frontend, runs entirely in the browser  
✅ **No Installation** — Open `index.html` directly  
✅ **One-Click Deploy** — Vercel integration ready  
✅ **Chat History** — Stored locally in browser  
✅ **API Key Modal** — Set your Gemini key on first load  
✅ **Glassmorphism UI** — Premium, modern design  
✅ **Consistent Verdicts** — Analysis matches classified verdict (no contradictions)  

---

## 🔒 Security Notes

- Your OpenRouter API key is stored in browser localStorage
- For production, use Vercel environment variables (more secure)
- Never commit `.env.local` (already in .gitignore)
- API calls go directly from browser → OpenRouter (no data stored on servers)

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

### Change API Provider
Edit `frontend/js/api.js` and update:
- `OPENROUTER_API_URL` — API endpoint
- `MODEL` — Model name (e.g., `gpt-4-turbo`)

### Add a New Feature
All code is in `frontend/js/` — add new functions to `app.js`

### Debug Locally
Open DevTools → Network tab → check OpenRouter requests

---

## 📄 License

MIT
