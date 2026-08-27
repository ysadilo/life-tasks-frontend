import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeName = 'powder' | 'glamour';

const STORAGE_KEY = 'life-tasks-theme';

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): ThemeName {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'powder' || stored === 'glamour') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'glamour' : 'powder';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeName>(readStoredTheme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === 'powder' ? 'glamour' : 'powder')),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
