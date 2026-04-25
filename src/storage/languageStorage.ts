import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type Language = 'en' | 'ru';

export interface LanguagePreferences {
  nativeLanguage: Language;
  studiedLanguage: Language;
}

const LANGUAGE_PREFS_KEY = 'memorize_language_prefs';

const webStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {}
  },
  deleteItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return webStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function deleteItem(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    webStorage.deleteItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export const languageStorage = {
  getPreferences: async (): Promise<LanguagePreferences | null> => {
    const raw = await getItem(LANGUAGE_PREFS_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LanguagePreferences;
    } catch {
      return null;
    }
  },

  setPreferences: async (prefs: LanguagePreferences): Promise<void> => {
    await setItem(LANGUAGE_PREFS_KEY, JSON.stringify(prefs));
  },

  clearPreferences: async (): Promise<void> => {
    await deleteItem(LANGUAGE_PREFS_KEY);
  },
};