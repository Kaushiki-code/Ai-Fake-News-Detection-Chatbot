"""
services/openrouter_api.py — OpenRouter AI Integration
Sends text to an LLM and parses structured fake-news analysis.
"""

import os
import re
import json
import hashlib
import httpx
from typing import Optional, Dict, List, Any
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_BASE    = "https://openrouter.ai/api/v1/chat/completions"

# Reliable free-tier models on OpenRouter (as of 2025).
# Override via OPENROUTER_MODEL env var.
# Full list: https://openrouter.ai/models?q=free
MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "google/gemma-3-12b-it:free"   # Good balance of speed + quality
)

# ── CHAT models: medium-sized, fast, good general knowledge ──────────
# These respond in 2-5 seconds. 3B models are too dumb for general Q&A;
# 70B+ models time out too often on free tier (causes 10s+ waits).
CHAT_MODELS = [
    "google/gemma-3-12b-it:free",          # Fast, smart, reliable
    "google/gemma-3-27b-it:free",          # Smarter, still reasonably fast
    "meta-llama/llama-3.1-8b-instruct:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "qwen/qwen3.6-plus:free",
    "openai/gpt-oss-20b:free",
    "meta-llama/llama-3.3-70b-instruct:free",  # Last resort — slow but capable
    "google/gemma-3-4b-it:free",           # Fastest fallback if everything else fails
    "meta-llama/llama-3.2-3b-instruct:free",
]

# ── ANALYSIS models: tuned for structured JSON fact-checking ─────────
# Accuracy matters here; medium models handle JSON well without hallucinating.
ANALYSIS_MODELS = [
    "google/gemma-3-12b-it:free",
    "google/gemma-3-27b-it:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "qwen/qwen3.6-plus:free",
    "openai/gpt-oss-20b:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-4b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
]

# ── Per-function model caches ───────────────────────────────────────
# Each endpoint remembers its own last-working model independently.
_cached_model: Optional[str] = None   # analysis
_cached_chat_model: Optional[str] = None   # chat
_failed_models: set = set()

# ── Response cache: stores analysis results to avoid redundant API calls ──
_analysis_cache: Dict[str, Dict[str, Any]] = {}
_CACHE_MAX = 200  # Maximum cached entries (LRU-lite: evict oldest)

def _cache_key(text: str, source_domain: str) -> str:
    """Short hash key for caching analysis results."""
    return hashlib.md5(f"{text[:500]}{source_domain}".encode()).hexdigest()

SYSTEM_PROMPT = """You are TruthBot, an expert AI fact-checker specializing in detecting fake news and misinformation.

Analyze the provided news text and respond ONLY with a valid JSON object in EXACTLY this format — no extra text:
{
  "fake_or_real": "Fake" or "Real",
  "confidence": <float between 0 and 100>,
  "explanation": "<3-5 sentences giving a thorough analysis: what the claim says, what's wrong or right with it, and why you classified it this way>",
  "key_signals": ["<signal 1>", "<signal 2>", "<signal 3>"],
  "misinformation_type": "<one of: Fabricated Content | Misleading Headline | False Context | Manipulated Content | Satire/Parody | Conspiracy Theory | Unverified Claim | Credible Reporting>",
  "verification_tips": ["<tip 1>", "<tip 2>", "<tip 3>"]
}

Field instructions:
- explanation: 3-5 detailed sentences. Cover what the claim states, specific factual problems or supporting evidence, and the overall verdict reasoning.
- key_signals: List 2-4 specific signals you observed (e.g. "No credible source cited", "Contradicts known facts", "Sensational language", "Matches verified Reuters report"). Be specific, not generic.
- misinformation_type: Pick exactly ONE from the list above that best describes the content type.
- verification_tips: Give 2-4 actionable tips the reader can use to verify this themselves (e.g. "Search Reuters or AP News for this story", "Check BCCI official website for IPL schedule").

Guidelines:
- Mark as "Fake" ONLY if you find clear, specific signals: fabricated quotes, demonstrably false facts, known conspiracy theories, or extreme sensationalism.
- Mark as "Real" if the text appears to report factual, plausible events from credible sources.
- IMPORTANT: If the article is from a credible outlet (BBC, Reuters, The Hindu, NDTV, Indian Express, AP, Times of India), treat as credible unless explicit red flags exist.
- Uncertainty alone is NOT a reason to mark "Fake". Default to "Real" when in doubt.
- confidence: 90+ = very certain, 70-89 = fairly confident, 50-69 = uncertain.
- Do NOT include any text outside the JSON object."""

