import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from './lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-errors';

type ThemeType = 'original' | 'classic' | 'modern' | 'creative';

interface ThemeConfig {
  activeTheme: ThemeType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface PlatformConfigs {
  web: ThemeConfig;
  mobile: ThemeConfig;
}

interface ThemeContextType {
  configs: PlatformConfigs;
  previewConfig: { platform: 'web' | 'mobile', config: ThemeConfig } | null;
  setPreview: (platform: 'web' | 'mobile', newConfig: Partial<ThemeConfig> | null) => void;
  saveConfig: (platform: 'web' | 'mobile') => Promise<void>;
  isMobileView: boolean;
  setAdminForcePlatform: (platform: 'web' | 'mobile' | null) => void;
}

const defaultTheme: ThemeConfig = {
  activeTheme: 'original',
  primaryColor: '#7E308E',
  secondaryColor: '#00A99D',
  accentColor: '#D4AF37',
};

const defaultConfigs: PlatformConfigs = {
  web: { ...defaultTheme },
  mobile: { ...defaultTheme },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [configs, setConfigs] = useState<PlatformConfigs>(defaultConfigs);
  const [previewConfig, setPreviewConfig] = useState<{ platform: 'web' | 'mobile', config: ThemeConfig } | null>(null);
  const [isMobileView, setIsMobileView] = useState(
    typeof window !== 'undefined' ? (window.innerWidth <= 768) : false
  );
  const [adminForcePlatform, setAdminForcePlatform] = useState<'web' | 'mobile' | null>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'themes'), (docSnap) => {
      if (docSnap.exists()) {
        setConfigs(docSnap.data() as PlatformConfigs);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/themes'));
    return unsub;
  }, []);

  React.useLayoutEffect(() => {
    // Determine which config to apply
    let activeConfig: ThemeConfig;
    const effectivePlatform = adminForcePlatform || (isMobileView ? 'mobile' : 'web');
    
    if (effectivePlatform === 'mobile') {
      activeConfig = (previewConfig?.platform === 'mobile') ? previewConfig.config : configs.mobile;
    } else {
      activeConfig = (previewConfig?.platform === 'web') ? previewConfig.config : configs.web;
    }

    // Apply colors to CSS Variables
    const root = document.documentElement;
    root.style.setProperty('--brand-purple', activeConfig.primaryColor);
    root.style.setProperty('--brand-teal', activeConfig.secondaryColor);
    root.style.setProperty('--brand-gold', activeConfig.accentColor);
    
    // Apply Theme specific classes to body
    document.body.className = `theme-${activeConfig.activeTheme}`;
  }, [configs, previewConfig, isMobileView, adminForcePlatform]);

  const setPreview = (platform: 'web' | 'mobile', newConfig: Partial<ThemeConfig> | null) => {
    if (newConfig === null) {
      setPreviewConfig(null);
    } else {
      const currentBase = platform === 'web' ? configs.web : configs.mobile;
      const currentPreview = (previewConfig?.platform === platform) ? previewConfig.config : currentBase;
      setPreviewConfig({
        platform,
        config: { ...currentPreview, ...newConfig }
      });
    }
  };

  const saveConfig = async (platform: 'web' | 'mobile') => {
    if (previewConfig && previewConfig.platform === platform) {
      const newConfigs = { ...configs, [platform]: previewConfig.config };
      await setDoc(doc(db, 'config', 'themes'), newConfigs);
      setConfigs(newConfigs);
      setPreviewConfig(null);
    }
  };

  return (
    <ThemeContext.Provider value={{ configs, previewConfig, setPreview, saveConfig, isMobileView, setAdminForcePlatform }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
