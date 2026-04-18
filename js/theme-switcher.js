/**
 * theme-switcher.js — Theme Management
 * Handles light/dark theme switching with localStorage persistence
 */

const ThemeSwitcher = (() => {
  const THEME_KEY = 'truthlens-theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';

  // ── Initialize theme on page load ──────────────────────
  function init() {
    // Get saved theme or default to dark
    const savedTheme = localStorage.getItem(THEME_KEY) || DARK_THEME;
    setTheme(savedTheme);

    // Wire up toggle button
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggle);
      updateToggleIcon(savedTheme);
    }
  }

  // ── Set theme and update DOM ──────────────────────
  function setTheme(theme) {
    if (theme !== DARK_THEME && theme !== LIGHT_THEME) {
      theme = DARK_THEME;
    }

    // Update HTML data attribute
    document.documentElement.setAttribute('data-theme', theme);

    // Persist to localStorage
    localStorage.setItem(THEME_KEY, theme);

    // Update toggle button icon
    updateToggleIcon(theme);

    console.log(`🎨 Theme switched to: ${theme}`);
  }

  // ── Toggle between themes ──────────────────────
  function toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || DARK_THEME;
    const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    setTheme(newTheme);
  }

  // ── Update icon based on current theme ──────────────────────
  function updateToggleIcon(theme) {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;

    const icon = toggleBtn.querySelector('i');
    if (!icon) return;

    // Clear existing classes
    icon.className = '';

    if (theme === DARK_THEME) {
      // Show moon icon when in dark theme (click to switch to light)
      icon.className = 'ph ph-moon';
    } else {
      // Show sun icon when in light theme (click to switch to dark)
      icon.className = 'ph ph-sun';
    }
  }

  // ── Check system preference on first visit ──────────────────────
  function detectSystemPreference() {
    if (!localStorage.getItem(THEME_KEY)) {
      // User has never set a theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const preferredTheme = prefersDark ? DARK_THEME : LIGHT_THEME;
      setTheme(preferredTheme);
    }
  }

  return {
    init,
    setTheme,
    toggle,
    detectSystemPreference,
  };
})();

// Initialize on page load
document.addEventListener('DOMContentLoaded', ThemeSwitcher.init);

// Detect system preference before page load
ThemeSwitcher.detectSystemPreference();
