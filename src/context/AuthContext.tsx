import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, LoginRequest, RegisterRequest } from '../api/auth';
import { tokenStorage } from '../storage/tokenStorage';

interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean; // true only during the boot-time token check
  isLoading: boolean;      // true during login / register submissions
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (credentials: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isInitializing: true,
    isLoading: false,
    error: null,
  });

  // Check for existing tokens on app start
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        try {
          await authApi.refreshToken();
          setState({ isAuthenticated: true, isInitializing: false, isLoading: false, error: null });
        } catch {
          await tokenStorage.clearTokens();
          setState({ isAuthenticated: false, isInitializing: false, isLoading: false, error: null });
        }
      } else {
        setState({ isAuthenticated: false, isInitializing: false, isLoading: false, error: null });
      }
    } catch {
      setState({ isAuthenticated: false, isInitializing: false, isLoading: false, error: null });
    }
  };

  const login = useCallback(async (credentials: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authApi.login(credentials);
      setState({ isAuthenticated: true, isInitializing: false, isLoading: false, error: null });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Invalid email or password. Please try again.';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authApi.register(credentials);
      setState({ isAuthenticated: true, isInitializing: false, isLoading: false, error: null });
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Registration failed. Please try again.';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    setState({ isAuthenticated: false, isInitializing: false, isLoading: false, error: null });
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}