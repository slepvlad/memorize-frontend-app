import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import HomeScreen from '../../../app/(tabs)/index';
import { AuthProvider } from '../../../src/context/AuthContext';
import { authApi } from '../../../src/api/auth';
import { tokenStorage } from '../../../src/storage/tokenStorage';

jest.mock('../../../src/api/auth', () => ({
  authApi: { login: jest.fn(), register: jest.fn(), refreshToken: jest.fn(), logout: jest.fn() },
}));
jest.mock('../../../src/storage/tokenStorage', () => ({
  tokenStorage: { getAccessToken: jest.fn(), setTokens: jest.fn(), clearTokens: jest.fn(), getRefreshToken: jest.fn() },
}));

const mockLogout = authApi.logout as jest.Mock;
const mockGetAccessToken = tokenStorage.getAccessToken as jest.Mock;
const mockRefreshToken = authApi.refreshToken as jest.Mock;
const { _mockRouter } = require('expo-router');

const renderScreen = () =>
  render(
    <AuthProvider>
      <HomeScreen />
    </AuthProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAccessToken.mockResolvedValue('valid-token');
  mockRefreshToken.mockResolvedValue({ access_token: 'a', refresh_token: 'r' });
  mockLogout.mockResolvedValue(undefined);
});

describe('HomeScreen — rendering', () => {
  it('renders greeting text', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByText('Good morning')).toBeTruthy();
    expect(screen.getByText('Learner')).toBeTruthy();
  });

  it('renders streak card', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByText('Current streak')).toBeTruthy();
    expect(screen.getByText('0 days')).toBeTruthy();
  });

  it('renders Learn words quick action', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByText('Learn words')).toBeTruthy();
    expect(screen.getByText('24 words due')).toBeTruthy();
  });

  it('renders Quiz me quick action', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByText('Quiz me')).toBeTruthy();
    expect(screen.getByText('Test yourself')).toBeTruthy();
  });

  it('renders Recent words section', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByText('Recent words')).toBeTruthy();
  });

  it('renders all recent words', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getByText('Ephemeral')).toBeTruthy();
    expect(screen.getByText('Ubiquitous')).toBeTruthy();
    expect(screen.getByText('Resilience')).toBeTruthy();
  });

  it('shows Learned and Learning badges', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    expect(screen.getAllByText('Learned').length).toBeGreaterThan(0);
    expect(screen.getByText('Learning')).toBeTruthy();
  });
});

describe('HomeScreen — navigation', () => {
  it('navigates to learn tab when Learn words is pressed', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.press(screen.getByText('Learn words'));
    expect(_mockRouter.push).toHaveBeenCalledWith('/(tabs)/learn');
  });

  it('navigates to quiz tab when Quiz me is pressed', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });
    fireEvent.press(screen.getByText('Quiz me'));
    expect(_mockRouter.push).toHaveBeenCalledWith('/(tabs)/quiz');
  });
});

describe('HomeScreen — logout', () => {
  it('calls logout when avatar is pressed', async () => {
    renderScreen();
    await act(async () => { jest.runAllTimers(); });

    const avatar = screen.getByText('L');
    fireEvent.press(avatar);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
