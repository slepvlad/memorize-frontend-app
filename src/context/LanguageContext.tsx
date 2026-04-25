import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { languageStorage, Language, LanguagePreferences } from '../storage/languageStorage';

export type { Language, LanguagePreferences };

export const SUPPORTED_LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
];

interface LanguageContextType {
  nativeLanguage: Language | null;
  studiedLanguage: Language | null;
  isConfigured: boolean;
  isInitializing: boolean;
  setLanguages: (prefs: LanguagePreferences) => Promise<void>;
  clearLanguages: () => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [nativeLanguage, setNativeLanguage] = useState<Language | null>(null);
  const [studiedLanguage, setStudiedLanguage] = useState<Language | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    languageStorage.getPreferences().then((prefs) => {
      if (prefs) {
        setNativeLanguage(prefs.nativeLanguage);
        setStudiedLanguage(prefs.studiedLanguage);
      }
      setIsInitializing(false);
    });
  }, []);

  const setLanguages = useCallback(async (prefs: LanguagePreferences) => {
    await languageStorage.setPreferences(prefs);
    setNativeLanguage(prefs.nativeLanguage);
    setStudiedLanguage(prefs.studiedLanguage);
  }, []);

  const clearLanguages = useCallback(async () => {
    await languageStorage.clearPreferences();
    setNativeLanguage(null);
    setStudiedLanguage(null);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        nativeLanguage,
        studiedLanguage,
        isConfigured: nativeLanguage !== null && studiedLanguage !== null,
        isInitializing,
        setLanguages,
        clearLanguages,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
