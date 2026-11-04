import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react-native';
import { useFocusEffect } from 'expo-router';
import ProgressScreen from '../../../app/(tabs)/progress';
import { statsApi } from '../../../src/api/stats';

jest.mock('../../../src/api/stats', () => ({
  statsApi: { getSummary: jest.fn() },
}));

const mockGetSummary = statsApi.getSummary as jest.Mock;
const mockUseFocusEffect = useFocusEffect as jest.Mock;

const summary = {
  totalPhrases: 40,
  dueNow: 7,
  dueToday: 11,
  newPhrases: 8,
  learningPhrases: 14,
  maturePhrases: 18,
  averageEasiness: 2.456,
};

const ERROR_TEXT = "Something went wrong. We're already fixing it — please try again later.";

beforeEach(() => {
  jest.clearAllMocks();
  // Run the focus callback like a mount effect so the screen loads in tests.
  mockUseFocusEffect.mockImplementation((cb: () => void) => {
    React.useEffect(cb, [cb]);
  });
  mockGetSummary.mockResolvedValue(summary);
});

describe('ProgressScreen — loaded', () => {
  it('fetches the summary on focus', async () => {
    render(<ProgressScreen />);
    await screen.findByText('Your progress');
    expect(mockGetSummary).toHaveBeenCalledTimes(1);
  });

  it('renders the stat cards from the summary', async () => {
    render(<ProgressScreen />);
    expect(await screen.findByText('40')).toBeTruthy();
    expect(screen.getByText('Total phrases')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('Due now')).toBeTruthy();
    expect(screen.getByText('11')).toBeTruthy();
    expect(screen.getByText('Due today')).toBeTruthy();
    expect(screen.getByText('2.46')).toBeTruthy();
    expect(screen.getByText('Avg. easiness')).toBeTruthy();
  });

  it('renders the mastery breakdown as percentages of total', async () => {
    render(<ProgressScreen />);
    expect(await screen.findByText('Mastery breakdown')).toBeTruthy();
    expect(screen.getByText('Mastered')).toBeTruthy();
    expect(screen.getByText('45%')).toBeTruthy();
    expect(screen.getByText('Learning')).toBeTruthy();
    expect(screen.getByText('35%')).toBeTruthy();
    expect(screen.getByText('New')).toBeTruthy();
    expect(screen.getByText('20%')).toBeTruthy();
  });

  it('shows 0% everywhere when there are no phrases', async () => {
    mockGetSummary.mockResolvedValue({
      totalPhrases: 0,
      dueNow: 0,
      dueToday: 0,
      newPhrases: 0,
      learningPhrases: 0,
      maturePhrases: 0,
      averageEasiness: 0,
    });
    render(<ProgressScreen />);
    await screen.findByText('Mastery breakdown');
    expect(screen.getAllByText('0%')).toHaveLength(3);
  });

  it('no longer renders the mock weekly chart', async () => {
    render(<ProgressScreen />);
    await screen.findByText('Mastery breakdown');
    expect(screen.queryByText('This week')).toBeNull();
    expect(screen.queryByText('Mon')).toBeNull();
  });

  it('refetches on pull-to-refresh', async () => {
    render(<ProgressScreen />);
    await screen.findByText('40');
    mockGetSummary.mockResolvedValue({ ...summary, totalPhrases: 41 });

    const scroll = screen.UNSAFE_getByType(require('react-native').ScrollView);
    await act(async () => {
      await scroll.props.refreshControl.props.onRefresh();
    });

    expect(mockGetSummary).toHaveBeenCalledTimes(2);
    expect(screen.getByText('41')).toBeTruthy();
  });
});

describe('ProgressScreen — error', () => {
  it('shows the "we are fixing it" message when the request fails', async () => {
    mockGetSummary.mockRejectedValue(new Error('500'));
    render(<ProgressScreen />);
    expect(await screen.findByText(ERROR_TEXT)).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
    expect(screen.queryByText('Mastery breakdown')).toBeNull();
  });

  it('recovers when "Try again" succeeds', async () => {
    mockGetSummary.mockRejectedValueOnce(new Error('500'));
    render(<ProgressScreen />);
    fireEvent.press(await screen.findByText('Try again'));

    expect(await screen.findByText('40')).toBeTruthy();
    expect(screen.queryByText(ERROR_TEXT)).toBeNull();
    expect(mockGetSummary).toHaveBeenCalledTimes(2);
  });

  it('keeps the error when "Try again" fails again', async () => {
    mockGetSummary.mockRejectedValue(new Error('500'));
    render(<ProgressScreen />);
    const retry = await screen.findByText('Try again');
    await act(async () => {
      fireEvent.press(retry);
    });

    expect(mockGetSummary).toHaveBeenCalledTimes(2);
    expect(screen.getByText(ERROR_TEXT)).toBeTruthy();
  });
});
