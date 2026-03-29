import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import WelcomeScreen from '../../../app/(auth)/index';

const { _mockRouter } = require('expo-router');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WelcomeScreen', () => {
  it('renders the app title', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Memorize')).toBeTruthy();
  });

  it('renders the subtitle', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText(/Master new words/)).toBeTruthy();
  });

  it('renders Get started button', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('Get started')).toBeTruthy();
  });

  it('renders I already have an account button', () => {
    render(<WelcomeScreen />);
    expect(screen.getByText('I already have an account')).toBeTruthy();
  });

  it('navigates to register when Get started is pressed', () => {
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByText('Get started'));
    expect(_mockRouter.push).toHaveBeenCalledWith('/(auth)/register');
  });

  it('navigates to login when I already have an account is pressed', () => {
    render(<WelcomeScreen />);
    fireEvent.press(screen.getByText('I already have an account'));
    expect(_mockRouter.push).toHaveBeenCalledWith('/(auth)/login');
  });

  it('renders without crashing', () => {
    expect(() => render(<WelcomeScreen />)).not.toThrow();
  });
});
