"""
routes/analyze.py — POST /analyze  +  POST /chat
"""

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

from services.preprocessing import preprocess
from services.openrouter_api import analyze_with_ai, chat_with_ai

router = APIRouter(tags=["analyze"])


# ── Request / Response models ────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    text: str


class ChatRequest(BaseModel):
    message: str
    history: list[dict] = []   # [{role: 'user'|'assistant', content: str}]


class AnalyzeResponse(BaseModel):
    fake_or_real:        str
    confidence:          float
    explanation:         str
    key_signals:         list[str] = []
    misinformation_type: str       = ""
    verification_tips:   list[str] = []


class ChatResponse(BaseModel):
    reply: str


# ── Routes ───────────────────────────────────────────────────────────

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(body: AnalyzeRequest = Body(...)):
    """
    Explicit fake-news analysis endpoint.
    Called by the frontend when it detects a news headline or article.
    """
    raw_text = body.text.strip()
    if not raw_text:
        raise HTTPException(status_code=400, detail="Text is required.")
    if len(raw_text) > 20_000:
        raise HTTPException(status_code=400, detail="Text too long (max 20,000 chars).")

    cleaned, source_domain = await preprocess(raw_text)
    if not cleaned:
        raise HTTPException(status_code=422, detail="Could not extract meaningful text.")

    try:
        result = await analyze_with_ai(cleaned, source_domain=source_domain)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return result


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest = Body(...)):
    """
    General-purpose AI chat endpoint — behaves like ChatGPT/Gemini.

    The frontend already routes news headlines to /analyze.
    Everything that reaches /chat is a conversational message:
    questions, follow-ups, general knowledge, sports scores, etc.
    Messages are passed directly to chat_with_ai() with full history.
    """
    message = body.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message is required.")

    try:
        reply = await chat_with_ai(message, history=body.history)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {"reply": reply}