CHAT_SYSTEM_PROMPT = """You are TruthBot, a smart AI assistant like ChatGPT, built into TruthLens (a fake news detection platform).

You can answer ANY question the user asks: news, general knowledge, science, history, tech, current events, analysis, advice, etc.

Rules (check in order):
1. FOLLOW-UP: If the user references a previous message or topic ("more details", "about this", "explain further", "why", "that news"), use the conversation history to answer fully. Do NOT ask them to repeat anything.
2. FACT-CHECK: If the user sends a specific news headline to verify, give: Verdict (🚨 FAKE / ✅ REAL), Confidence %, and 3-4 sentence analysis.
3. GENERAL: Answer any question helpfully and thoroughly. For current events after your training cutoff, say so and suggest checking BBC, Reuters, or Google News.

Formatting: Use **bold**, bullet points (- item), numbered lists (1. item), and ## headers for long responses. Write like a knowledgeable journalist + assistant."""


async def analyze_with_ai(text: str, source_domain: str = "") -> dict:
    """
    Send cleaned text to OpenRouter and return parsed result.
    Falls back to a heuristic if no API key is set (for demos).
    source_domain: the website domain the article came from (e.g. 'indianexpress.com').
    """
    if not OPENROUTER_API_KEY:
        return _heuristic_fallback(text)

    # ── Cache check: same text = instant result ──
    ck = _cache_key(text, source_domain)
    if ck in _analysis_cache:
        return _analysis_cache[ck]

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://truthlens.app",
        "X-Title":       "TruthLens",
    }

    # Build user message — include source credibility context if available
    if source_domain:
        from services.preprocessing import is_credible_source
        credibility = "a well-known credible news outlet" if is_credible_source(source_domain) else "an unknown source"
        user_message = (
            f"Source website: {source_domain} ({credibility})\n\n"
            f"Analyze this news article:\n\n{text[:6000]}"
        )
    else:
        user_message = f"Analyze this news text:\n\n{text[:6000]}"

    global _cached_model, _failed_models

    # Use analysis-specific model list, cached model first
    all_models = ANALYSIS_MODELS[:]
    if _cached_model and _cached_model in all_models:
        all_models = [_cached_model] + [m for m in all_models if m != _cached_model]

    models_to_try = [m for m in all_models if m not in _failed_models]
    if not models_to_try:
        _failed_models.clear()
        models_to_try = all_models

    # Reduced timeout: fail fast (10s) and move to the next model quickly
    async with httpx.AsyncClient(timeout=10.0) as client:
        last_error = None

        for model_id in models_to_try:
            payload = {
                "model": model_id,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": user_message},
                ],
                "temperature": 0.10,
                "max_tokens":  512,
            }

            try:
                response = await client.post(OPENROUTER_BASE, json=payload, headers=headers)

                # ── Handle specific HTTP errors with clear messages ──
                if response.status_code == 401:
                    raise RuntimeError(
                        "Invalid OpenRouter API key. "
                        "Check OPENROUTER_API_KEY in your .env file."
                    )
                if response.status_code == 429:
                    # Rate limit exceeded — try the next model
                    last_error = f"Model '{model_id}' rate limited (429)."
                    continue
                if response.status_code == 404:
                    # Model not found — permanently skip in this session
                    last_error = f"Model '{model_id}' not found (404)."
                    _failed_models.add(model_id)
                    continue
                if response.status_code == 400:
                    last_error = f"Model '{model_id}' returned 400 Bad Request."
                    _failed_models.add(model_id)
                    continue
                if response.status_code >= 500:
                    raise RuntimeError(
                        f"OpenRouter server error ({response.status_code}). "
                        "Please try again later."
                    )

                response.raise_for_status()

                data    = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                _cached_model = model_id  # Remember this working model!
                result = _parse_response(content, text)
                # Store in cache (evict oldest if full)
                if len(_analysis_cache) >= _CACHE_MAX:
                    _analysis_cache.pop(next(iter(_analysis_cache)))
                _analysis_cache[ck] = result
                return result

            except httpx.TimeoutException:
                last_error = f"Model '{model_id}' timed out (10s)."
                continue  # Move to the next model fast
            except httpx.ConnectError as e:
                raise RuntimeError(
                    f"Could not connect to OpenRouter: {e}. "
                    "Check your internet connection."
                ) from e

        # All models failed with 404
        raise RuntimeError(
            f"No available model found. Last error: {last_error}. "
            "Check https://openrouter.ai/models for current free model slugs."
        )


