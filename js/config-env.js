/**
 * config-env.js — Environment Variables & Model Configuration
 * Loads API keys from environment variables
 */

// ── GEMINI API KEY ──────────────────────────────────────────────
// Priority: .env.local (local dev) → process.env (Vercel/build) → hardcoded fallback
// Load from environment or use placeholder
window.GEMINI_API_KEY = process.env.GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY') || '';

// ── NEWS API KEY ────────────────────────────────────────────────
// Get your free News API key at: https://newsapi.org/register
// News API is used for real-time fact verification
window.NEWS_API_KEY = process.env.NEWS_API_KEY || localStorage.getItem('NEWS_API_KEY') || '';

// ── MODEL CONFIGURATION ──────────────────────────────────────────
// Using gemini-2.5-flash-lite for the best balance of speed and quality
const ANALYSIS_MODELS = ['gemini-2.5-flash-lite'];
const CHAT_MODELS = ['gemini-2.5-flash-lite'];

