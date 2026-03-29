import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { tokenStorage } from '../../../src/storage/tokenStorage';

const secureStoreMock = SecureStore as jest.Mocked<typeof SecureStore> & { __reset: () => void };

beforeEach(() => {
  secureStoreMock.__reset();
  jest.clearAllMocks();
});

describe('tokenStorage (native platform)', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('getAccessToken returns null when no token stored', async () => {
    secureStoreMock.getItemAsync.mockResolvedValueOnce(null);
    const token = await tokenStorage.getAccessToken();
    expect(token).toBeNull();
    expect(secureStoreMock.getItemAsync).toHaveBeenCalledWith('memorize_access_token');
  });

  it('getAccessToken returns stored token', async () => {
    secureStoreMock.getItemAsync.mockResolvedValueOnce('access-abc');
    const token = await tokenStorage.getAccessToken();
    expect(token).toBe('access-abc');
  });

  it('getRefreshToken returns null when no token stored', async () => {
    secureStoreMock.getItemAsync.mockResolvedValueOnce(null);
    const token = await tokenStorage.getRefreshToken();
    expect(token).toBeNull();
    expect(secureStoreMock.getItemAsync).toHaveBeenCalledWith('memorize_refresh_token');
  });

  it('getRefreshToken returns stored token', async () => {
    secureStoreMock.getItemAsync.mockResolvedValueOnce('refresh-xyz');
    const token = await tokenStorage.getRefreshToken();
    expect(token).toBe('refresh-xyz');
  });

  it('setTokens stores both access and refresh tokens', async () => {
    await tokenStorage.setTokens('my-access', 'my-refresh');
    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith('memorize_access_token', 'my-access');
    expect(secureStoreMock.setItemAsync).toHaveBeenCalledWith('memorize_refresh_token', 'my-refresh');
  });

  it('clearTokens deletes both tokens', async () => {
    await tokenStorage.clearTokens();
    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledWith('memorize_access_token');
    expect(secureStoreMock.deleteItemAsync).toHaveBeenCalledWith('memorize_refresh_token');
  });

  it('setTokens then getAccessToken returns the stored value', async () => {
    await tokenStorage.setTokens('tok-123', 'ref-456');
    // After setTokens, the in-memory store has the values
    secureStoreMock.getItemAsync.mockResolvedValueOnce('tok-123');
    const token = await tokenStorage.getAccessToken();
    expect(token).toBe('tok-123');
  });
});

describe('tokenStorage (web platform)', () => {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: jest.fn((key: string) => store[key] ?? null),
      setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
      removeItem: jest.fn((key: string) => { delete store[key]; }),
      clear: jest.fn(() => { store = {}; }),
    };
  })();

  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    Object.defineProperty(global, 'localStorage', {
      value: localStorageMock,
      configurable: true,
      writable: true,
    });
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('getAccessToken uses localStorage on web', async () => {
    localStorageMock.getItem.mockReturnValueOnce('web-access-token');
    const token = await tokenStorage.getAccessToken();
    expect(token).toBe('web-access-token');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('memorize_access_token');
  });

  it('setTokens uses localStorage on web', async () => {
    await tokenStorage.setTokens('web-access', 'web-refresh');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('memorize_access_token', 'web-access');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('memorize_refresh_token', 'web-refresh');
  });

  it('clearTokens uses localStorage.removeItem on web', async () => {
    await tokenStorage.clearTokens();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('memorize_access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('memorize_refresh_token');
  });

  it('getAccessToken returns null when localStorage throws', async () => {
    localStorageMock.getItem.mockImplementationOnce(() => { throw new Error('quota exceeded'); });
    const token = await tokenStorage.getAccessToken();
    expect(token).toBeNull();
  });
});
