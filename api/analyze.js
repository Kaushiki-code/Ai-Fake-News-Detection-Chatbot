/**
 * api/analyze.js — Vercel Serverless Function
 * Handles fact-checking analysis with hidden API key
 * Accessible at: /api/analyze
 */

module.exports = async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Get API keys from runtime env, with local `.env.local` fallback for dev.
    const GEMINI_API_KEY = getEnvValue('GEMINI_API_KEY');
    const NEWS_API_KEY = getEnvValue('NEWS_API_KEY');

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    // ── Step 1: Extract keywords from text ──
    console.log('📝 Step 1: Extracting keywords...');
    
    const keywords = extractKeywords(text);
    console.log('🔑 Keywords:', keywords);

    // ── Step 2: Fetch real articles (if News API key exists) ──
    let articles = [];
    if (NEWS_API_KEY) {
      console.log('📰 Step 2: Fetching real-time articles from News API...');
      articles = await fetchNewsArticles(keywords, NEWS_API_KEY);
      console.log(`✅ Found ${articles.length} articles`);
    } else {
      console.log('⚠️ News API key not set, skipping article fetch');
    }

    // ── Step 3: Build message for Gemini ──
    let geminiMessage = `Analyze this news:\n\n${text.slice(0, 6000)}`;
    
    if (articles.length > 0) {
      geminiMessage += '\n\n=== REAL-TIME ARTICLES (from Google News) ===\n';
      articles.forEach((article, idx) => {
        geminiMessage += `\n${idx + 1}. "${article.title}"\n   Source: ${article.source}\n   URL: ${article.url}\n`;
      });
      geminiMessage += '\n=== END ARTICLES ===\n\nCompare the claim with these real articles. Use them as primary evidence.';
    }

    // ── Step 4: Call Gemini API ──
    console.log('🤖 Step 3: Calling Gemini API...');
    
     const SYSTEM_PROMPT = `You are an advanced AI fact-checking assistant.

  Your task is to determine whether a given news claim is:
  1. TRUE
  2. FAKE
  3. UNCERTAIN (Insufficient Evidence)

  IMPORTANT RULES:
  - Do NOT assume a claim is false just because it is not found in the provided articles.
  - Absence of evidence is NOT evidence of falsehood.
  - Use both: (a) your general knowledge and (b) the provided real-time articles.

  CLASSIFICATION LOGIC:
  1) TRUE
  - The claim is supported by known facts OR confirmed by reliable sources.
  - If articles do not mention it, but it is widely known and verified, mark TRUE.

  2) FAKE
  - The claim is clearly false, misleading, or contradicts known facts.
  - Reliable sources directly refute it.

  3) UNCERTAIN
  - The claim is not found in articles AND confidence from your knowledge is low.
  - Information is insufficient, unrelated, or inconclusive.
  - If sources are unrelated, prefer UNCERTAIN instead of FAKE.

  CONFIDENCE RULE:
  - Never output 100 unless absolutely certain.

  Respond with ONLY valid JSON in this exact shape:
  {
    "verdict": "TRUE" | "FAKE" | "UNCERTAIN",
    "confidence": 0-100,
    "explanation": "Clear reasoning combining articles + knowledge",
    "key_signals": ["signal 1", "signal 2"],
    "category": "Real News" | "Fake News" | "Misleading" | "Insufficient Evidence",
    "verification_tips": ["tip 1", "tip 2"]
  }`;

    const geminiResponse = await callGemini(
      SYSTEM_PROMPT,
      geminiMessage,
      GEMINI_API_KEY,
      0.1,
      512
    );

    // Parse JSON from response
    const jsonMatch = geminiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({
        error: 'Could not parse Gemini response',
        raw: geminiResponse.slice(0, 200)
      });
    }

    const result = normalizeAnalysisResult(JSON.parse(jsonMatch[0]), articles.length);
    result.matched_articles = articles;

    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
    return res.status(500).json({
      error: error.message,
      type: error.name
    });
  }
}

/**
 * Normalize model output into a stable shape for the frontend.
 */
function normalizeAnalysisResult(raw, articleCount) {
  const allowedVerdicts = new Set(['TRUE', 'FAKE', 'UNCERTAIN']);
  const verdict = String(raw?.verdict || '').trim().toUpperCase();

  let finalVerdict = allowedVerdicts.has(verdict) ? verdict : 'UNCERTAIN';

  if (!allowedVerdicts.has(verdict) && raw?.category) {
    const category = String(raw.category).toLowerCase();
    if (category.includes('fake') || category.includes('misleading')) finalVerdict = 'FAKE';
    if (category.includes('real')) finalVerdict = 'TRUE';
    if (category.includes('insufficient')) finalVerdict = 'UNCERTAIN';
  }

  const confidenceNum = Number(raw?.confidence);
  const confidence = Number.isFinite(confidenceNum)
    ? Math.max(0, Math.min(100, Math.round(confidenceNum)))
    : (finalVerdict === 'UNCERTAIN' ? 45 : 70);

  const explanation = String(raw?.explanation || '').trim() || 'Insufficient details returned by the model.';

  const keySignals = Array.isArray(raw?.key_signals)
    ? raw.key_signals.map(v => String(v).trim()).filter(Boolean).slice(0, 6)
    : [];

  const verificationTips = Array.isArray(raw?.verification_tips)
    ? raw.verification_tips.map(v => String(v).trim()).filter(Boolean).slice(0, 6)
    : [];

  let category = String(raw?.category || '').trim();
  if (!category) {
    if (finalVerdict === 'TRUE') category = 'Real News';
    else if (finalVerdict === 'FAKE') category = articleCount > 0 ? 'Fake News' : 'Misleading';
    else category = 'Insufficient Evidence';
  }

  // Keep this field for existing UI components that still render it.
  const misinformationType = category;

  return {
    verdict: finalVerdict,
    confidence,
    explanation,
    key_signals: keySignals,
    category,
    misinformation_type: misinformationType,
    verification_tips: verificationTips
  };
}

/**
 * Read env var from process.env first, then from local .env.local in dev.
 * This helps when local serverless runtime does not inject env vars reliably.
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
 * Extract keywords from text
 */
function extractKeywords(text) {
  const STOPWORDS = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'that', 'be', 'are', 'was', 'been', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must'
  ]);

  let cleaned = text.replace(/https?:\/\/\S+/g, '').replace(/[^\w\s]/g, '');
  
  const words = cleaned
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word));

  return words.slice(0, 5).join(' ');
}

/**
 * Fetch articles from News API
 */
async function fetchNewsArticles(query, apiKey) {
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&language=en&pageSize=5&apiKey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`News API error: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (data.status !== 'ok' || !data.articles) {
      console.warn('No articles found');
      return [];
    }

    return data.articles.map((article, index) => ({
      id: index + 1,
      title: article.title,
      source: article.source.name,
      url: article.url,
      description: article.description,
      publishedAt: article.publishedAt,
      relevanceScore: 100 - (index * 15)
    }));
  } catch (error) {
    console.error('Error fetching articles:', error.message);
    return [];
  }
}

/**
 * Call Gemini API
 */
async function callGemini(systemPrompt, userMessage, apiKey, temperature, maxTokens) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{ text: userMessage }]
    }],
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
