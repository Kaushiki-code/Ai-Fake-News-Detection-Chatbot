/**
 * api.js — API Client (Frontend-Only)
 * Handles all communication with Google Gemini API directly.
 * Includes error handling and robust response validation.
 */

const API = (() => {
  // ── Configuration ──────────────────────────────────────────────
  const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
  const MODEL = 'gemini-2.5-flash-lite'; // Single model for Gemini
  
  // Model caching (not needed for single Gemini model, but kept for compatibility)
  const failedModels = new Set();

  // System prompts
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

CLASSIFICATION RULES:
- "True" → Claim matches real articles OR is factually accurate
- "Misleading / Partially True" → Real event exists but exaggerated/incomplete
- "False / Fabricated" → Contradicts real articles OR completely unsupported with sources

EXAMPLES:
- Claim: "Free laptops for all students" (NO articles found)
  → Verdict: Misleading / Partially True + Type: Unverified Claim (NOT False)

- Claim: "Government announces X policy" (2+ credible articles confirm)
  → Verdict: True + Type: Accurate Reporting

- Claim: "100 people died" but articles say "10 died"
  → Verdict: False / Fabricated + Type: False Context

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

  const CHAT_SYSTEM_PROMPT = `You are TruthBot, a smart AI assistant like ChatGPT, built into TruthLens (a fake news detection platform).

You can answer ANY question the user asks: news, general knowledge, science, history, tech, current events, analysis, advice, etc.

Rules (check in order):
1. FOLLOW-UP: If the user references a previous message or topic ("more details", "about this", "explain further", "why", "that news"), use the conversation history to answer fully. Do NOT ask them to repeat anything.
2. FACT-CHECK: If the user sends a specific news headline to verify, give: Verdict (🚨 FAKE / ✅ REAL), Confidence %, and 3-4 sentence analysis.
3. GENERAL: Answer any question helpfully and thoroughly. For current events after your training cutoff, say so and suggest checking BBC, Reuters, or Google News.

Formatting: Use **bold**, bullet points (- item), numbered lists (1. item), and ## headers for long responses. Write like a knowledgeable journalist + assistant.`;

  /**
   * Call Gemini API
   */
  async function callGemini(systemPrompt, userMessage, temperature = 0.1, maxTokens = 512) {
    const apiKey = window.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key not set. Please configure it in the modal.');
    }

    const url = `${GEMINI_API_URL}/${MODEL}:generateContent?key=${apiKey}`;

    // Convert to Gemini format
    const contents = [
      {
        parts: [
          { text: userMessage }
        ]
      }
    ];

    const systemInstruction = {
      parts: [
        { text: systemPrompt }
      ]
    };

    const body = {
      contents,
      systemInstruction,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      }
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        throw new Error('Invalid Gemini API key. Please check your key in config-env.js');
      }
      if (response.status === 403) {
        throw new Error('Gemini API access forbidden. Check if the API is enabled in your Google Cloud project.');
      }
      if (response.status === 429) {
        throw new Error('Rate limited by Gemini API. Please wait a moment and try again.');
      }
      if (response.status === 400) {
        throw new Error('Bad request to Gemini API. Check your API key and request format.');
      }
      if (response.status >= 500) {
        throw new Error(`Gemini server error: ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
        throw new Error('Invalid response format from Gemini API');
      }

      const content = data.candidates[0].content.parts[0].text;

      if (!content || typeof content !== 'string') {
        throw new Error('Empty response from Gemini API');
      }

      return content;
    } catch (e) {
      if (e instanceof TypeError) {
        throw new Error('Network error. Check your internet connection.');
      }
      throw e;
    }
  }

  /**
   * Analyze text / URL via Gemini (HYBRID: Google News API + Gemini)
   * @param {string} text - The news text or URL to analyze
   * @returns {Promise<{verdict, confidence, explanation, matched_articles}>}
   */
  async function analyzeText(text) {
    try {
      // STEP 1: Extract keywords from user input
      console.log('📝 Step 1: Extracting keywords...');
      const keywords = FactChecker.extractKeywords(text);
      console.log('🔑 Keywords extracted:', keywords);

      // STEP 2: Fetch real articles from News API
      console.log('📰 Step 2: Fetching real-time articles...');
      const articles = await FactChecker.fetchNewsArticles(keywords);
      
      // STEP 3: Analyze articles for initial evidence
      console.log('🔎 Step 3: Analyzing articles for evidence...');
      const evidenceAnalysis = FactChecker.analyzeArticlesForEvidence(articles);
      console.log('📊 Evidence analysis:', evidenceAnalysis);

      // STEP 4: Build enhanced message for Gemini with articles
      let geminiMessage = `Analyze this news:\n\n${text.slice(0, 6000)}`;
      
      // Include real articles in the prompt if found
      if (articles.length > 0) {
        geminiMessage += '\n\n=== REAL-TIME ARTICLES (from Google News) ===\n';
        articles.forEach((article, idx) => {
          geminiMessage += `\n${idx + 1}. "${article.title}"\n   Source: ${article.source}\n   URL: ${article.url}\n`;
        });
        geminiMessage += '\n=== END ARTICLES ===\n\nCompare the claim with these real articles. Use them as primary evidence.';
      } else {
        geminiMessage += '\n\n(No real-time articles found. Use AI reasoning based on your knowledge cutoff.)';
      }

      // STEP 5: Call Gemini with article context
      console.log('🤖 Step 4: Getting Gemini analysis with article context...');
      const content = await callGemini(
        SYSTEM_PROMPT,
        geminiMessage,
        0.1,  // low temperature for analysis
        512   // max tokens
      );

      // Parse JSON response
      if (!content || typeof content !== 'string') {
        throw new Error('Empty response from Gemini API');
      }

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // If no JSON found, return default response
        console.warn('Could not extract JSON from response:', content.slice(0, 100));
        return {
          verdict: 'Misleading / Partially True',
          confidence: 50,
          explanation: 'Could not parse structured response from the AI model. ' + content.slice(0, 100),
          key_signals: ['Response parsing failed', 'Unable to extract structured data'],
          misinformation_type: 'Unverified Claim',
          sensationalism_level: 'Medium',
          verification_tips: ['Search for this story on Reuters, BBC, or AP News', 'Check official sources for verification'],
          matched_articles: articles
        };
      }

      const result = JSON.parse(jsonMatch[0]);
      
      // Add matched articles to result
      result.matched_articles = articles;
      
      // Debug logging
      console.log('🤖 Gemini API Response:', content);
      console.log('📋 Parsed JSON:', result);
      
      // CRITICAL: Fix contradictions
      if (result.misinformation_type) {
        const misLower = result.misinformation_type.toLowerCase();
        
        if (misLower === 'fabricated content' || misLower === 'propaganda' || misLower === 'false context') {
          if (result.verdict && !result.verdict.toLowerCase().includes('false')) {
            console.log('⚠️ FIXING CONTRADICTION: misinformation_type=Fabricated but verdict=True → Correcting to False/Fabricated');
            result.verdict = 'False / Fabricated';
          }
        }
        else if (misLower === 'accurate reporting') {
          if (result.verdict && !result.verdict.toLowerCase().includes('true')) {
            console.log('⚠️ FIXING CONTRADICTION: misinformation_type=Accurate but verdict=False → Correcting to True');
            result.verdict = 'True';
          }
        }
        else if (misLower.includes('misleading') || misLower.includes('exaggeration') || misLower.includes('sensationalism')) {
          if (result.verdict && result.verdict.toLowerCase().includes('true') && !result.verdict.toLowerCase().includes('partially')) {
            console.log('⚠️ FIXING CONTRADICTION: misinformation_type=Misleading but verdict=True → Correcting to Misleading/Partially True');
            result.verdict = 'Misleading / Partially True';
          }
        }
      }
      
      // Normalize old format (fake_or_real) to new format (verdict) if needed
      if (result.fake_or_real && !result.verdict) {
        result.verdict = result.fake_or_real === 'Fake' ? 'False / Fabricated' : 'True';
        delete result.fake_or_real;
      }
      
      // Ensure all required fields exist
      if (!result.sensationalism_level) {
        result.sensationalism_level = 'Medium';
      }
      if (!result.misinformation_type) {
        result.misinformation_type = 'Unverified Claim';
      }
      
      console.log('✅ Final Result (after fixes):', result);
      return result;
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze uploaded file (image or PDF)
  /**
   * Check if Gemini API key is configured
   */
  async function ping() {
    return !!window.GEMINI_API_KEY;
  }

  /**
   * Conversational chat message via Gemini
   * @param {string} message
   * @param {Array}  history - [{role:'user'|'assistant', content:string}]
   * @returns {Promise<string>} the bot's reply text
   */
  async function chat(message, history = []) {
    try {
      // Build conversation context from history
      let conversationContext = '';
      if (history && history.length > 0) {
        const recentHistory = history.slice(-8);
        conversationContext = recentHistory
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n\n');
        conversationContext = 'Previous conversation:\n' + conversationContext + '\n\nNow respond to the user:';
      }

      const fullUserMessage = conversationContext 
        ? `${conversationContext}\n\n${message}`
        : message;

      const content = await callGemini(
        CHAT_SYSTEM_PROMPT,
        fullUserMessage,
        0.7,  // higher temperature for creative chat
        400   // max tokens
      );

      return content || 'I could not generate a response. Please try again.';
    } catch (error) {
      throw new Error(`Chat failed: ${error.message}`);
    }
  }

  return { analyzeText, chat, ping };
})();
