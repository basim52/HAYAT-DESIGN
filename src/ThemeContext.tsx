import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

type ThemeType = 'original' | 'classic' | 'modern' | 'creative';

interface ThemeConfig {
  activeTheme: ThemeType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface ThemeContextType {
  config: ThemeConfig;
  previewConfig: ThemeConfig | null;
  setPreview: (newConfig: Partial<ThemeConfig> | null) => void;
  saveConfig: () => Promise<void>;
}

const defaultBotConfig: ThemeConfig = {
  activeTheme: 'original',
  primaryColor: '#7E308E', // original purple
  secondaryColor: '#00A99D', // original teal
  accentColor: '#D4AF37', // original gold
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<ThemeConfig>(defaultBotConfig);
  const [previewConfig, setPreviewConfig] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'theme'), (docSnap) => {
      if (docSnap.exists()) {
        setConfig(docSnap.data() as ThemeConfig);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    // Determine which config to apply (Preview has priority)
    const activeConfig = previewConfig || config;

    // Apply colors to CSS Variables
    const root = document.documentElement;
    root.style.setProperty('--brand-purple', activeConfig.primaryColor);
    root.style.setProperty('--brand-teal', activeConfig.secondaryColor);
    root.style.setProperty('--brand-gold', activeConfig.accentColor);
    
    // Apply Theme specific classes to body
    document.body.className = `theme-${activeConfig.activeTheme}`;
  }, [config, previewConfig]);

  const setPreview = (newConfig: Partial<ThemeConfig> | null) => {
    if (newConfig === null) {
      setPreviewConfig(null);
    } else {
      setPreviewConfig(prev => ({ ...(prev || config), ...newConfig }));
    }
  };

  const saveConfig = async () => {
    if (previewConfig) {
      await setDoc(doc(db, 'config', 'theme'), previewConfig);
      setConfig(previewConfig);
      setPreviewConfig(null);
    }
  };

  return (
    <ThemeContext.Provider value={{ config, previewConfig, setPreview, saveConfig }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
