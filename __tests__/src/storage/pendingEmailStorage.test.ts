import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { pendingEmailStorage } from '../../../src/storage/pendingEmailStorage';

const secureStoreMock = SecureStore as jest.Mocked<typeof SecureStore> & { __reset: () => void };
const KEY = 'memorize_pending_email';
const pending = { userId: 'u1', email: 'new@test.com' };

beforeEach(() => {
  secureStoreMock.__reset();
  jest.clearAllMocks();
});

describe('pendingEmailStorage (native platform)', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('returns null when nothing is stored', async () => {
    secureStoreMock.getItemAsync.mockResolvedValueOnce(null);
    await expect(pendingEmailStorage.get()).resolves.toBeNull();
    expect(secureStoreMock.getItemAsync).toHaveBeenCalledWith(KEY);
  });

  it('round-trips a pending change', async () => {
    await pendingEmailStorage.set(pending);
    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith(KEY, JSON.stringify(pending));
    secureStoreMock.getItemAsync.mockResolvedValueOnce(JSON.stringify(pending));
    await expect(pendingEmailStorage.get()).resolves.toEqual(pending);
  });

  it('returns null for corrupted data', async () => {
    secureStoreMock.getItemAsync.mockResolvedValueOnce('{oops');
    await expect(pendingEmailStorage.get()).resolves.toBeNull();
  });

  it('clear deletes the key', async () => {
    await pendingEmailStorage.clear();
    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledWith(KEY);
  });
});

describe('pendingEmailStorage (web platform)', () => {
  let store: Record<string, string> = {};
  const localStorageMock = {
    getItem: jest.fn((key: string) => store[key] ?? null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
  };

  beforeEach(() => {
    store = {};
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    Object.defineProperty(global, 'localStorage', { value: localStorageMock, configurable: true });
  });

  afterAll(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('round-trips through localStorage', async () => {
    await pendingEmailStorage.set(pending);
    await expect(pendingEmailStorage.get()).resolves.toEqual(pending);
    await pendingEmailStorage.clear();
    await expect(pendingEmailStorage.get()).resolves.toBeNull();
    expect(secureStoreMock.setItemAsync).not.toHaveBeenCalled();
  });

  it('swallows localStorage errors', async () => {
    const fail = () => { throw new Error('blocked'); };
    localStorageMock.getItem.mockImplementationOnce(fail);
    localStorageMock.setItem.mockImplementationOnce(fail);
    localStorageMock.removeItem.mockImplementationOnce(fail);
    await expect(pendingEmailStorage.set(pending)).resolves.toBeUndefined();
    await expect(pendingEmailStorage.get()).resolves.toBeNull();
    await expect(pendingEmailStorage.clear()).resolves.toBeUndefined();
  });
});
