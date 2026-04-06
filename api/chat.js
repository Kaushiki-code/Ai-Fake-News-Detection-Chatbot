/**
 * api/chat.js — Vercel Serverless Function
 * Handles multi-turn conversations with hidden API key
 * Accessible at: /api/chat
 */

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get API key from runtime env, with local `.env.local` fallback for dev.
    const GEMINI_API_KEY = getEnvValue('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // Build conversation context from history (last 4 turns = 8 messages)
    const conversationHistory = history ? history.slice(-8) : [];

    // Build messages array for multi-turn conversation
    const contents = [];

    // Add history
    if (conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        contents.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const SYSTEM_PROMPT = `You are TruthBot, a helpful fact-checking assistant.
You engage in casual conversation and answer questions about news, current events, and fact-checking.
Keep responses concise and helpful. Be conversational and friendly.`;

    // Call Gemini API
    const response = await callGemini(
      SYSTEM_PROMPT,
      contents,
      GEMINI_API_KEY,
      0.7,
      256
    );

    return res.status(200).json({
      reply: response,
      role: 'bot'
    });

  } catch (error) {
    console.error('❌ Chat error:', error.message);
    return res.status(500).json({
      error: error.message,
      type: error.name
    });
  }
}

/**
 * Read env var from process.env first, then from local .env.local in dev.
 */
function getEnvValue(key) {
  if (process.env[key]) {
    return process.env[key];
  }

  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env.local');

    if (!fs.existsSync(envPath)) {
      return '';
    }

    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const eqIndex = line.indexOf('=');
      if (eqIndex <= 0) continue;

      const envKey = line.slice(0, eqIndex).trim();
      if (envKey !== key) continue;

      const envValue = line.slice(eqIndex + 1).trim();
      return envValue.replace(/^['"]|['"]$/g, '');
    }
  } catch (error) {
    console.warn('Could not read .env.local fallback:', error.message);
  }

  return '';
}

/**
 * Call Gemini API with multi-turn conversation
 */
async function callGemini(systemPrompt, contents, apiKey, temperature, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const body = {
    contents,
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Gemini API error: ${response.status} - ${error.error?.message || 'Unknown'}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('Empty response from Gemini API');
  }

  return content;
}
