/**
 * env-loader.js — Load environment variables from .env.local at runtime
 * This script runs before config-env.js
 */

(async () => {
  try {
    // Only load .env in local development, not in production
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const response = await fetch('.env.local');
      if (response.ok) {
        const envText = await response.text();
        const lines = envText.split('\n');
        
        lines.forEach(line => {
          line = line.trim();
          // Skip empty lines and comments
          if (!line || line.startsWith('#')) return;
          
          const [key, ...valueParts] = line.split('=');
          const value = valueParts.join('=').trim();
          
          if (key && value) {
            window[key] = value;
          }
        });
        
        console.log('✅ Environment variables loaded from .env.local');
      }
    }
  } catch (error) {
    console.warn('⚠️ Could not load .env.local (this is normal in production)');
  }
})();
