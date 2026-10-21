import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { settingsService } from '../features/settings/settingsService.js';
import { useAppDispatch } from '../hooks/useAppDispatch.js';
import { useAppSelector } from '../hooks/useAppSelector.js';
import { setThemeMode as setReduxThemeMode, selectThemeMode } from '../features/settings/settingsSlice.js';

const ThemeContext = createContext({
  theme: 'dark',
  themeMode: 'dark',
  setThemeMode: () => {},
  toggleTheme: () => {},
  isDark: true
});

export function ThemeProvider({ children }) {
  const dispatch = useAppDispatch();
  const reduxThemeMode = useAppSelector(selectThemeMode);

  // Read initial setting from settingsService
  const [themeMode, setLocalThemeMode] = useState(() => {
    try {
      const s = settingsService.getSettings();
      return s.themeMode || 'dark';
    } catch {
      return 'dark';
    }
  });

  const getSystemTheme = useCallback(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }, []);

  const effectiveTheme = themeMode === 'system' ? getSystemTheme() : themeMode;

  const applyTheme = useCallback((mode) => {
    if (typeof document === 'undefined') return;
    const eff = mode === 'system' ? getSystemTheme() : mode;
    const root = document.documentElement;
    if (eff === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    try {
      localStorage.setItem('resultpoint_theme', eff);
    } catch {}
  }, [getSystemTheme]);

  // Apply on mount and when themeMode changes
  useEffect(() => {
    applyTheme(themeMode);
  }, [themeMode, applyTheme]);

  // Observe OS preference if in system mode
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (themeMode === 'system') {
        applyTheme('system');
      }
    };
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleMediaChange);
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } else if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleMediaChange);
      }
    };
  }, [themeMode, applyTheme]);

  // Sync across tabs & storage events
  useEffect(() => {
    const handleSync = () => {
      try {
        const s = settingsService.getSettings();
        if (s.themeMode && s.themeMode !== themeMode) {
          setLocalThemeMode(s.themeMode);
        }
      } catch {}
    };
    window.addEventListener('settings_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('settings_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [themeMode]);

  // Sync with Redux if Redux was updated
  useEffect(() => {
    if (reduxThemeMode && reduxThemeMode !== themeMode) {
      setLocalThemeMode(reduxThemeMode);
    }
  }, [reduxThemeMode, themeMode]);

  const setThemeMode = useCallback((newMode) => {
    setLocalThemeMode(newMode);
    dispatch(setReduxThemeMode(newMode));
    settingsService.saveSettings({ themeMode: newMode });
  }, [dispatch]);

  const toggleTheme = useCallback(() => {
    const currentEffective = themeMode === 'system' ? getSystemTheme() : themeMode;
    const nextMode = currentEffective === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
  }, [themeMode, getSystemTheme, setThemeMode]);

  return (
    <ThemeContext.Provider
      value={{
        theme: effectiveTheme,
        themeMode,
        setThemeMode,
        toggleTheme,
        isDark: effectiveTheme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);