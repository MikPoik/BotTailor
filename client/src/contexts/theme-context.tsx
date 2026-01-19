
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') {
      return 'system';
    }

    try {
      const stored = window.localStorage.getItem('theme') as Theme;
      return stored || 'system';
    } catch {
      return 'system';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof document === 'undefined') {
      return 'light';
    }

    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    const updateTheme = () => {
      let newTheme: 'light' | 'dark';
      
      if (theme === 'system') {
        newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else {
        newTheme = theme;
      }

      // Avoid unnecessary DOM mutations which can cause layout churn/flash
      const currentTheme = (root.dataset && root.dataset.theme) || (root.classList.contains('dark') ? 'dark' : (root.classList.contains('light') ? 'light' : undefined));
      if (currentTheme === newTheme) {
        // Still update state for consumers (no re-render if same)
        setResolvedTheme(newTheme);
        return;
      }
      
      setResolvedTheme(newTheme);
      // Replace classes only when different to prevent remove/add flicker
      try {
        root.classList.remove('light', 'dark');
        root.classList.add(newTheme);
        root.dataset.theme = newTheme;
      } catch (e) {
        // Ignore DOM write failures in locked environments
      }
    };

    updateTheme();

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    }
  }, [theme]);

  useEffect(() => {
    try {
      window.localStorage.setItem('theme', theme);
    } catch {
      // Ignore storage issues (e.g., private browsing, server environment)
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
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
