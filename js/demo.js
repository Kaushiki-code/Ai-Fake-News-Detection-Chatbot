/**
 * demo.js — Demo News Cards
 * Pre-loaded articles for testing the detector.
 */

const Demo = (() => {
  // ── Sample news dataset ───────────────────────────────────────
  const articles = [
    {
      id: 1, category: 'health',
      title: 'Scientists Discover a Cure for the Common Cold Using Banana Peels',
      description: 'Researchers in Iceland claim that a compound found in banana peels can eliminate rhinovirus in under 24 hours, calling it a breakthrough in antiviral therapy.',
      date: 'Mar 28, 2025',
    },
    {
      id: 2, category: 'politics',
      title: 'UN General Assembly Approves New Global Climate Framework',
      description: 'The United Nations has passed a landmark resolution committing 147 nations to net-zero emissions by 2045, with binding annual reviews and financial penalties.',
      date: 'Mar 30, 2025',
    },
    {
      id: 3, category: 'tech',
      title: 'OpenAI Unveils GPT-5 with Real-Time World Browsing',
      description: 'OpenAIs latest model can browse the live internet, execute code, and integrate with thousands of apps — redefining what AI assistants are capable of.',
      date: 'Apr 1, 2025',
    },
    {
      id: 4, category: 'health',
      title: 'Drinking 6 Cups of Coffee Daily Guaranteed to Make You Immortal, Study Claims',
      description: 'A viral post cites a "Harvard study" supposedly proving that extreme caffeine intake reverses cellular aging and extends human lifespan indefinitely.',
      date: 'Apr 1, 2025',
    },
    {
      id: 5, category: 'science',
      title: 'NASA Confirms Water Ice Found in Permanently Shadowed Craters on the Moon',
      description: 'Lunar Reconnaissance Orbiter data confirms significant water-ice deposits near the south pole, a key discovery for future Artemis crewed missions.',
      date: 'Mar 27, 2025',
    },
    {
      id: 6, category: 'politics',
      title: 'President Signs Executive Order Abolishing All Income Taxes Immediately',
      description: 'A widely shared social media post claims the White House signed legislation overnight eliminating federal income tax, verified by "anonymous insiders."',
      date: 'Apr 2, 2025',
    },
    {
      id: 7, category: 'tech',
      title: 'Apple Announces iPhone 17 Pro with Under-Screen Face ID and Titanium Frame',
      description: 'Apples new flagship ditches the dynamic island entirely, embedding Face ID sensors beneath the display alongside a new periscope telephoto camera.',
      date: 'Mar 31, 2025',
    },
    {
      id: 8, category: 'science',
      title: 'Microplastics Found in Every Human Blood Sample Tested in Major Study',
      description: 'A peer-reviewed study from Vrije Universiteit Amsterdam found micro- and nanoplastics in 77 of 80 blood samples, raising new public health concerns worldwide.',
      date: 'Mar 25, 2025',
    },
    {
      id: 9, category: 'health',
      title: 'WHO Declares Measles Outbreak a "Global Emergency" as Vaccination Rates Drop',
      description: 'The World Health Organization issued an emergency declaration as measles cases tripled in 40 countries due to declining childhood vaccination rates since 2020.',
      date: 'Apr 1, 2025',
    },
  ];

  // ── Rendering ─────────────────────────────────────────────────
  function renderCards(filter = 'all') {
    const grid = document.getElementById('demoGrid');
    if (!grid) return;

    const filtered = filter === 'all'
      ? articles
      : articles.filter(a => a.category === filter);

    // Skeleton first
    grid.innerHTML = filtered.map(() => `
      <div class="demo-skeleton glass">
        <div class="sk-line w60 skeleton"></div>
        <div class="sk-line w80 skeleton" style="height:18px;margin:12px 0"></div>
        <div class="sk-line w100 skeleton"></div>
        <div class="sk-line w100 skeleton" style="margin-top:6px"></div>
        <div class="sk-line w60 skeleton" style="margin-top:6px"></div>
      </div>`).join('');

    // Swap to real cards after short delay
    setTimeout(() => {
      grid.innerHTML = filtered.map(a => buildCard(a)).join('');
      attachAnalyzeHandlers();
    }, 600);
  }

  function buildCard(a) {
    return `
      <div class="demo-card fade-in" data-id="${a.id}" data-category="${a.category}">
        <span class="demo-card-tag">${ucFirst(a.category)}</span>
        <h3 class="demo-card-title">${escapeHTML(a.title)}</h3>
        <p class="demo-card-desc">${escapeHTML(a.description)}</p>
        <div class="demo-card-footer">
          <span class="demo-card-date">${a.date}</span>
          <button class="btn-analyze" data-article-id="${a.id}" id="analyze-btn-${a.id}" aria-label="Analyze article">
            <i class="ph ph-magnifying-glass"></i> Analyze
          </button>
        </div>
      </div>`;
  }

  function attachAnalyzeHandlers() {
    document.querySelectorAll('.btn-analyze').forEach(btn => {
      btn.addEventListener('click', () => {
        const id      = parseInt(btn.dataset.articleId);
        const article = articles.find(a => a.id === id);
        if (!article) return;

        // Animate button
        btn.classList.add('loading');
        btn.innerHTML = `<i class="ph ph-spinner-gap"></i> Analyzing…`;

        // Build text for analysis
        const text = `${article.title}\n\n${article.description}`;

        // Pass to chat for analysis
        setTimeout(() => {
          btn.classList.remove('loading');
          btn.innerHTML = `<i class="ph ph-magnifying-glass"></i> Analyze`;
          Chat.analyzeText(text);
        }, 300);
      });
    });
  }

  // ── Filter chips ──────────────────────────────────────────────
  function initFilters() {
    const demoSection = document.getElementById('section-demo');
    demoSection?.querySelectorAll('[data-filter]').forEach(chip => {
      chip.addEventListener('click', () => {
        demoSection.querySelectorAll('[data-filter]').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderCards(chip.dataset.filter);
      });
    });
  }

  // ── Utilities ─────────────────────────────────────────────────
  function escapeHTML(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }
  function ucFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    renderCards('all');
    initFilters();
  }

  return { init };
})();
