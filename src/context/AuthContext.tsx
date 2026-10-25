import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, LoginRequest, RegisterRequest } from '../api/auth';
import { setSessionExpiredHandler } from '../api/client';
import { tokenStorage } from '../storage/tokenStorage';
import { pendingEmailStorage } from '../storage/pendingEmailStorage';
import { triggerToast } from './ToastContext';
import i18n from '../i18n';

interface AuthState {
  isAuthenticated: boolean;
  isInitializing: boolean; // true only during the boot-time token check
  isLoading: boolean;      // true during login / register submissions
  error: string | null;
  // New email to prefill on login after a confirmed email change revoked the session.
  suggestedEmail: string | null;
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
    suggestedEmail: null,
  });

  // Confirming an email change revokes every token, so a dead session with a
  // pending change most likely means the user should sign in with the new email.
  const handleSessionEnded = useCallback(async (silent: boolean) => {
    const pending = await pendingEmailStorage.get().catch(() => null);
    if (pending) triggerToast(i18n.t('emailChangedSignIn'), 'info');
    else if (!silent) triggerToast(i18n.t('sessionExpired'), 'error');
    setState({
      isAuthenticated: false,
      isInitializing: false,
      isLoading: false,
      error: null,
      suggestedEmail: pending?.email ?? null,
    });
  }, []);

  // Check for existing tokens on app start
  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => void handleSessionEnded(false));
    return () => setSessionExpiredHandler(null);
  }, [handleSessionEnded]);

  const checkAuth = async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (token) {
        try {
          await authApi.refreshToken();
          setState({ isAuthenticated: true, isInitializing: false, isLoading: false, error: null, suggestedEmail: null });
        } catch {
          await tokenStorage.clearTokens();
          await handleSessionEnded(true);
        }
      } else {
        setState({ isAuthenticated: false, isInitializing: false, isLoading: false, error: null, suggestedEmail: null });
      }
    } catch {
      setState({ isAuthenticated: false, isInitializing: false, isLoading: false, error: null, suggestedEmail: null });
    }
  };

  const login = useCallback(async (credentials: LoginRequest) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await authApi.login(credentials);
      setState({ isAuthenticated: true, isInitializing: false, isLoading: false, error: null, suggestedEmail: null });
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
      setState({ isAuthenticated: true, isInitializing: false, isLoading: false, error: null, suggestedEmail: null });
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
    setState({ isAuthenticated: false, isInitializing: false, isLoading: false, error: null, suggestedEmail: null });
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