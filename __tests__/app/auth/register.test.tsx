import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import RegisterScreen from '../../../app/(auth)/register';
import { AuthProvider } from '../../../src/context/AuthContext';
import { authApi } from '../../../src/api/auth';
import { tokenStorage } from '../../../src/storage/tokenStorage';

jest.mock('../../../src/api/auth', () => ({
  authApi: { login: jest.fn(), register: jest.fn(), refreshToken: jest.fn(), logout: jest.fn() },
}));
jest.mock('../../../src/storage/tokenStorage', () => ({
  tokenStorage: { getAccessToken: jest.fn(), setTokens: jest.fn(), clearTokens: jest.fn(), getRefreshToken: jest.fn() },
}));

const mockRegister = authApi.register as jest.Mock;
const mockGetAccessToken = tokenStorage.getAccessToken as jest.Mock;
const mockRefreshToken = authApi.refreshToken as jest.Mock;
const { _mockRouter } = require('expo-router');

// Helper: press the Create account BUTTON (the page title also says "Create account")
const pressSubmit = () => {
  const buttons = screen.getAllByText('Create account');
  fireEvent.press(buttons[buttons.length - 1]);
};

const renderScreen = () =>
  render(
    <AuthProvider>
      <RegisterScreen />
    </AuthProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAccessToken.mockResolvedValue(null);
  mockRefreshToken.mockRejectedValue(new Error('no token'));
});

describe('RegisterScreen — rendering', () => {
  it('renders email, password, and confirm password inputs', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByPlaceholderText('your@email.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('At least 6 characters')).toBeTruthy();
    expect(screen.getByPlaceholderText('Re-enter password')).toBeTruthy();
  });

  it('renders Create account button', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getAllByText('Create account').length).toBeGreaterThanOrEqual(1);
  });

  it('renders title and subtitle', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getAllByText('Create account').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Start your vocabulary journey')).toBeTruthy();
  });
});

describe('RegisterScreen — validation', () => {
  it('shows error for empty email', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    pressSubmit();
    expect(screen.getByText('Email is required')).toBeTruthy();
  });

  it('shows error for invalid email format', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'not-email');
    pressSubmit();
    expect(screen.getByText('Please enter a valid email')).toBeTruthy();
  });

  it('shows error for empty password', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'valid@email.com');
    pressSubmit();
    expect(screen.getByText('Password is required')).toBeTruthy();
  });

  it('shows error for password shorter than 6 characters', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'valid@email.com');
    fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'abc');
    pressSubmit();
    expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();
  });

  it('shows error when confirm password is empty', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'valid@email.com');
    fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'mypassword');
    pressSubmit();
    expect(screen.getByText('Please confirm your password')).toBeTruthy();
  });

  it('shows error when passwords do not match', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'valid@email.com');
    fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password1');
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'password2');
    pressSubmit();
    expect(screen.getByText('Passwords do not match')).toBeTruthy();
  });

  it('clears field errors when user types', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    pressSubmit();
    expect(screen.getByText('Email is required')).toBeTruthy();
    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'a@b.com');
    expect(screen.queryByText('Email is required')).toBeNull();
  });
});

describe('RegisterScreen — password strength indicator', () => {
  it('shows Weak for short password', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'abc');
    expect(screen.getByText('Weak')).toBeTruthy();
  });

  it('shows Fair for password with letters and digits', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    // length>=6 (+1) + digit (+1) = score 2 → Fair
    fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'abcde1');
    expect(screen.getByText('Fair')).toBeTruthy();
  });

  it('shows Good for password with letter, digit, uppercase', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    // length>=6 (+1) + uppercase (+1) + digit (+1) = score 3 → Good
    fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'Abcde1');
    expect(screen.getByText('Good')).toBeTruthy();
  });

  it('shows Strong for complex password', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    // length>=6 (+1) + length>=10 (+1) + uppercase (+1) + digit (+1) = 4 → Strong
    fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'Abcdefgh12');
    expect(screen.getByText('Strong')).toBeTruthy();
  });

  it('shows Very strong for very complex password', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    // length>=6 (+1) + length>=10 (+1) + uppercase (+1) + digit (+1) + special (+1) = 5 → Very strong
    fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'Abcdefgh1!');
    expect(screen.getByText('Very strong')).toBeTruthy();
  });

  it('does not show strength indicator when password is empty', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.queryByText('Weak')).toBeNull();
    expect(screen.queryByText('Strong')).toBeNull();
  });
});

describe('RegisterScreen — submission', () => {
  it('calls register with trimmed email and password on valid form', async () => {
    mockRegister.mockResolvedValue({ access_token: 'a', refresh_token: 'r' });
    renderScreen();
    await act(async () => { jest.runAllTimers(); });

    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), '  user@email.com  ');
    fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'password123');
    await act(async () => { pressSubmit(); });

    expect(mockRegister).toHaveBeenCalledWith({ email: 'user@email.com', password: 'password123' });
  });

  it('shows server error message in banner on failure', async () => {
    mockRegister.mockRejectedValue({ response: { data: { message: 'Email already taken' } } });
    renderScreen();
    await act(async () => { jest.runAllTimers(); });

    fireEvent.changeText(screen.getByPlaceholderText('your@email.com'), 'taken@email.com');
    fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password123');
    fireEvent.changeText(screen.getByPlaceholderText('Re-enter password'), 'password123');
    await act(async () => { pressSubmit(); });

    expect(screen.getByText('Email already taken')).toBeTruthy();
  });

  it('does not call register when validation fails', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    pressSubmit();
    expect(mockRegister).not.toHaveBeenCalled();
  });
});

describe('RegisterScreen — navigation', () => {
  it('navigates back when Back is pressed', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.press(screen.getByText('Back'));
    expect(_mockRouter.back).toHaveBeenCalled();
  });

  it('navigates to login when Sign in link is pressed', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.press(screen.getByText('Sign in'));
    expect(_mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
  });
});
