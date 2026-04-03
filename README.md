# TruthLens — AI Fake News Detector

> A premium full-stack AI web app for detecting fake news with a glassmorphism UI.

![TruthLens Screenshot](frontend/assets/images/screenshot.png)

---

## 🗂 Project Structure

```
AI PROJECT_/
├── frontend/                    ← Static SPA (Vercel)
│   ├── index.html
│   ├── css/
│   │   ├── style.css            ← Global design system
│   │   ├── dashboard.css        ← Dashboard styles
│   │   └── chat.css             ← Chat + demo + history
│   ├── js/
│   │   ├── app.js               ← SPA navigation, toasts, ripple
│   │   ├── api.js               ← Backend API client
│   │   ├── chat.js              ← Chatbot logic
│   │   ├── demo.js              ← Demo news cards
│   │   └── history.js           ← localStorage history
│   └── assets/
│       ├── images/
│       └── icons/
├── backend/                     ← FastAPI server (Render)
│   ├── app.py                   ← Entry point
│   ├── routes/
│   │   ├── analyze.py           ← POST /analyze (text/URL)
│   │   └── upload.py            ← POST /analyze/upload (file)
│   ├── services/
│   │   ├── openrouter_api.py    ← AI analysis via OpenRouter
│   │   ├── ocr_service.py       ← pytesseract OCR
│   │   ├── pdf_service.py       ← pdfplumber extraction
│   │   └── preprocessing.py    ← URL scraping + text cleaning
│   ├── utils/
│   │   └── helpers.py
│   ├── uploads/                 ← Temp file storage
│   ├── requirements.txt
│   ├── .env.example
│   └── render.yaml
└── vercel.json
```

---

## ⚡ Quick Start

### 1. Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
python -m pip install -r requirements.txt

# If you see a launcher path error on Windows, recreate the venv first:
# rmdir /s /q venv
# python -m venv venv
# venv\Scripts\activate
# python -m pip install -r requirements.txt

# Configure your API key
copy .env.example .env
# Edit .env — add your OPENROUTER_API_KEY

# Start dev server
python app.py
uvicorn app:app --reload --port 8000
# → Listening on http://localhost:8000
```

> **No API key?** The app runs in **demo mode** using a keyword heuristic. Add your key from [openrouter.ai/keys](https://openrouter.ai/keys) for real AI analysis.

### 2. Frontend

Open `frontend/index.html` directly in a browser — **no build step needed**.

Or serve it locally:
```bash
# Using Python:
cd frontend
python -m http.server 3000
# → http://localhost:3000
```

---

## 🔑 Getting an OpenRouter API Key

1. Go to [openrouter.ai](https://openrouter.ai) and sign up (free)
2. Navigate to [openrouter.ai/keys](https://openrouter.ai/keys)
3. Create a new key and copy it
4. Paste it into `backend/.env` as `OPENROUTER_API_KEY=sk-or-...`

The free tier includes generous usage of models like `mistral-7b-instruct`.

---

## 🚀 Deployment

### Frontend → Vercel

1. Push the project to GitHub
2. Connect the repo to [Vercel](https://vercel.com)
3. Set the root directory to `/` (vercel.json handles routing)
4. Set `BACKEND_URL` in your frontend if needed (edit `js/api.js`)

### Backend → Render

1. Connect the `/backend` folder to a new Render Web Service
2. **Build command:** `python -m pip install -r requirements.txt`
3. **Start command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
4. Add environment variable: `OPENROUTER_API_KEY = <your key>`

---

## 📡 API Reference

### `POST /analyze`

Analyze text or a URL.

**Request:**
```json
{ "text": "Breaking: Scientists discover cure using banana peels..." }
```

**Response:**
```json
{
  "fake_or_real": "Fake",
  "confidence": 87.5,
  "explanation": "This article contains several sensationalist claims..."
}
```

### `POST /analyze/upload`

Upload an image (JPG/PNG/GIF/WebP) or PDF for analysis.

**Form data:** `file` — multipart/form-data

**Response:** Same as `/analyze`

---

## 🛠 Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Frontend  | HTML5 · CSS3 · Vanilla JavaScript  |
| Backend   | Python 3.11 · FastAPI · Uvicorn    |
| AI        | OpenRouter API (Mistral-7B)        |
| OCR       | pytesseract + Tesseract            |
| PDF       | pdfplumber                         |
| Web scrape| httpx + BeautifulSoup4             |
| Deploy FE | Vercel                             |
| Deploy BE | Render                             |

---

## 📦 OCR Setup (Optional)

To enable image analysis, install Tesseract OCR:

- **Windows:** [Download installer](https://github.com/UB-Mannheim/tesseract/wiki)
- **macOS:** `brew install tesseract`
- **Ubuntu:** `sudo apt install tesseract-ocr`

Then uncomment and set the path in `services/ocr_service.py` if Tesseract isn't on your PATH.
# Ai-Fake-News-Detection-ChatBot-
