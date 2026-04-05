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

    // Get API key from Vercel environment (hidden from frontend)
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const NEWS_API_KEY = process.env.NEWS_API_KEY;

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
    
    const SYSTEM_PROMPT = `You are TruthBot, an advanced fact-checking AI assistant using HYBRID verification.

⚡ YOU HAVE ACCESS TO REAL-TIME ARTICLES FROM GOOGLE NEWS API
Use real articles as PRIMARY evidence. AI reasoning is SECONDARY support.

CRITICAL INSTRUCTIONS:
1. If REAL ARTICLES provided → Compare claim against them FIRST
   - Multiple articles confirm claim → Verdict: True ✅
   - Articles contradict claim → Verdict: False/Fabricated ❌
   - Articles partially match → Verdict: Misleading/Partially True ⚠️

2. If NO REAL ARTICLES found → 
   - Use AI reasoning (lower confidence)
   - Default to Misleading, NOT False (unless obviously fabricated)

3. VERDICT MUST MATCH MISINFORMATION_TYPE:
   - "Fabricated Content" → verdict: "False / Fabricated"
   - "Accurate Reporting" → verdict: "True"
   - "Misleading Headline" or "Exaggeration" → verdict: "Misleading / Partially True"

RESPOND WITH ONLY VALID JSON:
{
  "verdict": "True" or "Misleading / Partially True" or "False / Fabricated",
  "confidence": 0-100,
  "explanation": "Use REAL ARTICLES as primary evidence",
  "key_signals": ["signal1", "signal2"],
  "misinformation_type": "Fabricated Content|Accurate Reporting|Misleading Headline|Exaggeration|Unverified Claim|...",
  "sensationalism_level": "Low|Medium|High",
  "verification_tips": ["tip1", "tip2"]
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

    const result = JSON.parse(jsonMatch[0]);
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
