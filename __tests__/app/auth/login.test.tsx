import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../../app/(auth)/login';
import { AuthProvider } from '../../../src/context/AuthContext';
import { authApi } from '../../../src/api/auth';
import { tokenStorage } from '../../../src/storage/tokenStorage';

jest.mock('../../../src/api/auth', () => ({
  authApi: { login: jest.fn(), register: jest.fn(), refreshToken: jest.fn(), logout: jest.fn() },
}));
jest.mock('../../../src/storage/tokenStorage', () => ({
  tokenStorage: { getAccessToken: jest.fn(), setTokens: jest.fn(), clearTokens: jest.fn(), getRefreshToken: jest.fn() },
}));

const mockLogin = authApi.login as jest.Mock;
const mockGetAccessToken = tokenStorage.getAccessToken as jest.Mock;
const mockRefreshToken = authApi.refreshToken as jest.Mock;
const { _mockRouter } = require('expo-router');

const renderScreen = () =>
  render(
    <AuthProvider>
      <LoginScreen />
    </AuthProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAccessToken.mockResolvedValue(null);
  mockRefreshToken.mockRejectedValue(new Error('no token'));
});

describe('LoginScreen — rendering', () => {
  it('renders email input', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByPlaceholderText('your@email.com')).toBeTruthy();
  });

  it('renders password input', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByPlaceholderText('Enter password')).toBeTruthy();
  });

  it('renders Sign in button', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByText('Sign in')).toBeTruthy();
  });

  it('renders link to register', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByText('Sign up')).toBeTruthy();
  });

  it('renders Forgot password button', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByText('Forgot password?')).toBeTruthy();
  });
});

describe('LoginScreen — validation', () => {
  it('shows error when email is empty', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });

    fireEvent.press(screen.getByText('Sign in'));
    expect(screen.getByText('Email is required')).toBeTruthy();
  });

  it('shows error when email is invalid', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });

    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'not-an-email');
    fireEvent.press(screen.getByText('Sign in'));
    expect(screen.getByText('Please enter a valid email')).toBeTruthy();
  });

  it('shows error when password is empty', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });

    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'valid@email.com');
    fireEvent.press(screen.getByText('Sign in'));
    expect(screen.getByText('Password is required')).toBeTruthy();
  });

  it('clears email field error when user types', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });

    fireEvent.press(screen.getByText('Sign in'));
    expect(screen.getByText('Email is required')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'valid@email.com');
    expect(screen.queryByText('Email is required')).toBeNull();
  });

  it('clears password field error when user types', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });

    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'valid@email.com');
    fireEvent.press(screen.getByText('Sign in'));
    expect(screen.getByText('Password is required')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('Enter password'), 'mypassword');
    expect(screen.queryByText('Password is required')).toBeNull();
  });
});

describe('LoginScreen — submission', () => {
  it('calls authApi.login with trimmed email and password', async () => {
    mockLogin.mockResolvedValue({ access_token: 'a', refresh_token: 'r' });
    renderScreen();
    await act(async () => { jest.runAllTimers(); });

    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), '  test@email.com  ');
    fireEvent.changeText(screen.getByPlaceholderText('Enter password'), 'password123');

    await act(async () => { fireEvent.press(screen.getByText('Sign in')); });

    expect(mockLogin).toHaveBeenCalledWith({ email: 'test@email.com', password: 'password123' });
  });

  it('shows error banner when login fails', async () => {
    mockLogin.mockRejectedValue({ response: { data: { message: 'Invalid credentials' } } });
    renderScreen();
    await act(async () => { jest.runAllTimers(); });

    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'bad@email.com');
    fireEvent.changeText(screen.getByPlaceholderText('Enter password'), 'wrongpass');

    await act(async () => { fireEvent.press(screen.getByText('Sign in')); });

    expect(screen.getByText('Invalid credentials')).toBeTruthy();
  });

  it('does not call login when validation fails', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });

    fireEvent.press(screen.getByText('Sign in'));
    expect(mockLogin).not.toHaveBeenCalled();
  });
});

describe('LoginScreen — navigation', () => {
  it('navigates back when Back button is pressed', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.press(screen.getByText('Back'));
    expect(_mockRouter.back).toHaveBeenCalled();
  });

  it('navigates to register when Sign up link is pressed', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.press(screen.getByText('Sign up'));
    expect(_mockRouter.replace).toHaveBeenCalledWith('/(auth)/register');
  });
});
