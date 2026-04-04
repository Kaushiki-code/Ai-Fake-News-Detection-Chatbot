/**
 * chat.js — Chatbot Logic
 * Renders messages, handles file upload, calls the API.
 */

const Chat = (() => {
  let selectedFile = null;           // currently attached file
  let isProcessing = false;          // prevent double-sends

  // ── Conversation History (multi-turn memory) ───────────────────
  // Keeps the last 20 turns so the AI can answer follow-up questions.
  const conversationHistory = [];  // [{role:'user'|'assistant', content:str}]
  const MAX_HISTORY_TURNS   = 20;

  function pushHistory(role, content) {
    conversationHistory.push({ role, content });
    // Keep only the most recent MAX_HISTORY_TURNS entries
    if (conversationHistory.length > MAX_HISTORY_TURNS) {
      conversationHistory.splice(0, conversationHistory.length - MAX_HISTORY_TURNS);
    }
  }

  // ── DOM refs ──────────────────────────────────────────────────
  const messagesEl  = () => document.getElementById('chatMessages');
  const inputEl     = () => document.getElementById('chatInput');
  const sendBtn     = () => document.getElementById('sendBtn');
  const typingEl    = () => document.getElementById('typingIndicator');
  const fileInput   = () => document.getElementById('fileUpload');
  const fileTagEl   = () => document.getElementById('fileTag');

  // ── Message Helpers ───────────────────────────────────────────
  function addMessage(role, html) {
    const wrap = document.createElement('div');
    wrap.className = `message ${role} fade-in`;

    const isBot = role === 'bot';
    if (isBot) {
      wrap.innerHTML = `
        <div class="msg-avatar bot-avatar-sm">
          <i class="ph-fill ph-robot"></i>
        </div>
        <div class="msg-bubble bot-bubble">${html}</div>`;
    } else {
      wrap.innerHTML = `
        <div class="msg-bubble user-bubble">${escapeHTML(html)}</div>`;
    }

    messagesEl().appendChild(wrap);
    scrollToBottom();
    return wrap;
  }

  function showTyping() {
    typingEl()?.classList.remove('hidden');
    scrollToBottom();
  }
  function hideTyping() {
    typingEl()?.classList.add('hidden');
  }

  function scrollToBottom() {
    const el = messagesEl();
    if (el) el.scrollTop = el.scrollHeight;
  }

  // ── Build Result HTML ─────────────────────────────────────────
  function buildResultHTML(result) {
    // Debug: log what we received
    console.log('📊 Analysis Result:', result);
    
    // Determine if it's fake based on verdict or misinformation_type
    // CRITICAL: If misinformation_type says "Fabricated Content", it MUST be fake
    let isFake = false;
    let debugReason = '';
    
    // OVERRIDE: Check misinformation_type FIRST for Fabricated Content
    if (result.misinformation_type) {
      const misLower = result.misinformation_type.toLowerCase();
      
      if (misLower === 'fabricated content') {
        isFake = true;
        debugReason = `misinformation_type="${result.misinformation_type}" (FABRICATED) → FORCE FAKE`;
        console.log('⚠️ OVERRIDE: Fabricated Content detected → showing as FAKE NEWS');
      } else if (misLower.includes('false') || misLower === 'propaganda') {
        isFake = true;
        debugReason = `misinformation_type="${result.misinformation_type}" → FAKE`;
      } else if (misLower === 'accurate reporting') {
        isFake = false;
        debugReason = `misinformation_type="${result.misinformation_type}" → REAL`;
      }
    }
    
    // If not determined by misinformation_type, check verdict
    if (debugReason === '') {
      if (result.verdict) {
        const verdictLower = result.verdict.toLowerCase();
        debugReason = `verdict="${result.verdict}"`;
        
        // Check for False or Fabricated keywords (definitely fake)
        if (verdictLower.includes('false') || verdictLower.includes('fabricated')) {
          isFake = true;
          debugReason += ' → FAKE (false/fabricated)';
        } 
        // Check for Misleading (also treat as problematic/fake)
        else if (verdictLower.includes('misleading') || verdictLower.includes('partially true')) {
          isFake = true;
          debugReason += ' → FAKE (misleading/partially true)';
        } 
        // Check for True (real)
        else if (verdictLower.includes('true') && !verdictLower.includes('partially')) {
          isFake = false;
          debugReason += ' → REAL (true)';
        }
      } else if (result.fake_or_real) {
        // Legacy format fallback
        const legacyLower = result.fake_or_real?.toLowerCase();
        debugReason = `fake_or_real="${result.fake_or_real}"`;
        isFake = legacyLower === 'fake';
        debugReason += isFake ? ' → FAKE' : ' → REAL';
      }
    }
    
    console.log('🎯 Verdict Decision:', debugReason, '→', isFake ? '🚨 FAKE' : '✅ REAL');
    
    const label      = isFake ? 'Fake News' : 'Real News';
    const badgeCls   = isFake ? 'badge-fake' : 'badge-real';
    const icon       = isFake ? 'ph-warning-circle' : 'ph-check-circle';
    const conf       = Math.round(result.confidence ?? 0);
    const explanation = escapeHTML(result.explanation ?? 'No explanation available.');

    // Key signals chips
    const signals = Array.isArray(result.key_signals) ? result.key_signals : [];
    const signalsHTML = signals.length
      ? `<div class="result-signals">
           <span class="result-section-label">🔍 Key Signals Detected</span>
           <div class="signal-chips">
             ${signals.map(s => `<span class="signal-chip ${isFake ? 'signal-fake' : 'signal-real'}">${escapeHTML(s)}</span>`).join('')}
           </div>
         </div>`
      : '';

    // Misinformation type tag
    const misType = result.misinformation_type || '';
    const misTypeHTML = misType
      ? `<div class="result-mistype">
           <span class="result-section-label">📂 Category</span>
           <span class="mistype-tag ${isFake ? 'mistype-fake' : 'mistype-real'}">${escapeHTML(misType)}</span>
         </div>`
      : '';

    // Verification tips
    const tips = Array.isArray(result.verification_tips) ? result.verification_tips : [];
    const tipsHTML = tips.length
      ? `<div class="result-tips">
           <span class="result-section-label">✅ How to Verify</span>
           <ul class="tips-list">
             ${tips.map(t => `<li><i class="ph ph-arrow-right"></i>${escapeHTML(t)}</li>`).join('')}
           </ul>
         </div>`
      : '';

    return `
      <div class="analysis-result">
        <div class="result-row">
          <span class="badge ${badgeCls}">
            <i class="ph-fill ${icon}"></i> ${label}
          </span>
        </div>
        <div class="progress-wrap">
          <div class="progress-label">
            <span>Confidence</span>
            <span>${conf}%</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" data-target="${conf}" style="width:0%"></div>
          </div>
        </div>
        <p class="explanation">${explanation}</p>
        ${signalsHTML}
        ${misTypeHTML}
        ${tipsHTML}
      </div>`;
  }

  function animateProgressBars() {
    document.querySelectorAll('.progress-fill[data-target]').forEach(bar => {
      const target = bar.dataset.target;
      if (!bar.dataset.animated) {
        bar.dataset.animated = '1';
        requestAnimationFrame(() => {
          setTimeout(() => { bar.style.width = target + '%'; }, 50);
        });
      }
    });
  }

  // ── Parse Chat Verdict Reply → Animated Result Card ──────────
  /**
   * If the chat API returns a verdict reply (from news detection routing),
   * parse the verdict/confidence/explanation and render as an animated card.
   * Returns null if the reply is not a verdict.
   */
  function parseVerdictReply(reply) {
    const isFakeVerdict = reply.includes('🚨') && reply.toUpperCase().includes('FAKE');
    const isRealVerdict = reply.includes('✅') && reply.toUpperCase().includes('REAL');
    if (!isFakeVerdict && !isRealVerdict) return null;

    // Extract confidence percentage (e.g. "85.0%" or "85%")
    const confMatch = reply.match(/(\d+(?:\.\d+)?)%/);
    const confidence = confMatch ? parseFloat(confMatch[1]) : 70;

    // Extract explanation — text after "**Analysis:**" up to the "---" separator
    let explanation = '';
    const analysisMatch = reply.match(/\*\*Analysis:\*\*\s*([\s\S]*?)(?:\n---|\.\s*$|$)/);
    if (analysisMatch) {
      explanation = analysisMatch[1].trim().replace(/\n/g, ' ');
    }

    return {
      fake_or_real: isFakeVerdict ? 'fake' : 'real',
      confidence,
      explanation: explanation || 'Analysis complete.',
    };
  }


  // ── Send Message ──────────────────────────────────────────────
  async function send() {
    if (isProcessing) return;
    const text = inputEl()?.value.trim();

    if (!text && !selectedFile) {
      Toast.show('Please type something or attach a file.', 'error');
      return;
    }

    isProcessing = true;
    sendBtn()?.setAttribute('disabled', true);

    // Show user message
    const displayText = selectedFile ? `📎 ${selectedFile.name}${text ? '\n\n' + text : ''}` : text;
    addMessage('user', displayText);

    // Clear input
    inputEl().value = '';
    autoResize(inputEl());
    const fileAtSend = selectedFile;
    clearFile();

    // Show typing
    showTyping();

    try {
      if (fileAtSend) {
        // File upload → always analyze
        const result = await API.analyzeFile(fileAtSend);
        hideTyping();
        const resultHTML = `<p>Here's my analysis:</p>${buildResultHTML(result)}`;
        addMessage('bot', resultHTML);
        animateProgressBars();
        HistoryManager.add(fileAtSend.name, result);
        // Add context to history so user can ask follow-ups
        pushHistory('user', `[File uploaded: ${fileAtSend.name}]`);
        pushHistory('assistant', `Analysis: ${result.fake_or_real} (${Math.round(result.confidence)}% confidence). ${result.explanation}`);

      } else if (isNewsContent(text)) {
        // News headline/article → analyze for fake news
        pushHistory('user', text);  // Add to history BEFORE the API call
        const result = await API.analyzeText(text);
        hideTyping();
        const resultHTML = `<p>Here's my analysis:</p>${buildResultHTML(result)}`;
        addMessage('bot', resultHTML);
        animateProgressBars();
        HistoryManager.add(text, result);
        // Store rich context so AI can answer follow-ups about this article
        const signals = result.key_signals?.join(', ') || '';
        const botContext = `I analyzed the news: "${text.substring(0, 200)}". Verdict: ${result.fake_or_real} (${Math.round(result.confidence)}% confidence). ${result.explanation}${signals ? ` Key signals: ${signals}.` : ''}`;
        pushHistory('assistant', botContext);

      } else {
        // Short/casual message (greeting or question) → conversational chat with history
        pushHistory('user', text);
        const reply = await API.chat(text, conversationHistory.slice(0, -1));
        hideTyping();
        pushHistory('assistant', reply);
        addMessage('bot', renderMarkdown(reply));
      }

    } catch (error) {
      hideTyping();
      const errorMsg = error.message?.includes('fetch')
        ? '⚠️ Cannot reach the backend. Make sure the server is running at <code>' + API.BASE_URL + '</code>.'
        : `⚠️ Error: ${escapeHTML(error.message)}`;
      addMessage('bot', `<p>${errorMsg}</p>`);
      Toast.show('Request failed', 'error');
    } finally {
      isProcessing = false;
      sendBtn()?.removeAttribute('disabled');
    }
  }

  /**
   * Returns true if text looks like a news headline or article.
   * Returns false for conversational follow-ups, questions, greetings.
   */
  function isNewsContent(text) {
    if (!text) return false;
    const trimmed = text.trim();
    const lower   = trimmed.toLowerCase();
    const words   = lower.split(/\s+/);

    // URLs always go to /analyze
    if (/^https?:\/\//i.test(trimmed)) return true;

    // Less than 5 words → too short to be a headline
    if (words.length < 5) return false;

    // ── Conversational intent patterns → always chat ──────────────
    // These are follow-up or discussion phrases, NOT news headlines
    const chatIntents = /\b(more detail|tell me more|explain|give me|provide|describe|elaborate|what do you think|your opinion|can you|help me|show me|what about|how about|about this|about that|about the above|about the article|about the news|above article|above news|previous|you just|you said|you analyzed|i want to know more|expand on|dig deeper|go deeper|what does this mean|what does that mean|why is|why does|how is|how does|is this|is that|are these|are those)\b/i;
    if (chatIntents.test(trimmed)) return false;

    // ── Starts with a greeting → chat ─────────────────────────────
    const greetings = new Set(['hi','hello','hey','howdy','greetings','hola','sup','yo','thanks','thank']);
    if (greetings.has(words[0])) return false;

    // ── Ends with "?" → question, go to chat ──────────────────────
    if (trimmed.endsWith('?')) return false;

    // ── Starts with a conversational/action word → chat ───────────
    const chatStarters = new Set([
      // Question words
      'how','what','why','who','when','where','which',
      // Auxiliary verbs
      'is','are','was','were','can','could','would','should',
      'do','does','did','will','shall','may','might','must',
      // Action/request verbs (the key additions)
      'tell','give','provide','explain','describe','elaborate',
      'show','help','find','get','make','let','please','kindly',
      // First-person starters (always conversational)
      'i','my','me','we','our',
    ]);
    if (chatStarters.has(words[0])) return false;

    // Passed all checks → treat as a news headline → /analyze
    return true;
  }


  // ── File Upload ───────────────────────────────────────────────
  function handleFileSelect(file) {
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10 MB

    if (!allowedTypes.includes(file.type)) {
      Toast.show('Only images and PDFs are supported.', 'error'); return;
    }
    if (file.size > maxSize) {
      Toast.show('File must be under 10 MB.', 'error'); return;
    }

    selectedFile = file;
    const tagEl = fileTagEl();
    if (tagEl) {
      tagEl.classList.remove('hidden');
      tagEl.innerHTML = `
        <i class="ph ph-file"></i> ${escapeHTML(file.name)}
        <span class="remove-file" role="button" aria-label="Remove file" id="removeFileBtn">✕</span>`;
      document.getElementById('removeFileBtn')?.addEventListener('click', clearFile);
    }
  }

  function clearFile() {
    selectedFile = null;
    const tagEl = fileTagEl();
    if (tagEl) tagEl.classList.add('hidden');
    const fi = fileInput();
    if (fi) fi.value = '';
  }

  // ── Auto-resize textarea ──────────────────────────────────────
  function autoResize(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }

  // ── Rich Markdown Renderer ─────────────────────────────────────
  // Renders markdown like ChatGPT/Gemini: headers, lists, bold, italic, code
  function renderMarkdown(text) {
    if (!text) return '';

    // Escape HTML first to prevent XSS, then apply markdown
    let html = text
      // Escape HTML special chars
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

      // Code blocks (``` ... ```) — before inline code
      .replace(/```([\s\S]*?)```/g, '<pre class="chat-code-block"><code>$1</code></pre>')

      // Inline code
      .replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>')

      // Horizontal rule ---
      .replace(/^---+$/gm, '<hr class="chat-hr">')

      // ## Headers (h3 styled)
      .replace(/^### (.+)$/gm, '<h4 class="chat-h4">$1</h4>')
      .replace(/^## (.+)$/gm, '<h3 class="chat-h3">$1</h3>')
      .replace(/^# (.+)$/gm, '<h2 class="chat-h2">$1</h2>')

      // Bold **text**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

      // Italic *text*
      .replace(/\*(.+?)\*/g, '<em>$1</em>')

      // Numbered list: 1. item
      .replace(/^(\d+)\. (.+)$/gm, '<li class="chat-li-num"><span class="li-num">$1.</span>$2</li>')

      // Bullet list: - item or * item
      .replace(/^[-*] (.+)$/gm, '<li class="chat-li">$1</li>')

      // Wrap consecutive <li> blocks in <ul>/<ol>
      .replace(/(<li class="chat-li">.*?<\/li>\n?)+/gs, match =>
        `<ul class="chat-ul">${match}</ul>`)
      .replace(/(<li class="chat-li-num">.*?<\/li>\n?)+/gs, match =>
        `<ol class="chat-ol">${match}</ol>`)

      // Paragraph breaks (double newline)
      .replace(/\n{2,}/g, '</p><p class="chat-p">')

      // Single line breaks
      .replace(/\n/g, '<br>');

    return `<div class="chat-markdown"><p class="chat-p">${html}</p></div>`;
  }

  // ── Utilities ─────────────────────────────────────────────────
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
  }

  // ── Public API for external triggers (demo cards) ─────────────
  function analyzeText(text) {
    // Switch to chatbot section
    AppNav.goTo('chatbot');
    // Pre-fill input
    const inp = inputEl();
    if (inp) { inp.value = text; autoResize(inp); }
    // Trigger send after a tick
    setTimeout(send, 300);
  }

  // ── Init ──────────────────────────────────────────────────────
  function init() {
    const inp  = inputEl();
    const sb   = sendBtn();
    const fi   = fileInput();

    // Send on button click
    sb?.addEventListener('click', send);

    // Send on Ctrl+Enter / Cmd+Enter; Enter = newline
    inp?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });

    // Auto-grow textarea
    inp?.addEventListener('input', () => autoResize(inp));

    // File input
    fi?.addEventListener('change', () => handleFileSelect(fi.files?.[0]));

    // Clear chat — also resets conversation memory
    document.getElementById('clearChatBtn')?.addEventListener('click', () => {
      const msgs = messagesEl();
      if (!msgs) return;
      // Keep only welcome message
      const welcome = document.getElementById('welcomeMsg');
      msgs.innerHTML = '';
      if (welcome) { welcome.classList.add('fade-in'); msgs.appendChild(welcome); }
      clearFile();
      // Reset conversation history so AI starts fresh
      conversationHistory.length = 0;
      Toast.show('Chat cleared', 'info');
    });

    // Export chat
    document.getElementById('exportChatBtn')?.addEventListener('click', exportChat);
  }

  function exportChat() {
    const msgs = messagesEl()?.querySelectorAll('.message');
    if (!msgs?.length) { Toast.show('Nothing to export', 'info'); return; }
    let text = 'TruthLens Chat Export\n' + new Date().toLocaleString() + '\n\n';
    msgs.forEach(m => {
      const role   = m.classList.contains('user') ? 'You' : 'Bot';
      const bubble = m.querySelector('.msg-bubble');
      text += `[${role}]\n${bubble?.innerText ?? ''}\n\n`;
    });
    const blob = new Blob([text], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'chat-export.txt' });
    a.click(); URL.revokeObjectURL(url);
  }

  return { init, analyzeText };
})();
