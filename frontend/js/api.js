/**
 * api.js — API Client
 * Handles all communication with the TruthLens backend.
 */

const API = (() => {
  // ── Configuration ──────────────────────────────────────────────
  // Change this to your backend URL (e.g. Render) once deployed.
  const BASE_URL = window.BACKEND_URL || 'https://truthlens-api-yq9k.onrender.com';

  /**
   * Analyze text / URL via POST /analyze
   * @param {string} text - The news text or URL to analyze
   * @returns {Promise<{fake_or_real, confidence, explanation}>}
   */
  async function analyzeText(text) {
    const response = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Upload and analyze a file (image or PDF)
   * @param {File} file
   * @returns {Promise<{fake_or_real, confidence, explanation}>}
   */
  async function analyzeFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${BASE_URL}/analyze/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error: ${response.status}`);
    }
    return response.json();
  }

  /**
   * Ping the backend to check connectivity
   */
  async function ping() {
    try {
      const res = await fetch(`${BASE_URL}/`, { method: 'GET', signal: AbortSignal.timeout(4000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Conversational chat message — sends full history for multi-turn context
   * @param {string} message
   * @param {Array}  history - [{role:'user'|'assistant', content:string}]
   * @returns {Promise<string>} the bot's reply text
   */
  async function chat(message, history = []) {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `Server error: ${response.status}`);
    }
    const data = await response.json();
    return data.reply || 'I could not generate a response. Please try again.';
  }

  return { analyzeText, analyzeFile, chat, ping, BASE_URL };
})();