def _parse_response(content: str, original_text: str) -> dict:
    """Extract JSON from model response, with robust fallback."""
    # Try direct parse
    try:
        result = json.loads(content)
        return _validate(result)
    except (json.JSONDecodeError, KeyError):
        pass

    # Try extracting JSON block with regex
    match = re.search(r'\{.*?\}', content, re.DOTALL)
    if match:
        try:
            result = json.loads(match.group())
            return _validate(result)
        except (json.JSONDecodeError, KeyError):
            pass

    # Last resort: keyword search in model output
    label = "Fake" if "fake" in content.lower() else "Real"
    return {
        "fake_or_real":       label,
        "confidence":         60.0,
        "explanation":        content[:500] or "Unable to parse a structured response from the AI model.",
        "key_signals":        ["Could not parse detailed signals from model response."],
        "misinformation_type": "Unverified Claim",
        "verification_tips":  ["Search for this story on Reuters, BBC, or AP News.", "Check official sources related to the topic."],
    }


def _validate(result: dict) -> dict:
    label = str(result.get("fake_or_real", "Real")).capitalize()
    if label not in ("Fake", "Real"):
        label = "Real"
    conf  = float(result.get("confidence", 70))
    conf  = max(0.0, min(100.0, conf))
    explanation = str(result.get("explanation", "No explanation provided."))

    # New rich fields — carry through if present, fallback to sensible defaults
    key_signals = result.get("key_signals", [])
    if not isinstance(key_signals, list):
        key_signals = [str(key_signals)]

    misinformation_type = str(result.get("misinformation_type", "Unverified Claim"))

    verification_tips = result.get("verification_tips", [])
    if not isinstance(verification_tips, list):
        verification_tips = [str(verification_tips)]

    return {
        "fake_or_real":        label,
        "confidence":          conf,
        "explanation":         explanation,
        "key_signals":         key_signals,
        "misinformation_type": misinformation_type,
        "verification_tips":   verification_tips,
    }


def _heuristic_fallback(text: str) -> dict:
    """
    Simple keyword heuristic used when no API key is configured.
    Useful for UI development and demos.
    """
    fake_signals = [
        "cure", "miracle", "secret", "they don't want you to know",
        "government hiding", "instant", "guaranteed immortal",
        "clickbait", "shocking truth", "doctors hate", "breaking exclusive",
        "anonymous insider", "abolish all",
    ]
    text_lower = text.lower()
    hits       = sum(1 for kw in fake_signals if kw in text_lower)

    if hits >= 2:
        return {
            "fake_or_real": "Fake",
            "confidence":   min(55 + hits * 8, 92),
            "explanation":  (
                f"This text contains {hits} sensationalist or misleading signal(s) "
                "such as exaggerated claims or unverifiable assertions. "
                "Note: This is a demo heuristic — configure OPENROUTER_API_KEY for real AI analysis."
            ),
        }

    return {
        "fake_or_real": "Real",
        "confidence":   65.0 + min(hits * 2, 10),
        "explanation":  (
            "The text does not exhibit obvious fake-news signals and appears to report "
            "plausible factual information. "
            "Note: This is a demo heuristic — configure OPENROUTER_API_KEY for real AI analysis."
        ),
    }


