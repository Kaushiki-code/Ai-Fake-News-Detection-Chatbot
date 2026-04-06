/**
 * config-env.js — Environment Variables & Model Configuration
 * Loads API keys from environment variables
 */

// `process.env` is only available in build/server environments.
// In browser runtime, use values loaded by `env-loader.js` or localStorage.
const safeEnv = (typeof window !== 'undefined' && window.process && window.process.env)
	? window.process.env
	: {};

// ── GEMINI API KEY ──────────────────────────────────────────────
// Priority: .env.local (local dev) → process.env (Vercel/build) → hardcoded fallback
// Load from environment or use placeholder
window.GEMINI_API_KEY = window.GEMINI_API_KEY || safeEnv.GEMINI_API_KEY || localStorage.getItem('GEMINI_API_KEY') || '';

// ── NEWS API KEY ────────────────────────────────────────────────
// Get your free News API key at: https://newsapi.org/register
// News API is used for real-time fact verification
window.NEWS_API_KEY = window.NEWS_API_KEY || safeEnv.NEWS_API_KEY || localStorage.getItem('NEWS_API_KEY') || '';

// ── MODEL CONFIGURATION ──────────────────────────────────────────
// Using gemini-2.5-flash-lite for the best balance of speed and quality
const ANALYSIS_MODELS = ['gemini-2.5-flash-lite'];
const CHAT_MODELS = ['gemini-2.5-flash-lite'];

