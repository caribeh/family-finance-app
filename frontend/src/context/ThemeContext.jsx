import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { userApi } from '../api';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const { user, setUserTheme } = useAuth();
  const [theme, setTheme] = useState(() => {
    return user?.theme || localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    if (user?.theme) {
      setTheme(user.theme);
    }
  }, [user?.theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (user) {
      try {
        const res = await userApi.updateMe({ theme: next });
        if (setUserTheme) setUserTheme(res.data.theme);
      } catch {
        setTheme(theme);
      }
    }
  }, [theme, user, setUserTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
