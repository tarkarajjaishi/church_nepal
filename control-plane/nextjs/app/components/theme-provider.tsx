'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';
type HighContrast = boolean;

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  highContrast: HighContrast;
  setHighContrast: (highContrast: HighContrast) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  attribute?: string;
  defaultTheme?: Theme;
  enableSystem?: boolean;
}

export function ThemeProvider({
  children,
  attribute,
  defaultTheme,
  enableSystem,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme ?? 'system');
  const [highContrast, setHighContrastState] = useState<HighContrast>(false);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Load saved preferences from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const savedHighContrast = localStorage.getItem('highContrast') === 'true';

    if (savedTheme) {
      setThemeState(savedTheme);
    }
    if (savedHighContrast !== null) {
      setHighContrastState(savedHighContrast);
    }
  }, []);

  // Apply theme and high contrast to document root
  useEffect(() => {
    const root = window.document.documentElement;

    // Determine resolved theme based on system preference if needed
    let newResolvedTheme: 'light' | 'dark' = 'light';
    if (theme === 'system') {
      newResolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      newResolvedTheme = theme;
    }
    setResolvedTheme(newResolvedTheme);

    // Remove old classes
    root.classList.remove('light', 'dark');
    // Add new class
    root.classList.add(newResolvedTheme);

    // Toggle high contrast class
    if (highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Update meta theme-color for mobile browsers
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      if (newResolvedTheme === 'dark') {
        themeColorMeta.setAttribute('content', '#0f172a'); // slate-900
      } else {
        themeColorMeta.setAttribute('content', '#ffffff'); // white
      }
    }
  }, [theme, highContrast]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const newResolved = mediaQuery.matches ? 'dark' : 'light';
        setResolvedTheme(newResolved);
        // Update class just in case
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(newResolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme); // Persist preference
  };

  const setHighContrast = (newHighContrast: HighContrast) => {
    setHighContrastState(newHighContrast);
    localStorage.setItem('highContrast', String(newHighContrast)); // Persist preference
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, highContrast, setHighContrast }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
