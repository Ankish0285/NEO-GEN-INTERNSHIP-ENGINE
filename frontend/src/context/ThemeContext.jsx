import React, { createContext, useContext, useEffect, useState } from 'react';

const THEME_STORAGE_KEY = 'neo-gen-theme';
const ThemeContext = createContext(null);

const THEME_VALUES = {
  light: {
    primary: '#f9fafb',
    secondary: '#f3f4f6',
    card: '#ffffff',
    input: '#ffffff',
  },
  dark: {
    primary: '#0b1220',
    secondary: '#111827',
    card: '#172033',
    input: '#1e293b',
  },
};

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
};

const applyTheme = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const values = THEME_VALUES[theme];
  root.dataset.colorScheme = theme;
  root.style.colorScheme = theme;
  document.body?.classList.toggle('theme-dark', theme === 'dark');
  document.body?.classList.toggle('theme-light', theme === 'light');
  root.style.setProperty('--theme-bg-primary', values.primary);
  root.style.setProperty('--theme-bg-secondary', values.secondary);
  root.style.setProperty('--theme-card', values.card);
  root.style.setProperty('--theme-input', values.input);

  document.body?.style.setProperty('background-color', 'var(--theme-bg-primary)', 'important');
  document.getElementById('root')?.style.setProperty('background-color', 'var(--theme-bg-primary)', 'important');
  document.querySelectorAll('.neo-page, .neo-dashboard, .admin-dashboard, .page').forEach((element) => {
    element.style.setProperty('background-color', 'var(--theme-bg-primary)', 'important');
  });
  document.querySelectorAll('.internship-search-toolbar, .internship-filters-panel').forEach((element) => {
    element.style.setProperty('background-color', values.card, 'important');
  });
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme still works for the current session when storage is unavailable.
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return { theme: 'light', toggleTheme: () => {} };
  }
  return context;
};
