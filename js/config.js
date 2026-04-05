/**
 * config.js — Environment Configuration  
 * Updated for backend deployment (API key now stored securely on Vercel)
 */

const Config = (() => {
  // Backend deployment: No API key needed on frontend
  // API keys are now securely stored on Vercel backend
  
  const initializeConfig = () => {
    console.log('✅ TruthBot Backend Mode: API keys stored securely on backend');
    // Set a dummy value to satisfy any frontend checks
    window.GEMINI_API_KEY = 'backend-managed';
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeConfig);
  } else {
    initializeConfig();
  }

  return {
    initialized: true,
    mode: 'backend'
  };
})();
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
