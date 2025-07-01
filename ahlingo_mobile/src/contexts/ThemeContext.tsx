import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setTheme as setGlobalTheme, getCurrentTheme, getTheme, ThemeVariant } from '../utils/theme';
import { getUserSettings, getMostRecentUser, setUserSetting } from '../services/SimpleDatabaseService';

interface ThemeContextType {
  theme: ReturnType<typeof getTheme>;
  themeVariant: ThemeVariant;
  setTheme: (variant: ThemeVariant) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeVariant, setThemeVariant] = useState<ThemeVariant>(getCurrentTheme());
  const [theme, setThemeState] = useState(getTheme());

  // Load saved theme on mount
  useEffect(() => {
    loadSavedTheme();
  }, []);

  const loadSavedTheme = async () => {
    try {
      const username = await getMostRecentUser();
      const userSettings = await getUserSettings(username);
      const savedTheme = userSettings.theme as ThemeVariant;
      
      if (savedTheme && ['frost', 'aurora', 'polar'].includes(savedTheme)) {
        setThemeVariant(savedTheme);
        setGlobalTheme(savedTheme);
        setThemeState(getTheme());
      }
    } catch (error) {
      console.error('Failed to load saved theme:', error);
    }
  };

  const setTheme = async (variant: ThemeVariant) => {
    try {
      // Update global theme
      setGlobalTheme(variant);
      
      // Update local state (triggers re-render)
      setThemeVariant(variant);
      setThemeState(getTheme());
      
      // Save to database
      const username = await getMostRecentUser();
      await setUserSetting(username, 'theme', variant);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    themeVariant,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};