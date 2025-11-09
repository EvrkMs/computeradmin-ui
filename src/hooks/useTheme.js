import { useState, useEffect, useCallback } from 'react';

const THEME_STORAGE_KEY = 'computeradmin-ui-theme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  try {
    const persisted = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (persisted === 'light' || persisted === 'dark') {
      return persisted;
    }
  } catch {
    // ignore storage errors
  }
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
};

export const useTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore write errors
    }
  }, [theme]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (event) => {
      setTheme(event.matches ? 'dark' : 'light');
    };
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
};

export default useTheme;
