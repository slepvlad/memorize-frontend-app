import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import LearnScreen from '../../../app/(tabs)/learn';
import { phrasesApi } from '../../../src/api/phrases';

jest.mock('../../../src/api/phrases', () => ({
  phrasesApi: { getAll: jest.fn(), review: jest.fn() },
}));

const mockGetAll = phrasesApi.getAll as jest.Mock;
const mockReview = phrasesApi.review as jest.Mock;

const makePhrase = (id: string, originalWord: string, translatedWord: string) => ({
  id,
  originalWord,
  translatedWord,
  originalLanguage: 'ENGLISH' as const,
  translatedLanguage: 'RUSSIAN' as const,
  originalAudioId: null,
  translatedAudioId: null,
  examples: [],
  interval: 1,
  repetitions: 0,
  easiness_factor: 2.5,
  next_review_date: '2026-04-09',
});

const mockPhrases = [
  makePhrase('p1', 'Hello world', 'Привет мир'),
  makePhrase('p2', 'Good morning', 'Доброе утро'),
  makePhrase('p3', 'Thank you', 'Спасибо'),
];

const makePage = (phrases = mockPhrases) => ({
  content: phrases,
  totalElements: phrases.length,
  totalPages: 1,
  numberOfElements: phrases.length,
  first: true,
  last: true,
  empty: phrases.length === 0,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAll.mockResolvedValue(makePage());
});

describe('LearnScreen — loading state', () => {
  it('shows activity indicator while fetching', () => {
    mockGetAll.mockReturnValue(new Promise(() => {}));
    render(<LearnScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});

describe('LearnScreen — empty state', () => {
  it('shows empty message when no phrases exist', async () => {
    mockGetAll.mockResolvedValue(makePage([]));
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('No phrases yet')).toBeTruthy());
    expect(screen.getByText('Add phrases from the Translate tab to start learning.')).toBeTruthy();
  });
});

describe('LearnScreen — initial rendering', () => {
  it('renders Learn header', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Learn')).toBeTruthy());
  });

  it('shows 1 of N counter', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('1 of 3')).toBeTruthy());
  });

  it('shows first phrase on front face', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Hello world')).toBeTruthy());
  });

  it('shows Phrase pill on front face', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Phrase')).toBeTruthy());
  });

  it('shows "Tap to reveal translation" hint', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Tap to reveal translation')).toBeTruthy());
  });

  it('renders Hard, Good, Easy buttons', async () => {
    render(<LearnScreen />);
    await waitFor(() => {
      expect(screen.getByText('Hard')).toBeTruthy();
      expect(screen.getByText('Good')).toBeTruthy();
      expect(screen.getByText('Easy')).toBeTruthy();
    });
  });

  it('fetches phrases with page=0, size=100', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalledWith(0, 100));
  });
});

describe('LearnScreen — card flip', () => {
  it('reveals translation when card is tapped', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hello world'));
    fireEvent.press(screen.getByText('Hello world'));
    expect(screen.getByText('Привет мир')).toBeTruthy();
  });

  it('shows Translation pill after flip', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hello world'));
    fireEvent.press(screen.getByText('Hello world'));
    expect(screen.getByText('Translation')).toBeTruthy();
  });

  it('hides "Tap to reveal translation" after flip', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hello world'));
    fireEvent.press(screen.getByText('Hello world'));
    expect(screen.queryByText('Tap to reveal translation')).toBeNull();
  });
});

describe('LearnScreen — navigation (no review API calls)', () => {
  it('never calls phrasesApi.review on Hard press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hard'));
    fireEvent.press(screen.getByText('Hard'));
    expect(mockReview).not.toHaveBeenCalled();
  });

  it('never calls phrasesApi.review on Good press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Good'));
    fireEvent.press(screen.getByText('Good'));
    expect(mockReview).not.toHaveBeenCalled();
  });

  it('never calls phrasesApi.review on Easy press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Easy'));
    fireEvent.press(screen.getByText('Easy'));
    expect(mockReview).not.toHaveBeenCalled();
  });

  it('advances to next card after pressing Easy', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hello world'));
    fireEvent.press(screen.getByText('Easy'));
    expect(screen.getByText('Good morning')).toBeTruthy();
    expect(screen.getByText('2 of 3')).toBeTruthy();
  });

  it('advances to next card after pressing Hard', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hello world'));
    fireEvent.press(screen.getByText('Hard'));
    expect(screen.getByText('Good morning')).toBeTruthy();
  });

  it('advances to next card after pressing Good', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hello world'));
    fireEvent.press(screen.getByText('Good'));
    expect(screen.getByText('Good morning')).toBeTruthy();
  });

  it('resets flip state when advancing', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hello world'));
    fireEvent.press(screen.getByText('Hello world')); // flip
    expect(screen.getByText('Translation')).toBeTruthy();
    fireEvent.press(screen.getByText('Easy'));
    expect(screen.queryByText('Translation')).toBeNull();
    expect(screen.getByText('Tap to reveal translation')).toBeTruthy();
  });

  it('wraps back to first card after last card', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hello world'));
    fireEvent.press(screen.getByText('Easy'));
    fireEvent.press(screen.getByText('Easy'));
    fireEvent.press(screen.getByText('Easy'));
    expect(screen.getByText('Hello world')).toBeTruthy();
    expect(screen.getByText('1 of 3')).toBeTruthy();
  });

  it('shows second card on counter', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hello world'));
    fireEvent.press(screen.getByText('Easy'));
    expect(screen.getByText('2 of 3')).toBeTruthy();
  });

  it('shows third card on counter', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hello world'));
    fireEvent.press(screen.getByText('Easy'));
    fireEvent.press(screen.getByText('Easy'));
    expect(screen.getByText('Thank you')).toBeTruthy();
    expect(screen.getByText('3 of 3')).toBeTruthy();
  });
});
