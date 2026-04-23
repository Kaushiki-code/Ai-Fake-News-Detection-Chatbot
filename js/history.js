/**
 * history.js — History Management
 * Persists analysis results in localStorage.
 * Renders and filters the History section.
 */

const HistoryManager = (() => {
  const STORAGE_KEY = 'truthlens_history';

  // ── Helpers ──────────────────────────────────────────────────
  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch { return []; }
  }

  function save(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  /**
   * Add a new result entry to history.
   * @param {string} text
   * @param {{verdict, confidence, explanation}} result
   */
  function add(text, result) {
    const items = load();
    
    // Normalize verdict to standard label
    const verdict = String(result.verdict || '').toUpperCase().trim();
    let label = 'uncertain';
    if (verdict === 'TRUE') label = 'real';
    else if (verdict === 'FAKE') label = 'fake';
    
    const entry = {
      id: Date.now(),
      text: text.slice(0, 200),           // store preview
      label: label,
      verdict: verdict,
      confidence: result.confidence || 0,
      explanation: result.explanation || '',
      timestamp: new Date().toISOString(),
    };
    items.unshift(entry);
    if (items.length > 200) items.splice(200); // cap at 200
    save(items);

    // Update dashboard counters
    updateStats();
    
    // Track metrics and activity (if DashboardMetrics is loaded)
    if (typeof DashboardMetrics !== 'undefined') {
      DashboardMetrics.trackMetric(result);
      DashboardMetrics.addActivityEntry(text, result);
    }
    
    // Re-render if history section is visible
    render(currentFilter);
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    save([]);
    updateStats();
    render(currentFilter);
  }

  // ── Stats ─────────────────────────────────────────────────────
  function getStats() {
    const items = load();
    const total = items.length;
    const fake  = items.filter(i => i.label === 'fake').length;
    const real  = items.filter(i => i.label === 'real').length;
    return { total, fake, real };
  }

  function updateStats() {
    const { total, fake, real } = getStats();

    // Animate counter from current to new value
    animateCounter('counterTotal', total);
    animateCounter('counterFake', fake);
    animateCounter('counterReal', real);

    // Update donut chart
    updateDonut(total === 0 ? 0 : Math.round((real / total) * 100));
  }

  function animateCounter(id, target) {
    const el = document.getElementById(id);
    if (!el) return;
    const start = parseInt(el.textContent) || 0;
    const duration = 800;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + (target - start) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function updateDonut(realPct) {
    const arc = document.getElementById('donutArc');
    const pct = document.getElementById('donutPct');
    if (!arc || !pct) return;

    // SVG circle radius is 48, so circumference = 2 * π * 48 ≈ 301.59
    const circumference = 2 * Math.PI * 48;
    const filled = (realPct / 100) * circumference;
    arc.style.strokeDasharray = `${filled} ${circumference - filled}`;
    pct.textContent = realPct + '%';
  }

  // ── Rendering ─────────────────────────────────────────────────
  let currentFilter = 'all';

  function render(filter = 'all') {
    currentFilter = filter;
    const listEl  = document.getElementById('historyList');
    const emptyEl = document.getElementById('historyEmpty');
    if (!listEl) return;

    let items = load();
    if (filter === 'fake') items = items.filter(i => i.label?.toLowerCase() === 'fake');
    if (filter === 'real') items = items.filter(i => i.label?.toLowerCase() === 'real');

    if (items.length === 0) {
      listEl.innerHTML = '';
      emptyEl?.classList.remove('hidden');
      return;
    }
    emptyEl?.classList.add('hidden');

    listEl.innerHTML = items.map(item => buildItemHTML(item)).join('');
  }

  function buildItemHTML(item) {
    const isFake  = item.label?.toLowerCase() === 'fake';
    const label   = isFake ? 'Fake' : 'Real';
    const dotCls  = isFake ? 'fake' : 'real';
    const badgeCls = isFake ? 'badge-fake' : 'badge-real';
    const conf    = item.confidence ? `${Math.round(item.confidence)}%` : '—';
    const time    = formatDate(item.timestamp);
    const preview = escapeHTML(item.text);

    return `
      <div class="history-item fade-in" data-id="${item.id}">
        <span class="dot ${dotCls}"></span>
        <div class="history-text">
          <div class="history-preview" title="${preview}">${preview}</div>
          <div class="history-meta">${time}</div>
        </div>
        <span class="badge ${badgeCls}">${label}</span>
        <span class="history-confidence">${conf}</span>
      </div>`;
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    updateStats();
    render('all');

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        render(btn.dataset.filter);
      });
    });

    // Clear history button
    document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
      if (confirm('Clear all history?')) {
        clear();
        Toast.show('History cleared', 'info');
      }
    });
  }

  return { init, add, clear, getStats, render, load };
})();
