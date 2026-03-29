import React from 'react';
import { render, screen } from '@testing-library/react-native';
import ProgressScreen from '../../../app/(tabs)/progress';

describe('ProgressScreen — rendering', () => {
  it('renders the title "Your progress"', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('Your progress')).toBeTruthy();
  });

  it('renders "This week" section title', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('This week')).toBeTruthy();
  });

  it('renders "Mastery breakdown" section title', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('Mastery breakdown')).toBeTruthy();
  });
});

describe('ProgressScreen — stats grid', () => {
  it('renders words learned stat', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('248')).toBeTruthy();
    expect(screen.getByText('Words learned')).toBeTruthy();
  });

  it('renders day streak stat', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('Day streak')).toBeTruthy();
  });

  it('renders quiz accuracy stat', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('86%')).toBeTruthy();
    expect(screen.getByText('Quiz accuracy')).toBeTruthy();
  });

  it('renders XP earned stat', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('1,240')).toBeTruthy();
    expect(screen.getByText('XP earned')).toBeTruthy();
  });
});

describe('ProgressScreen — weekly chart', () => {
  it('renders all 7 day labels', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Tue')).toBeTruthy();
    expect(screen.getByText('Wed')).toBeTruthy();
    expect(screen.getByText('Thu')).toBeTruthy();
    expect(screen.getByText('Fri')).toBeTruthy();
    expect(screen.getByText('Sat')).toBeTruthy();
    expect(screen.getByText('Sun')).toBeTruthy();
  });
});

describe('ProgressScreen — mastery breakdown', () => {
  it('renders Mastered category', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('Mastered')).toBeTruthy();
    expect(screen.getByText('45%')).toBeTruthy();
  });

  it('renders Learning category', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('Learning')).toBeTruthy();
    expect(screen.getByText('35%')).toBeTruthy();
  });

  it('renders New category', () => {
    render(<ProgressScreen />);
    expect(screen.getByText('New')).toBeTruthy();
    expect(screen.getByText('20%')).toBeTruthy();
  });

  it('renders without crashing', () => {
    expect(() => render(<ProgressScreen />)).not.toThrow();
  });
});
