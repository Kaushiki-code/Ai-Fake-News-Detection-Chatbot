# 🚀 TruthLens Frontend-Only — Quick Start

## What You Have

Your app is **100% frontend** — completely static, no backend needed! Deploy to Vercel in seconds.

---

## ⚡ Test Locally (Right Now!)

### Option 1: Direct Browser (Zero Setup)
```
1. Open: frontend/index.html in your browser
2. A modal will ask for your OpenRouter API key
3. Go to: https://openrouter.ai/keys
4. Copy your key and paste it in the modal
5. Done! Start analyzing!
```

### Option 2: Local Server
```bash
cd frontend
python -m http.server 8000

# Visit: http://localhost:8000
```

---

## 🌐 Deploy to Vercel (1 Click!)

### With Git (Recommended):
```bash
# 1. Push your code to GitHub
git add .
git commit -m "Frontend-only fake news detection app"
git push origin main

# 2. Go to https://vercel.com/new
# 3. Click "Import Project"
# 4. Select your GitHub repo
# 5. Accept defaults (vercel.json auto-configures)
# 6. Add Environment Variable:
#    - Name: OPENROUTER_API_KEY
#    - Value: sk-or-v1-... (from https://openrouter.ai/keys)
# 7. Click Deploy ✨
```

### With Vercel CLI:
```bash
npm i -g vercel
vercel login
vercel
# Follow prompts, add OPENROUTER_API_KEY when asked
```

---

## 🔑 API Key Setup

### Local Development
Edit `frontend/.env.local` and add:
```
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

Or just enter it in the modal when you open the app — it'll be saved to localStorage.

### Production (Vercel)
Set environment variable in Vercel dashboard:
- **Name:** `OPENROUTER_API_KEY`
- **Value:** Your key from https://openrouter.ai/keys

---

## 📁 Project Structure

```
frontend/
├── index.html           ← Main app (open directly)
├── .env.local           ← Your API key (git-ignored)
├── .env.example         ← Template
├── css/
│   ├── style.css
│   ├── dashboard.css
│   └── chat.css
├── js/
│   ├── app.js           ← Main app logic
│   ├── api.js           ← OpenRouter integration
│   ├── config.js        ← API key modal
│   ├── chat.js          ← Chatbot
│   ├── demo.js          ← Demo news
│   └── history.js       ← Chat history
└── assets/
    ├── images/
    └── icons/
```

---

## ✨ Features

- ✅ No backend needed
- ✅ No installation required
- ✅ Deploy directly to Vercel
- ✅ Chat history saved locally
- ✅ API key stored securely
- ✅ Glassmorphism UI

---

## 🔒 Security

Your API key:
- Is stored in browser localStorage (for local dev)
- Should use Vercel env vars in production (more secure)
- Only sent directly to OpenRouter (no intermediaries)

Never commit `.env.local` — it's in `.gitignore`

---

## 🎯 Next Steps

1. Get OpenRouter key: https://openrouter.ai/keys
2. Add key to `frontend/.env.local` or enter in modal
3. Test locally: `python -m http.server 8000`
4. Deploy to Vercel: https://vercel.com/new
5. ✨ Done!

---

Happy analyzing! 🚀
