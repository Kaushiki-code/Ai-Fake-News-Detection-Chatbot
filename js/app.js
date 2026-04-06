/**
 * app.js — Main Application Controller
 * Handles SPA navigation, sidebar toggle, toasts, API status check,
 * quick-analyze on dashboard, and wires all modules together.
 */

// ── Toast System ──────────────────────────────────────────────────
const Toast = (() => {
  const ICONS = { success: '✓', error: '✕', info: 'ℹ' };

  function show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${ICONS[type] || 'ℹ'}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  }

  return { show };
})();

// ── SPA Navigation ─────────────────────────────────────────────────
const AppNav = (() => {
  const sections = ['dashboard', 'chatbot', 'demo', 'history'];
  const titles   = {
    dashboard: 'Dashboard',
    chatbot:   'AI Chatbot',
    demo:      'Demo News',
    history:   'History',
  };

  let current = 'dashboard';

  function goTo(name) {
    if (!sections.includes(name)) return;
    if (current === name) return;

    // Deactivate old
    document.getElementById(`section-${current}`)?.classList.remove('active');
    document.getElementById(`nav-${current}`)?.classList.remove('active');

    // Activate new
    current = name;
    document.getElementById(`section-${current}`)?.classList.add('active');
    document.getElementById(`nav-${current}`)?.classList.add('active');

    // Update page title
    const titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = titles[current] || current;

    // Trigger section-specific init actions
    if (name === 'history') HistoryManager.render();
    if (name === 'demo' && !window._demoInited) {
      window._demoInited = true;
      Demo.init();  // Lazy-init demo cards only when first visited
    }

    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar?.classList.contains('mobile-open')) {
      sidebar.classList.remove('mobile-open');
    }
  }

  function init() {
    // Wire nav items
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        goTo(item.dataset.section);
      });
    });
  }

  return { init, goTo, getCurrent: () => current };
})();

// ── Sidebar Toggle ─────────────────────────────────────────────────
function initSidebar() {
  const sidebar     = document.getElementById('sidebar');
  const wrapper     = document.getElementById('mainWrapper');
  const toggleBtn   = document.getElementById('sidebarToggle');
  const mobileBtn   = document.getElementById('mobileMenuBtn');

  let collapsed = false;

  toggleBtn?.addEventListener('click', () => {
    collapsed = !collapsed;
    sidebar?.classList.toggle('collapsed', collapsed);
    wrapper?.classList.toggle('collapsed', collapsed);
    localStorage.setItem('sidebarCollapsed', collapsed);
  });

  mobileBtn?.addEventListener('click', () => {
    sidebar?.classList.toggle('mobile-open');
  });

  // Restore collapse state
  if (localStorage.getItem('sidebarCollapsed') === 'true') {
    collapsed = true;
    sidebar?.classList.add('collapsed');
    wrapper?.classList.add('collapsed');
  }
}

// ── Quick Analyze (Dashboard) ──────────────────────────────────────
function initQuickAnalyze() {
  const btn    = document.getElementById('quickAnalyzeBtn');
  const input  = document.getElementById('quickInput');
  const result = document.getElementById('qaResult');

  if (!btn || !input || !result) return;

  btn.addEventListener('click', async () => {
    const text = input.value.trim();
    if (!text) { Toast.show('Please enter some text to analyze.', 'error'); return; }

    // Button loading state
    btn.disabled = true;
    btn.innerHTML = `<i class="ph ph-spinner-gap" style="animation:spin 0.8s linear infinite"></i> Analyzing…`;
    result.classList.add('hidden');

    try {
      const data = await API.analyzeText(text);

      const verdict = String(data.verdict || data.fake_or_real || '').toLowerCase();
      const isUncertain = verdict.includes('uncertain');
      const isFake = verdict.includes('fake') || verdict.includes('false') || verdict.includes('misleading');
      const label = isUncertain ? 'Uncertain' : (isFake ? 'Fake News' : 'Real News');
      const badgeCls = isFake ? 'badge-fake' : 'badge-real';
      const icon = isUncertain ? 'ph-question' : (isFake ? 'ph-warning-circle' : 'ph-check-circle');
      const conf     = Math.round(data.confidence ?? 0);
      const exp      = escapeHTML(data.explanation ?? '');

      result.innerHTML = `
        <div class="qa-result-header">
          <span class="badge ${badgeCls}">
            <i class="ph-fill ${icon}"></i> ${label}
          </span>
        </div>
        <div class="progress-wrap">
          <div class="progress-label">
            <span>Confidence</span><span>${conf}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width:0%" data-target="${conf}"></div>
          </div>
        </div>
        <p class="qa-result-explanation">${exp}</p>`;

      result.classList.remove('hidden');
      // Animate bar
      requestAnimationFrame(() => {
        setTimeout(() => {
          result.querySelector('.progress-fill').style.width = conf + '%';
        }, 80);
      });

      // Save to history
      HistoryManager.add(text, data);
      Toast.show(`Analysis complete — ${label}!`, isFake ? 'error' : 'success');

    } catch (err) {
      result.innerHTML = `<p style="color:var(--pink);font-size:.85rem">⚠️ ${escapeHTML(err.message)}</p>`;
      result.classList.remove('hidden');
      Toast.show('Analysis failed', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="ph ph-magnifying-glass"></i> Analyze Now`;
    }
  });

  // Allow Enter in textarea to trigger
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.ctrlKey) btn.click();
  });
}

// ── API Status Indicator ───────────────────────────────────────────
async function checkAPIStatus() {
  const statusEl = document.getElementById('apiStatus');
  if (!statusEl) return;

  const dot  = statusEl.querySelector('.status-dot');
  const text = statusEl.querySelector('span:last-child');

  const ok = await API.ping();

  if (!ok) {
    dot.style.background = 'var(--pink)';
    dot.style.boxShadow  = '0 0 8px var(--pink-glow)';
    if (text) text.textContent = 'API Offline';
  }
}

// ── Ripple Effect ──────────────────────────────────────────────────
function initRipple() {
  document.querySelectorAll('.btn-primary').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const r  = document.createElement('span');
      const d  = Math.max(btn.clientWidth, btn.clientHeight);
      const rect = btn.getBoundingClientRect();
      r.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none;
        width:${d}px; height:${d}px;
        left:${e.clientX - rect.left - d/2}px;
        top:${e.clientY - rect.top - d/2}px;
        background:rgba(255,255,255,0.2);
        transform:scale(0); animation:ripple .6s linear;`;
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(r);
      r.addEventListener('animationend', () => r.remove());
    });
  });

  // Add keyframe if not already added
  if (!document.getElementById('rippleStyle')) {
    const s = document.createElement('style');
    s.id = 'rippleStyle';
    s.textContent = `@keyframes ripple { to { transform:scale(4); opacity:0; } }`;
    document.head.appendChild(s);
  }
}

// ── Spinner keyframe ───────────────────────────────────────────────
(function() {
  const s = document.createElement('style');
  s.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(s);
})();

// ── Utilities ──────────────────────────────────────────────────────
function escapeHTML(str) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(str)));
  return d.innerHTML;
}

// ── Bootstrap ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  AppNav.init();
  initSidebar();
  Chat.init();
  // Demo lazy-inits when user navigates to it (see AppNav.goTo)
  HistoryManager.init();
  initQuickAnalyze();
  initRipple();
  // Defer API status check — not critical at startup
  setTimeout(checkAPIStatus, 2000);
});
