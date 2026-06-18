import axios from 'axios';
import apiClient, { API_BASE_URL } from './client';
import { tokenStorage } from '../storage/tokenStorage';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      '/api/auth/login',
      credentials
    );
    await tokenStorage.setTokens(data.access_token, data.refresh_token);
    return data;
  },

  register: async (credentials: RegisterRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      '/api/auth/register',
      credentials
    );
    await tokenStorage.setTokens(data.access_token, data.refresh_token);
    return data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Use plain axios (not apiClient) so the request interceptor cannot
    // overwrite Authorization with the access token before the request sends.
    const { data } = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
    await tokenStorage.setTokens(data.access_token, data.refresh_token);
    return data;
  },

  logout: async (): Promise<void> => {
    await tokenStorage.clearTokens();
  },
};