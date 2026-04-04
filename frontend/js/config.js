/**
 * config.js — Environment Configuration
 * Handles API key setup for frontend-only deployment.
 */

const Config = (() => {
  // Check if API key is already set
  const checkAndSetupApiKey = () => {
    // Try to get from localStorage first
    let apiKey = localStorage.getItem('GEMINI_API_KEY');
    
    // If not in localStorage, check if it's in window
    if (!apiKey && window.GEMINI_API_KEY) {
      apiKey = window.GEMINI_API_KEY;
    }

    // If still no key, prompt user
    if (!apiKey) {
      showApiKeyModal();
    } else {
      window.GEMINI_API_KEY = apiKey;
      updateApiStatus(true);
    }
  };

  const showApiKeyModal = () => {
    const modalHTML = `
      <div id="apiKeyModal" class="api-key-modal-overlay">
        <div class="api-key-modal">
          <div class="modal-header">
            <h2>🔑 Google Gemini API Key Required</h2>
          </div>
          <div class="modal-body">
            <p>To use TruthLens, you need a Google Gemini API key.</p>
            <ol>
              <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener">https://makersuite.google.com/app/apikey</a></li>
              <li>Copy your Gemini API key</li>
              <li>Paste it below</li>
            </ol>
            <div class="api-key-input-group">
              <input 
                type="password" 
                id="apiKeyInput" 
                placeholder="AIzaSy..." 
                class="api-key-input"
              />
              <button id="toggleApiKeyVisibility" class="toggle-visibility-btn" title="Show/Hide">
                👁️
              </button>
            </div>
            <label class="remember-checkbox">
              <input type="checkbox" id="rememberApiKey" checked />
              Remember this key (stored locally)
            </label>
            <p class="api-key-info">ℹ️ Your key is stored in browser's local storage and only sent to Google's Gemini API. Never shared with our server.</p>
          </div>
          <div class="modal-footer">
            <button id="saveApiKeyBtn" class="modal-btn btn-primary">Save API Key</button>
            <button id="continueWithoutKeyBtn" class="modal-btn btn-secondary">Continue as Guest (Limited)</button>
          </div>
        </div>
      </div>

      <style>
        .api-key-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(5px);
        }

        .api-key-modal {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          max-width: 450px;
          width: 90%;
          padding: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-header {
          padding: 24px 24px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 18px;
          color: #fff;
        }

        .modal-body {
          padding: 24px;
          color: #ccc;
          font-size: 14px;
          line-height: 1.6;
        }

        .modal-body p {
          margin: 0 0 16px 0;
        }

        .modal-body ol {
          margin: 0 0 16px 0;
          padding-left: 24px;
        }

        .modal-body li {
          margin-bottom: 8px;
        }

        .modal-body a {
          color: #00d4ff;
          text-decoration: none;
          font-weight: 500;
        }

        .modal-body a:hover {
          text-decoration: underline;
        }

        .api-key-input-group {
          display: flex;
          gap: 8px;
          margin: 12px 0;
          align-items: center;
        }

        .api-key-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 12px;
          color: #fff;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }

        .api-key-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .api-key-input:focus {
          outline: none;
          border-color: #00d4ff;
          background: rgba(255, 255, 255, 0.08);
        }

        .toggle-visibility-btn {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          padding: 10px;
          cursor: pointer;
          font-size: 16px;
          transition: all 0.2s ease;
        }

        .toggle-visibility-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .remember-checkbox {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 12px 0;
          cursor: pointer;
          color: #ccc;
          font-size: 13px;
        }

        .remember-checkbox input {
          cursor: pointer;
        }

        .api-key-info {
          background: rgba(0, 212, 255, 0.1);
          border-left: 3px solid #00d4ff;
          padding: 12px;
          border-radius: 4px;
          margin: 12px 0 0 0 !important;
          font-size: 12px;
          color: #00d4ff;
        }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .modal-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #00d4ff 0%, #0099cc 100%);
          color: #000;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 212, 255, 0.3);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #ccc;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      </style>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Event listeners
    const input = document.getElementById('apiKeyInput');
    const toggleBtn = document.getElementById('toggleApiKeyVisibility');
    const saveBtn = document.getElementById('saveApiKeyBtn');
    const continueBtn = document.getElementById('continueWithoutKeyBtn');
    const rememberCheckbox = document.getElementById('rememberApiKey');

    toggleBtn?.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    saveBtn?.addEventListener('click', () => {
      const key = input.value.trim();
      if (!key) {
        alert('Please enter your API key.');
        return;
      }
      if (rememberCheckbox.checked) {
        localStorage.setItem('GEMINI_API_KEY', key);
      }
      window.GEMINI_API_KEY = key;
      closeModal();
      updateApiStatus(true);
    });

    continueBtn?.addEventListener('click', () => {
      closeModal();
      updateApiStatus(false);
    });

    input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveBtn?.click();
    });

    const closeModal = () => {
      document.getElementById('apiKeyModal')?.remove();
    };
  };

  const updateApiStatus = (isConnected) => {
    const statusEl = document.getElementById('apiStatus');
    if (statusEl) {
      statusEl.className = isConnected ? 'api-status connected' : 'api-status disconnected';
      statusEl.innerHTML = isConnected
        ? '<span class="status-dot"></span><span>✓ API Ready</span>'
        : '<span class="status-dot"></span><span>⚠ No API Key</span>';
    }
  };

  const clearApiKey = () => {
    localStorage.removeItem('GEMINI_API_KEY');
    window.GEMINI_API_KEY = '';
    showApiKeyModal();
  };

  return {
    init: checkAndSetupApiKey,
    updateStatus: updateApiStatus,
    clearKey: clearApiKey,
    setKey: (key) => {
      localStorage.setItem('GEMINI_API_KEY', key);
      window.GEMINI_API_KEY = key;
      updateApiStatus(true);
    },
  };
})();

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Config.init());
} else {
  Config.init();
}
