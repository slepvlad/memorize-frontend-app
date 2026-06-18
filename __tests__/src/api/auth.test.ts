import { authApi } from '../../../src/api/auth';
import { tokenStorage } from '../../../src/storage/tokenStorage';

// Mock the axios client so interceptors don't run; also export API_BASE_URL
jest.mock('../../../src/api/client', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
  API_BASE_URL: 'http://localhost:8080',
}));

// Mock plain axios used by refreshToken to bypass the request interceptor
jest.mock('axios', () => ({ post: jest.fn() }));

jest.mock('../../../src/storage/tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: jest.fn(),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

import apiClient from '../../../src/api/client';
import axios from 'axios';

const mockPost = apiClient.post as jest.Mock;
const mockAxiosPost = axios.post as jest.Mock;
const mockSetTokens = tokenStorage.setTokens as jest.Mock;
const mockGetRefreshToken = tokenStorage.getRefreshToken as jest.Mock;
const mockClearTokens = tokenStorage.clearTokens as jest.Mock;

const fakeTokens = { access_token: 'new-access', refresh_token: 'new-refresh' };

beforeEach(() => {
  jest.clearAllMocks();
});

describe('authApi.login', () => {
  it('posts to /api/auth/login and stores tokens on success', async () => {
    mockPost.mockResolvedValueOnce({ data: fakeTokens });

    const result = await authApi.login({ email: 'a@b.com', password: 'secret' });

    expect(mockPost).toHaveBeenCalledWith('/api/auth/login', { email: 'a@b.com', password: 'secret' });
    expect(mockSetTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
    expect(result).toEqual(fakeTokens);
  });

  it('propagates error without storing tokens on failure', async () => {
    const error = new Error('Network error');
    mockPost.mockRejectedValueOnce(error);

    await expect(authApi.login({ email: 'a@b.com', password: 'wrong' })).rejects.toThrow('Network error');
    expect(mockSetTokens).not.toHaveBeenCalled();
  });
});

describe('authApi.register', () => {
  it('posts to /api/auth/register and stores tokens on success', async () => {
    mockPost.mockResolvedValueOnce({ data: fakeTokens });

    const result = await authApi.register({ email: 'new@user.com', password: 'pass123' });

    expect(mockPost).toHaveBeenCalledWith('/api/auth/register', { email: 'new@user.com', password: 'pass123' });
    expect(mockSetTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
    expect(result).toEqual(fakeTokens);
  });

  it('propagates error on failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('Email taken'));
    await expect(authApi.register({ email: 'taken@b.com', password: 'pass' })).rejects.toThrow('Email taken');
  });
});

describe('authApi.refreshToken', () => {
  it('throws when no refresh token is available', async () => {
    mockGetRefreshToken.mockResolvedValueOnce(null);
    await expect(authApi.refreshToken()).rejects.toThrow('No refresh token available');
    expect(mockAxiosPost).not.toHaveBeenCalled();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('uses plain axios (not apiClient) so the interceptor cannot overwrite the token', async () => {
    mockGetRefreshToken.mockResolvedValueOnce('existing-refresh');
    mockAxiosPost.mockResolvedValueOnce({ data: fakeTokens });

    await authApi.refreshToken();

    // apiClient.post must NOT be called — it would run the request interceptor
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockAxiosPost).toHaveBeenCalled();
  });

  it('posts to the full refresh URL with the refresh token as Bearer', async () => {
    mockGetRefreshToken.mockResolvedValueOnce('existing-refresh');
    mockAxiosPost.mockResolvedValueOnce({ data: fakeTokens });

    const result = await authApi.refreshToken();

    expect(mockAxiosPost).toHaveBeenCalledWith(
      'http://localhost:8080/api/auth/refresh',
      {},
      { headers: { Authorization: 'Bearer existing-refresh' } }
    );
    expect(mockSetTokens).toHaveBeenCalledWith('new-access', 'new-refresh');
    expect(result).toEqual(fakeTokens);
  });

  it('propagates error when refresh request fails', async () => {
    mockGetRefreshToken.mockResolvedValueOnce('expired-refresh');
    mockAxiosPost.mockRejectedValueOnce(new Error('401'));
    await expect(authApi.refreshToken()).rejects.toThrow('401');
    expect(mockSetTokens).not.toHaveBeenCalled();
  });
});

describe('authApi.logout', () => {
  it('clears tokens from storage', async () => {
    await authApi.logout();
    expect(mockClearTokens).toHaveBeenCalledTimes(1);
  });
});
