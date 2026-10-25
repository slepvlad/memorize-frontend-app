import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// An email change waiting for the user to open the confirmation link.
export interface PendingEmailChange {
  userId: string;
  email: string;
}

const PENDING_EMAIL_KEY = 'memorize_pending_email';

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

export const pendingEmailStorage = {
  get: async (): Promise<PendingEmailChange | null> => {
    const raw = await getItem(PENDING_EMAIL_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PendingEmailChange;
    } catch {
      return null;
    }
  },

  set: async (pending: PendingEmailChange): Promise<void> => {
    await setItem(PENDING_EMAIL_KEY, JSON.stringify(pending));
  },

  clear: async (): Promise<void> => {
    await deleteItem(PENDING_EMAIL_KEY);
  },
};
