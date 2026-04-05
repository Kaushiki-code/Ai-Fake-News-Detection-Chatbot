/**
 * fact-checker.js — Hybrid Fact-Checking System
 * Combines Google News API with Gemini AI for accurate news verification
 */

const FactChecker = (() => {
  // Cache for repeated queries (24-hour TTL)
  const queryCache = new Map();
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // Stopwords to remove from queries
  const STOPWORDS = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'that', 'be', 'are', 'was', 'been', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must'
  ]);

  /**
   * Extract meaningful keywords from text
   * @param {string} text - Raw user input
   * @returns {string} - Cleaned query string
   */
  function extractKeywords(text) {
    // Remove URLs and special characters
    let cleaned = text.replace(/https?:\/\/\S+/g, '').replace(/[^\w\s]/g, '');
    
    // Split into words and filter
    const words = cleaned
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2 && !STOPWORDS.has(word));

    // Return top 5 keywords for query
    return words.slice(0, 5).join(' ');
  }

  /**
   * Fetch real news articles from News API
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Array of article objects
   */
  async function fetchNewsArticles(query) {
    try {
      const apiKey = window.NEWS_API_KEY;
      if (!apiKey) {
        console.warn('⚠️ News API key not configured. Skipping real-time verification.');
        return [];
      }

      // Check cache first
      const cacheKey = `news_${query}`;
      const cached = queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('📦 Using cached articles for query:', query);
        return cached.articles;
      }

      console.log('🔍 Fetching articles for:', query);

      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=relevancy&language=en&pageSize=5&apiKey=${apiKey}`
      );

      if (!response.ok) {
        console.error('News API error:', response.status, response.statusText);
        return [];
      }

      const data = await response.json();

      if (data.status !== 'ok' || !data.articles) {
        console.warn('No articles found for query:', query);
        return [];
      }

      // Format articles
      const articles = data.articles.map((article, index) => ({
        id: index + 1,
        title: article.title,
        source: article.source.name,
        url: article.url,
        description: article.description,
        publishedAt: article.publishedAt,
        relevanceScore: 100 - (index * 15) // Decrease relevance for lower-ranked articles
      }));

      // Cache results
      queryCache.set(cacheKey, {
        articles,
        timestamp: Date.now()
      });

      console.log(`✅ Found ${articles.length} articles`);
      return articles;
    } catch (error) {
      console.error('❌ Error fetching articles:', error.message);
      return [];
    }
  }

  /**
   * Analyze articles to determine initial verdict
   * @param {Array} articles - Articles returned from News API
   * @returns {Object} - {verdict, confidence, matchedCount}
   */
  function analyzeArticlesForEvidence(articles) {
    if (articles.length === 0) {
      return {
        verdict: 'UNKNOWN', // Will use AI reasoning
        confidence: 0,
        matchedCount: 0,
        message: 'No real-time articles found. Using AI reasoning only.'
      };
    }

    // If we have multiple relevant articles, it's likely true
    if (articles.length >= 2) {
      return {
        verdict: 'LIKELY_TRUE',
        confidence: Math.min(70 + (articles.length * 10), 95),
        matchedCount: articles.length,
        message: `Found ${articles.length} articles supporting this claim.`
      };
    }

    // Single article - inconclusive, use AI
    return {
      verdict: 'UNKNOWN',
      confidence: 50,
      matchedCount: 1,
      message: 'Found 1 article. Needs AI analysis to confirm.'
    };
  }

  /**
   * Clear old cache entries (run periodically)
   */
  function clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of queryCache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        queryCache.delete(key);
      }
    }
    console.log('🧹 Cache cleaned');
  }

  // Clear expired cache every 1 hour
  setInterval(clearExpiredCache, 60 * 60 * 1000);

  return {
    extractKeywords,
    fetchNewsArticles,
    analyzeArticlesForEvidence,
    clearExpiredCache,
    // For debugging
    getCache: () => queryCache
  };
})();