async def chat_with_ai(message: str, history: Optional[List[Dict[str, Any]]] = None) -> str:
    """
    Conversational chatbot endpoint with multi-turn memory.
    history: list of {role: 'user'|'assistant', content: str} from previous turns.
    Falls back to a friendly canned response if no API key is set.
    """
    if not OPENROUTER_API_KEY:
        return _chat_fallback(message)

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://truthlens.app",
        "X-Title":       "TruthLens",
    }

    global _cached_chat_model, _failed_models

    # Use CHAT_MODELS (fast medium models) with chat-specific cache
    all_models = CHAT_MODELS[:]
    if _cached_chat_model and _cached_chat_model in all_models:
        all_models = [_cached_chat_model] + [m for m in all_models if m != _cached_chat_model]

    models_to_try = [m for m in all_models if m not in _failed_models]
    if not models_to_try:
        _failed_models.clear()
        models_to_try = all_models

    # Build messages array: system + conversation history + current message
    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]

    # Inject last 8 turns of history for context (keeps token count manageable)
    if history:
        for turn in history[-8:]:
            role    = turn.get("role", "user")
            content = str(turn.get("content", "")).strip()
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

    # Append the current user message
    messages.append({"role": "user", "content": message})

    # 10s timeout: fast failure so we can switch to next model quickly
    async with httpx.AsyncClient(timeout=10.0) as client:
        last_error = None

        for model_id in models_to_try:
            payload = {
                "model":       model_id,
                "messages":    messages,
                "temperature": 0.7,
                "max_tokens":  400,  # Increased slightly to handle detailed follow-ups
            }

            try:
                response = await client.post(OPENROUTER_BASE, json=payload, headers=headers)

                if response.status_code == 401:
                    raise RuntimeError("Invalid OpenRouter API key.")
                if response.status_code in (429,):
                    last_error = f"Model '{model_id}' rate limited (429)."
                    continue
                if response.status_code in (404, 400):
                    last_error = f"Model '{model_id}' returned {response.status_code}."
                    _failed_models.add(model_id)
                    continue
                if response.status_code >= 500:
                    raise RuntimeError(f"OpenRouter server error ({response.status_code}).")

                response.raise_for_status()
                data    = response.json()
                content = data["choices"][0]["message"]["content"].strip()
                _cached_chat_model = model_id  # Pin this model for future chat calls
                return content

            except httpx.TimeoutException:
                last_error = f"Model '{model_id}' timed out (10s)."
                continue  # Don't crash — just try the next model
            except httpx.ConnectError as e:
                raise RuntimeError(f"Could not connect to OpenRouter: {e}.") from e

        raise RuntimeError(
            f"No available model found. Last error: {last_error}."
        )


def _chat_fallback(message: str) -> str:
    """Friendly canned responses when no API key is configured."""
    msg = message.lower().strip()
    if any(w in msg for w in ["hello", "hi", "hey", "howdy", "greetings"]):
        return (
            "👋 Hello! I'm **TruthBot**, your AI-powered fact-checking assistant!\n\n"
            "I can help you:\n"
            "- 🔍 Detect fake news in articles or text\n"
            "- 🌐 Analyze news from URLs\n"
            "- 📄 Extract and check text from images or PDFs\n\n"
            "Just paste a news article or URL and I'll analyze it for you! "
            "*(Note: Add an OpenRouter API key for full AI analysis.)*"
        )
    if any(w in msg for w in ["how", "what", "help", "use", "work"]):
        return (
            "I'm TruthBot, and here's how I work:\n\n"
            "1. **Paste news text** — I'll analyze it for misinformation signals\n"
            "2. **Share a URL** — I'll scrape and analyze the article\n"
            "3. **Upload a file** — Use the 📎 button for images or PDFs\n\n"
            "Try it now by pasting any news headline!"
        )
    return (
        "I'm **TruthBot** 🤖 — I specialize in detecting fake news and misinformation. "
        "Paste any news article, URL, or headline and I'll analyze it for you!\n\n"
        "*(Note: Configure `OPENROUTER_API_KEY` in your `.env` for full AI-powered analysis.)*"
    )
