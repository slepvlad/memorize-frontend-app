import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../storage/tokenStorage';
import { triggerToast } from '../context/ToastContext';

// ⚠️ Change this to your actual backend URL
export const API_BASE_URL = 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Track if we're currently refreshing to avoid multiple simultaneous refreshes
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request interceptor — attach access token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Auth endpoints returning 401 mean wrong credentials — no refresh needed.
      // Refresh endpoint 401 means the session is truly expired.
      const authEndpoint401 = /\/api\/auth\/(login|register|refresh)/.test(originalRequest.url ?? '');
      if (authEndpoint401) {
        if (originalRequest.url?.includes('/api/auth/refresh')) {
          await tokenStorage.clearTokens();
          triggerToast('Your session has expired. Please sign in again.', 'error');
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const { data } = await axios.post(
          `${API_BASE_URL}/api/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { access_token, refresh_token } = data;
        await tokenStorage.setTokens(access_token, refresh_token);

        processQueue(null, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await tokenStorage.clearTokens();
        triggerToast('Your session has expired. Please sign in again.', 'error');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Auth endpoints (login/register) display their own inline error banners — skip toast for those.
    // 401s are handled by the token refresh flow above.
    const isAuthEndpoint = /\/api\/auth\/(login|register)/.test(error.config?.url ?? '');
    if (error.response?.status !== 401 && !isAuthEndpoint) {
      const message =
        (error.response?.data as any)?.message ||
        (error.response?.data as any)?.error ||
        (error.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : null) ||
        (!error.response ? 'Network error. Check your connection.' : 'Something went wrong. Please try again.');
      triggerToast(message, 'error');
    }

    return Promise.reject(error);
  }
);

export default apiClient;