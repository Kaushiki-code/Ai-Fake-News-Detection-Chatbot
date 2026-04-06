/**
 * api.js — API Client (Frontend)
 * Calls Vercel serverless functions (backend) instead of Gemini directly.
 * API keys are now hidden on the backend for security.
 */

const API = (() => {
  // ── Configuration ──────────────────────────────────────────────
  const API_BASE = '/api'; // Vercel serverless functions

  function toUserFriendlyError(status, rawMessage) {
    const message = String(rawMessage || '').trim();
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (message.includes('Gemini API key not configured')) {
      return isLocal
        ? 'Backend is running, but GEMINI_API_KEY is missing. Add it to .env.local and restart `vercel dev`.'
        : 'Gemini API key is not configured on backend.';
    }

    if (message.includes('Gemini API error: 403')) {
      return 'Gemini key is invalid/revoked or API access is blocked. Generate a new key and update .env.local.';
    }

    if (status === 404 && isLocal) {
      return 'Backend API routes are not running. Start with `vercel dev` (not only a static server).';
    }

    if (status >= 500 && isLocal) {
      return `${message || 'Backend error'}. If you are on localhost, run with \`vercel dev\` and restart after env changes.`;
    }

    return message || `HTTP ${status}`;
  }
  
  /**
   * Call backend Vercel function
   */
  async function callBackend(endpoint, body) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorMessage = '';
        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
          const error = await response.json();
          errorMessage = error?.error || '';
        } else {
          const text = await response.text();
          errorMessage = text && text.startsWith('<!DOCTYPE')
            ? 'API route returned HTML instead of JSON'
            : text;
        }

        throw new Error(toUserFriendlyError(response.status, errorMessage));
      }

      return await response.json();
    } catch (e) {
      if (e instanceof TypeError) {
        throw new Error('Network error. Check your internet connection.');
      }
      throw e;
    }
  }

  /**
   * Analyze text / URL via backend API (HYBRID: Google News API + Gemini)
   * @param {string} text - The news text or URL to analyze
   * @returns {Promise<{verdict, confidence, explanation, matched_articles}>}
   */
  async function analyzeText(text) {
    try {
      console.log('📤 Sending analysis request to backend...');
      
      const result = await callBackend('/analyze', { text });
      
      console.log('✅ Backend analysis result:', result);
      return result;
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Check if backend API is reachable (health check)
   */
  async function ping() {
    try {
      const result = await callBackend('/analyze', { text: 'test' });
      return !!result;
    } catch {
      return false;
    }
  }

  /**
   * Conversational chat message via backend API
   * @param {string} message
   * @param {Array}  history - [{role:'user'|'bot', content:string}]
   * @returns {Promise<string>} the bot's reply text
   */
  async function chat(message, history = []) {
    try {
      console.log('📤 Sending chat request to backend...');
      
      // Convert history format for backend
      const formattedHistory = history.map(msg => ({
        role: msg.role === 'bot' ? 'assistant' : msg.role,
        content: msg.content
      }));
      
      const result = await callBackend('/chat', { 
        message,
        history: formattedHistory 
      });
      
      console.log('✅ Backend chat result:', result);
      return result.reply || 'I could not generate a response. Please try again.';
    } catch (error) {
      throw new Error(`Chat failed: ${error.message}`);
    }
  }

  return { analyzeText, chat, ping };
})();
