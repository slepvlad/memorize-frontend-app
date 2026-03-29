import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import apiClient from '../../../src/api/client';
import { tokenStorage } from '../../../src/storage/tokenStorage';
import { triggerToast } from '../../../src/context/ToastContext';

jest.mock('../../../src/storage/tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

jest.mock('../../../src/context/ToastContext', () => ({
  triggerToast: jest.fn(),
}));

const mockGetAccessToken = tokenStorage.getAccessToken as jest.Mock;
const mockGetRefreshToken = tokenStorage.getRefreshToken as jest.Mock;
const mockSetTokens = tokenStorage.setTokens as jest.Mock;
const mockClearTokens = tokenStorage.clearTokens as jest.Mock;
const mockTriggerToast = triggerToast as jest.Mock;

// Spy on raw axios.post (used internally for token refresh)
let axiosPostSpy: jest.SpyInstance;
let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(apiClient);
  axiosPostSpy = jest.spyOn(axios, 'post');
  jest.clearAllMocks();
  mockGetAccessToken.mockResolvedValue(null);
  mockGetRefreshToken.mockResolvedValue(null);
  mockSetTokens.mockResolvedValue(undefined);
  mockClearTokens.mockResolvedValue(undefined);
});

afterEach(() => {
  mock.reset();
  mock.restore();
  axiosPostSpy.mockRestore();
});

// ─── Request interceptor ────────────────────────────────────────────────────

describe('request interceptor', () => {
  it('attaches Authorization header when access token exists', async () => {
    mockGetAccessToken.mockResolvedValueOnce('my-token');
    mock.onGet('/test').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer my-token');
      return [200, { ok: true }];
    });
    await apiClient.get('/test');
  });

  it('does not attach Authorization header when no access token', async () => {
    mockGetAccessToken.mockResolvedValueOnce(null);
    mock.onGet('/test').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, {}];
    });
    await apiClient.get('/test');
  });
});

// ─── Response interceptor — success ─────────────────────────────────────────

describe('response interceptor — success', () => {
  it('returns data on 2xx response', async () => {
    mock.onGet('/data').reply(200, { value: 42 });
    const res = await apiClient.get('/data');
    expect(res.data).toEqual({ value: 42 });
  });
});

// ─── Response interceptor — 401 handling ────────────────────────────────────

describe('response interceptor — 401 handling', () => {
  it('refreshes token and retries original request on 401', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('valid-refresh');

    let callCount = 0;
    mock.onGet('/protected').reply(() => {
      callCount++;
      if (callCount === 1) return [401, {}];
      return [200, { secret: 'data' }];
    });

    axiosPostSpy.mockResolvedValueOnce({
      data: { access_token: 'new-access', refresh_token: 'new-refresh' },
    });

    const res = await apiClient.get('/protected');
    expect(res.data).toEqual({ secret: 'data' });
    expect(mockSetTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
  });

  it('clears tokens and shows session expired toast when refresh fails', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue('expired-refresh');

    mock.onGet('/protected').reply(401);
    axiosPostSpy.mockRejectedValueOnce(new Error('Network Error'));

    await expect(apiClient.get('/protected')).rejects.toBeDefined();

    expect(mockClearTokens).toHaveBeenCalled();
    expect(mockTriggerToast).toHaveBeenCalledWith(
      'Your session has expired. Please sign in again.',
      'error'
    );
  });

  it('clears tokens when no refresh token is available', async () => {
    mockGetAccessToken.mockResolvedValue('old-token');
    mockGetRefreshToken.mockResolvedValue(null);

    mock.onGet('/protected').reply(401);

    await expect(apiClient.get('/protected')).rejects.toBeDefined();
    expect(mockClearTokens).toHaveBeenCalled();
  });

  it('does NOT trigger refresh flow for login endpoint 401', async () => {
    mock.onPost('/api/auth/login').reply(401, { message: 'Wrong password' });

    await expect(apiClient.post('/api/auth/login', {})).rejects.toBeDefined();
    // Raw axios.post for refresh should NOT have been called
    expect(axiosPostSpy).not.toHaveBeenCalled();
    expect(mockTriggerToast).not.toHaveBeenCalled();
  });

  it('does NOT trigger refresh flow for register endpoint 401', async () => {
    mock.onPost('/api/auth/register').reply(401, {});

    await expect(apiClient.post('/api/auth/register', {})).rejects.toBeDefined();
    expect(axiosPostSpy).not.toHaveBeenCalled();
    expect(mockTriggerToast).not.toHaveBeenCalled();
  });

  it('shows session expired toast for refresh endpoint 401', async () => {
    mock.onPost('/api/auth/refresh').reply(401, {});

    await expect(apiClient.post('/api/auth/refresh', {})).rejects.toBeDefined();
    expect(mockClearTokens).toHaveBeenCalled();
    expect(mockTriggerToast).toHaveBeenCalledWith(
      'Your session has expired. Please sign in again.',
      'error'
    );
  });
});

// ─── Response interceptor — non-401 errors ──────────────────────────────────

describe('response interceptor — non-401 errors', () => {
  it('shows toast with server message for 500 error', async () => {
    mock.onGet('/fail').reply(500, { message: 'Internal server error' });

    await expect(apiClient.get('/fail')).rejects.toBeDefined();
    expect(mockTriggerToast).toHaveBeenCalledWith('Internal server error', 'error');
  });

  it('shows toast with generic message when no server message', async () => {
    mock.onGet('/fail').reply(503, {});

    await expect(apiClient.get('/fail')).rejects.toBeDefined();
    expect(mockTriggerToast).toHaveBeenCalledWith(
      'Something went wrong. Please try again.',
      'error'
    );
  });

  it('shows network error toast when no response', async () => {
    mock.onGet('/fail').networkError();

    await expect(apiClient.get('/fail')).rejects.toBeDefined();
    expect(mockTriggerToast).toHaveBeenCalledWith(
      'Network error. Check your connection.',
      'error'
    );
  });

  it('shows timeout toast on ECONNABORTED', async () => {
    mock.onGet('/slow').timeout();

    await expect(apiClient.get('/slow')).rejects.toBeDefined();
    expect(mockTriggerToast).toHaveBeenCalledWith(
      'Request timed out. Please try again.',
      'error'
    );
  });

  it('does NOT show toast for login endpoint errors', async () => {
    mock.onPost('/api/auth/login').reply(422, { message: 'Validation failed' });

    await expect(apiClient.post('/api/auth/login', {})).rejects.toBeDefined();
    expect(mockTriggerToast).not.toHaveBeenCalled();
  });

  it('does NOT show toast for register endpoint errors', async () => {
    mock.onPost('/api/auth/register').reply(422, { message: 'Email taken' });

    await expect(apiClient.post('/api/auth/register', {})).rejects.toBeDefined();
    expect(mockTriggerToast).not.toHaveBeenCalled();
  });

  it('uses error.response.data.error as fallback message', async () => {
    mock.onGet('/fail').reply(400, { error: 'Bad request details' });

    await expect(apiClient.get('/fail')).rejects.toBeDefined();
    expect(mockTriggerToast).toHaveBeenCalledWith('Bad request details', 'error');
  });
});
