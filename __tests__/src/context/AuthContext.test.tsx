import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../../../src/context/AuthContext';
import { authApi } from '../../../src/api/auth';
import { tokenStorage } from '../../../src/storage/tokenStorage';

jest.mock('../../../src/api/auth', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  },
}));

jest.mock('../../../src/storage/tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

const mockLogin = authApi.login as jest.Mock;
const mockRegister = authApi.register as jest.Mock;
const mockRefreshToken = authApi.refreshToken as jest.Mock;
const mockLogout = authApi.logout as jest.Mock;
const mockGetAccessToken = tokenStorage.getAccessToken as jest.Mock;
const mockClearTokens = tokenStorage.clearTokens as jest.Mock;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAccessToken.mockResolvedValue(null);
});

// ─── Initial state ───────────────────────────────────────────────────────────

describe('initial state', () => {
  it('starts with isInitializing=true, isAuthenticated=false, isLoading=false', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isInitializing).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

// ─── checkAuth (boot-time) ───────────────────────────────────────────────────

describe('checkAuth', () => {
  it('sets isAuthenticated=false and isInitializing=false when no token', async () => {
    mockGetAccessToken.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(result.current.isInitializing).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('sets isAuthenticated=true when token is valid', async () => {
    mockGetAccessToken.mockResolvedValue('valid-token');
    mockRefreshToken.mockResolvedValue({ access_token: 'new', refresh_token: 'new-r' });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isInitializing).toBe(false);
  });

  it('clears tokens and sets isAuthenticated=false when refresh fails during init', async () => {
    mockGetAccessToken.mockResolvedValue('expired-token');
    mockRefreshToken.mockRejectedValue(new Error('expired'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isInitializing).toBe(false);
    expect(mockClearTokens).toHaveBeenCalled();
  });
});

// ─── login ───────────────────────────────────────────────────────────────────

describe('login', () => {
  beforeEach(async () => {
    mockGetAccessToken.mockResolvedValue(null);
  });

  it('sets isAuthenticated=true on successful login', async () => {
    mockRefreshToken.mockRejectedValue(new Error('no token'));
    mockLogin.mockResolvedValue({ access_token: 'a', refresh_token: 'r' });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    await act(async () => {
      await result.current.login({ email: 'a@b.com', password: 'pass' });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets error message and preserves isAuthenticated on login failure', async () => {
    mockRefreshToken.mockRejectedValue(new Error('no token'));
    mockLogin.mockRejectedValue({
      response: { data: { message: 'Wrong credentials' } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    await act(async () => {
      await result.current.login({ email: 'a@b.com', password: 'bad' }).catch(() => {});
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Wrong credentials');
  });

  it('uses error.response.data.error fallback', async () => {
    mockRefreshToken.mockRejectedValue(new Error());
    mockLogin.mockRejectedValue({ response: { data: { error: 'Unauthorized' } } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    await act(async () => {
      await result.current.login({ email: 'a@b.com', password: 'x' }).catch(() => {});
    });

    expect(result.current.error).toBe('Unauthorized');
  });

  it('uses generic message as last resort', async () => {
    mockRefreshToken.mockRejectedValue(new Error());
    mockLogin.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    await act(async () => {
      await result.current.login({ email: 'a@b.com', password: 'x' }).catch(() => {});
    });

    expect(result.current.error).toBe('Invalid email or password. Please try again.');
  });

  it('sets isLoading=true while request is in flight', async () => {
    mockRefreshToken.mockRejectedValue(new Error());
    let resolveLogin!: () => void;
    mockLogin.mockImplementation(() => new Promise((res) => { resolveLogin = () => res({}); }));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    act(() => { result.current.login({ email: 'a@b.com', password: 'p' }); });
    expect(result.current.isLoading).toBe(true);

    await act(async () => { resolveLogin(); });
  });

  it('throws error so callers can catch it', async () => {
    mockRefreshToken.mockRejectedValue(new Error());
    mockLogin.mockRejectedValue({ response: { data: { message: 'Bad' } } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    await act(async () => {
      await expect(result.current.login({ email: 'a@b.com', password: 'x' })).rejects.toBeDefined();
    });
  });
});

// ─── register ────────────────────────────────────────────────────────────────

describe('register', () => {
  it('sets isAuthenticated=true on successful register', async () => {
    mockGetAccessToken.mockResolvedValue(null);
    mockRefreshToken.mockRejectedValue(new Error());
    mockRegister.mockResolvedValue({ access_token: 'a', refresh_token: 'r' });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    await act(async () => {
      await result.current.register({ email: 'new@b.com', password: 'pass123' });
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('sets error on failed register', async () => {
    mockGetAccessToken.mockResolvedValue(null);
    mockRefreshToken.mockRejectedValue(new Error());
    mockRegister.mockRejectedValue({ response: { data: { message: 'Email already exists' } } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    await act(async () => {
      await result.current.register({ email: 'a@b.com', password: 'pass' }).catch(() => {});
    });

    expect(result.current.error).toBe('Email already exists');
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('uses generic fallback message for register failure', async () => {
    mockGetAccessToken.mockResolvedValue(null);
    mockRefreshToken.mockRejectedValue(new Error());
    mockRegister.mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    await act(async () => {
      await result.current.register({ email: 'a@b.com', password: 'pass' }).catch(() => {});
    });

    expect(result.current.error).toBe('Registration failed. Please try again.');
  });
});

// ─── logout ──────────────────────────────────────────────────────────────────

describe('logout', () => {
  it('sets isAuthenticated=false and clears state', async () => {
    mockGetAccessToken.mockResolvedValue('token');
    mockRefreshToken.mockResolvedValue({ access_token: 'a', refresh_token: 'r' });
    mockLogout.mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => { await result.current.logout(); });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});

// ─── clearError ──────────────────────────────────────────────────────────────

describe('clearError', () => {
  it('clears error state without changing other values', async () => {
    mockGetAccessToken.mockResolvedValue(null);
    mockRefreshToken.mockRejectedValue(new Error());
    mockLogin.mockRejectedValue({ response: { data: { message: 'Oops' } } });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => { jest.runAllTimers(); });

    await act(async () => {
      await result.current.login({ email: 'a@b.com', password: 'x' }).catch(() => {});
    });
    expect(result.current.error).toBe('Oops');

    act(() => { result.current.clearError(); });
    expect(result.current.error).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});

// ─── useAuth outside provider ────────────────────────────────────────────────

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider');
    consoleError.mockRestore();
  });
});
