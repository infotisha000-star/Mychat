import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = 'vortex_theme_preference';
const BG_THEME_STORAGE_KEY = 'vortex_chat_bg_theme';

export const CHAT_BG_THEMES = [
  {
    id: 'midnight',
    name: 'Cyber Midnight',
    primaryColor: '#6366f1',
    gradient: 'from-blue-600 via-indigo-600 to-violet-600',
    glowTop: 'bg-indigo-600/20',
    glowBottom: 'bg-cyan-600/15',
  },
  {
    id: 'sunset',
    name: 'Sunset Rose',
    primaryColor: '#e11d48',
    gradient: 'from-violet-600 via-purple-600 to-rose-600',
    glowTop: 'bg-rose-600/25',
    glowBottom: 'bg-amber-600/20',
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    primaryColor: '#10b981',
    gradient: 'from-teal-600 via-emerald-600 to-green-600',
    glowTop: 'bg-emerald-600/25',
    glowBottom: 'bg-teal-600/20',
  },
  {
    id: 'ocean',
    name: 'Sapphire Wave',
    primaryColor: '#0284c7',
    gradient: 'from-sky-600 via-blue-600 to-cyan-600',
    glowTop: 'bg-cyan-600/25',
    glowBottom: 'bg-blue-600/20',
  },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      return stored || 'dark';
    } catch {
      return 'dark';
    }
  });

  const [bgTheme, setBgThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(BG_THEME_STORAGE_KEY);
      return stored || 'midnight';
    } catch {
      return 'midnight';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const setBgTheme = useCallback((themeId) => {
    setBgThemeState(themeId);
    try {
      localStorage.setItem(BG_THEME_STORAGE_KEY, themeId);
    } catch (e) {}
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const activeBgThemeObj = useMemo(() => (
    CHAT_BG_THEMES.find((t) => t.id === bgTheme) || CHAT_BG_THEMES[0]
  ), [bgTheme]);

  const value = useMemo(() => ({
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    bgTheme,
    setBgTheme,
    activeBgThemeObj,
    CHAT_BG_THEMES,
  }), [theme, toggleTheme, bgTheme, setBgTheme, activeBgThemeObj]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
