import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

type ThemeType = 'classic' | 'modern' | 'creative';

interface ThemeConfig {
  activeTheme: ThemeType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface ThemeContextType {
  config: ThemeConfig;
  updateConfig: (newConfig: Partial<ThemeConfig>) => Promise<void>;
}

const defaultBotConfig: ThemeConfig = {
  activeTheme: 'classic',
  primaryColor: '#7C3AED', // purple
  secondaryColor: '#008077', // teal
  accentColor: '#D4AF37', // gold
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(defaultBotConfig);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'theme'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as ThemeConfig);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Apply colors to CSS Variables
    const root = document.documentElement;
    root.style.setProperty('--brand-purple', config.primaryColor);
    root.style.setProperty('--brand-teal', config.secondaryColor);
    root.style.setProperty('--brand-gold', config.accentColor);
    
    // Apply Theme specific classes to body
    document.body.className = `theme-${config.activeTheme}`;
  }, [config]);

  const updateConfig = async (newConfig: Partial<ThemeConfig>) => {
    const updated = { ...config, ...newConfig };
    await setDoc(doc(db, 'config', 'theme'), updated);
  };

  return (
    <ThemeContext.Provider value={{ config, updateConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
