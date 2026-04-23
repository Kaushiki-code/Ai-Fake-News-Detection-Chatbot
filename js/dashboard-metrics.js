/**
 * dashboard-metrics.js — Enhanced Dashboard Metrics
 * Tracks and displays advanced metrics for the dashboard
 */

const DashboardMetrics = (() => {
  const METRICS_KEY = 'truthlens_metrics';
  const ACTIVITY_KEY = 'truthlens_activity';
  const MAX_ACTIVITY_ITEMS = 10;

  // ── Helper: Escape HTML ──────────────────────────────────────
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Load & Save Metrics ──────────────────────────────────────
  function loadMetrics() {
    try {
      return JSON.parse(localStorage.getItem(METRICS_KEY)) || { timings: [], categories: {} };
    } catch { return { timings: [], categories: {} }; }
  }

  function saveMetrics(metrics) {
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
  }

  function loadActivity() {
    try {
      return JSON.parse(localStorage.getItem(ACTIVITY_KEY)) || [];
    } catch { return []; }
  }

  function saveActivity(activity) {
    localStorage.setItem(ACTIVITY_KEY, JSON.stringify(activity));
  }

  // ── Add Activity Entry ──────────────────────────────────────
  function addActivityEntry(text, result) {
    const activity = loadActivity();
    const entry = {
      id: Date.now(),
      text: text.slice(0, 80),
      verdict: result.fake_or_real || result.verdict || 'uncertain',
      confidence: result.confidence || 0,
      timestamp: new Date().getTime(),
    };
    activity.unshift(entry);
    if (activity.length > MAX_ACTIVITY_ITEMS) {
      activity.splice(MAX_ACTIVITY_ITEMS);
    }
    saveActivity(activity);
    renderActivityFeed();
  }

  // ── Track Metrics ──────────────────────────────────────
  function trackMetric(result, processingTime = 0) {
    const metrics = loadMetrics();

    // Track timing
    if (processingTime > 0) {
      metrics.timings = metrics.timings || [];
      metrics.timings.push(processingTime);
      if (metrics.timings.length > 100) metrics.timings.shift();
    }

    // Track category
    const category = result.category || result.misinformation_type || 'Other';
    metrics.categories = metrics.categories || {};
    metrics.categories[category] = (metrics.categories[category] || 0) + 1;

    saveMetrics(metrics);
    updateAllMetrics();
  }

  // ── Calculate Stats ──────────────────────────────────────
  function getMetrics() {
    const history = HistoryManager ? HistoryManager.getStats?.() : { total: 0, fake: 0, real: 0, uncertain: 0 };
    const metrics = loadMetrics();
    const activity = loadActivity();

    const total = history.total || 0;
    const fakeCount = history.fake || 0;
    const realCount = history.real || 0;
    const uncertainCount = history.uncertain || 0;

    // Calculate accuracy rate: (real news / all definite results) * 100
    // Exclude uncertain from this calculation
    const definiteCount = fakeCount + realCount;
    const accuracyRate = definiteCount === 0 ? 0 : Math.round((realCount / definiteCount) * 100);

    // Calculate average confidence
    let avgConfidence = 0;
    if (HistoryManager?.load) {
      const items = HistoryManager.load?.() || [];
      const confidences = items.map(i => i.confidence || 0).filter(c => c > 0);
      avgConfidence = confidences.length > 0
        ? Math.round(confidences.reduce((a, b) => a + b) / confidences.length)
        : 0;
    }

    // Calculate average processing time (in ms)
    let avgTime = 0;
    if (metrics.timings && metrics.timings.length > 0) {
      avgTime = Math.round(metrics.timings.reduce((a, b) => a + b) / metrics.timings.length);
    }

    // Get hottest category
    let hottestCategory = '—';
    let maxCount = 0;
    if (metrics.categories) {
      for (const [category, count] of Object.entries(metrics.categories)) {
        if (count > maxCount) {
          maxCount = count;
          hottestCategory = category.replace('_', ' ').slice(0, 20);
        }
      }
    }

    // Calculate trust score (0-100 based on data quality)
    let trustScore = 50; // baseline
    if (total > 5) trustScore += 20;
    if (total > 20) trustScore += 10;
    if (avgConfidence > 75) trustScore += 15;
    if (avgConfidence > 85) trustScore += 5;
    trustScore = Math.min(100, trustScore);

    return {
      total,
      fakeCount,
      realCount,
      accuracyRate,
      avgConfidence,
      avgTime,
      hottestCategory,
      trustScore,
      categories: metrics.categories || {},
    };
  }

  // ── Update UI ──────────────────────────────────────────
  function updateAllMetrics() {
    const stats = getMetrics();

    // Update accuracy card
    const accuracyEl = document.getElementById('counterAccuracy');
    if (accuracyEl) {
      accuracyEl.textContent = stats.accuracyRate + '%';
    }

    // Update metric cards
    updateMetricValue('avgConfidence', stats.avgConfidence > 0 ? stats.avgConfidence + '%' : '—');
    updateMetricValue('avgTime', stats.avgTime > 0 ? stats.avgTime + 'ms' : '—');
    updateMetricValue('hottestCategory', stats.hottestCategory);
    updateMetricValue('trustScore', stats.trustScore > 0 ? stats.trustScore + '%' : '—');

    // Update category breakdown
    updateCategoryBreakdown(stats.categories);

    // Update confidence distribution
    updateConfidenceDistribution();

    // Update donut chart
    updateDonutChart(stats.accuracyRate);

    // Update trends
    updateTrends();
  }

  function updateMetricValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // ── Donut Chart Update ──────────────────────────────────────
  function updateDonutChart(realPct) {
    const arc = document.getElementById('donutArc');
    const pct = document.getElementById('donutPct');
    if (!arc || !pct) return;

    // SVG circle radius is 48, so circumference = 2 * π * 48 ≈ 301.59
    const circumference = 2 * Math.PI * 48;
    const filled = (realPct / 100) * circumference;
    arc.style.strokeDasharray = `${filled} ${circumference - filled}`;
    pct.textContent = realPct + '%';
  }

  // ── Category Breakdown ──────────────────────────────────────
  function updateCategoryBreakdown(categories) {
    const container = document.getElementById('categoryBreakdown');
    if (!container) return;

    const categoryCount = Object.keys(categories).length;
    if (categoryCount === 0) {
      container.innerHTML = `
        <div class="empty-breakdown">
          <i class="ph ph-chart-pie"></i>
          <p>No data yet</p>
        </div>`;
      return;
    }

    // Sort by count
    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const maxCount = sorted[0]?.[1] || 1;

    const colors = [
      '#4B5DFF', '#FF6F91', '#34D399', '#FBBF24', '#F87171', '#A78BFA'
    ];

    container.innerHTML = sorted.map(([ category, count ], idx) => {
      const percentage = Math.round((count / maxCount) * 100);
      const color = colors[idx % colors.length];
      const label = category.replace(/_/g, ' ').slice(0, 25);

      return `
        <div class="category-item">
          <div class="category-dot" style="background-color: ${color}; box-shadow: 0 0 8px ${color}80;"></div>
          <div class="category-label">${label}</div>
          <div class="category-count">${count}</div>
        </div>
      `;
    }).join('');
  }

  // ── Confidence Distribution ──────────────────────────────────────
  function updateConfidenceDistribution() {
    if (!HistoryManager?.load) return;

    const items = HistoryManager.load?.() || [];
    const ranges = {
      '90-100%': 0,
      '70-89%': 0,
      '50-69%': 0,
      '0-49%': 0,
    };

    items.forEach(item => {
      const conf = item.confidence || 0;
      if (conf >= 90) ranges['90-100%']++;
      else if (conf >= 70) ranges['70-89%']++;
      else if (conf >= 50) ranges['50-69%']++;
      else ranges['0-49%']++;
    });

    const maxCount = Math.max(...Object.values(ranges), 1);
    const bars = document.querySelectorAll('.confidence-bar-item');

    let idx = 0;
    Object.entries(ranges).forEach(([label, count]) => {
      if (bars[idx]) {
        const percentage = Math.round((count / maxCount) * 100);
        const fill = bars[idx].querySelector('.bar-fill');
        const countEl = bars[idx].querySelector('.bar-count');
        
        if (fill) {
          fill.style.width = percentage + '%';
        }
        if (countEl) {
          countEl.textContent = count;
        }
      }
      idx++;
    });
  }

  // ── Recent Activity Feed ──────────────────────────────────────
  function renderActivityFeed() {
    const container = document.getElementById('activityList');
    if (!container) return;

    const activity = loadActivity();
    if (activity.length === 0) {
      container.innerHTML = `
        <div class="empty-activity">
          <i class="ph ph-file-dashed"></i>
          <p>No checks yet. Start analyzing!</p>
        </div>`;
      return;
    }

    container.innerHTML = activity.map(item => {
      const verdict = (item.verdict || 'uncertain').toLowerCase();
      const isFake = verdict.includes('fake') || verdict.includes('false');
      const badgeClass = isFake ? 'fake' : 'real';
      const icon = isFake ? 'ph-warning-circle' : 'ph-check-circle';
      const timeAgo = getTimeAgo(item.timestamp);

      return `
        <div class="activity-item">
          <div class="activity-badge ${badgeClass}"></div>
          <div class="activity-text">
            <div class="activity-title">${escapeHTML(item.text)}</div>
            <div class="activity-meta">
              <span>${timeAgo}</span>
            </div>
          </div>
          <div class="activity-confidence">${item.confidence}%</div>
        </div>
      `;
    }).join('');
  }

  // ── Trends ──────────────────────────────────────────────────────────
  function updateTrends() {
    if (!HistoryManager?.load) return;

    const items = HistoryManager.load?.() || [];
    if (items.length < 2) return;

    const recent = items.slice(0, Math.ceil(items.length / 2));
    const older = items.slice(Math.ceil(items.length / 2));

    const recentFake = recent.filter(i => i.label?.toLowerCase() === 'fake').length;
    const olderFake = older.filter(i => i.label?.toLowerCase() === 'fake').length;

    const recentRate = recent.length > 0 ? (recentFake / recent.length) : 0;
    const olderRate = older.length > 0 ? (olderFake / older.length) : 0;

    const diff = Math.round((recentRate - olderRate) * 100);
    const trendEl = document.getElementById('trendTotal');

    if (trendEl) {
      const isUp = diff > 0;
      const arrow = isUp ? 'ph-arrow-up' : 'ph-arrow-down';
      const className = isUp ? '' : 'down';
      trendEl.className = `stat-trend ${className}`;
      trendEl.innerHTML = `<i class="ph ${arrow}"></i> <span>${Math.abs(diff)}%</span>`;
    }
  }

  // ── Helper: Time Ago ──────────────────────────────────────
  function getTimeAgo(timestamp) {
    const now = new Date().getTime();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return new Date(timestamp).toLocaleDateString();
  }

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    updateAllMetrics();
    // Update every 10 seconds
    setInterval(updateAllMetrics, 10000);
  }

  return {
    init,
    trackMetric,
    addActivityEntry,
    updateAllMetrics,
    getMetrics,
  };
})();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => DashboardMetrics.init(), 500);
});
