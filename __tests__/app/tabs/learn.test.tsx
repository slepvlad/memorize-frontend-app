import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import LearnScreen from '../../../app/(tabs)/learn';
import { wordsApi } from '../../../src/api/words';

jest.mock('../../../src/api/words', () => ({
  wordsApi: { getAll: jest.fn(), review: jest.fn() },
}));

const mockGetAll = wordsApi.getAll as jest.Mock;
const mockReview = wordsApi.review as jest.Mock;

const makeWord = (id: string, term: string, definition: string, repetitions = 0) => ({
  id,
  term,
  definition,
  interval: 1,
  repetitions,
  easiness_factor: 2.5,
  next_review_date: '2026-04-09',
});

const mockWords = [
  makeWord('1', 'Ephemeral', 'Lasting for a very short time'),
  makeWord('2', 'Ubiquitous', 'Present everywhere', 2),
  makeWord('3', 'Eloquent', 'Fluent and persuasive in speech'),
];

const makePage = (words = mockWords) => ({
  content: words,
  totalElements: words.length,
  totalPages: 1,
  numberOfElements: words.length,
  first: true,
  last: true,
  empty: words.length === 0,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAll.mockResolvedValue(makePage());
  mockReview.mockResolvedValue({ ...mockWords[0], repetitions: 1 });
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
  it('shows empty message when no words exist', async () => {
    mockGetAll.mockResolvedValue(makePage([]));
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('No words yet')).toBeTruthy());
    expect(screen.getByText('Add words from the Home tab to start learning.')).toBeTruthy();
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

  it('shows first word term on front face', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Ephemeral')).toBeTruthy());
  });

  it('shows Term pill on front face', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Term')).toBeTruthy());
  });

  it('shows "Tap to reveal definition" hint', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Tap to reveal definition')).toBeTruthy());
  });

  it('renders Hard, Good, Easy difficulty buttons', async () => {
    render(<LearnScreen />);
    await waitFor(() => {
      expect(screen.getByText('Hard')).toBeTruthy();
      expect(screen.getByText('Good')).toBeTruthy();
      expect(screen.getByText('Easy')).toBeTruthy();
    });
  });

  it('fetches words with page=0, size=100', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalledWith(0, 100));
  });
});

describe('LearnScreen — card flip', () => {
  it('reveals definition when card is tapped', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    fireEvent.press(screen.getByText('Ephemeral'));
    expect(screen.getByText('Lasting for a very short time')).toBeTruthy();
  });

  it('shows Definition pill after flip', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    fireEvent.press(screen.getByText('Ephemeral'));
    expect(screen.getByText('Definition')).toBeTruthy();
  });

  it('hides "Tap to reveal definition" after flip', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    fireEvent.press(screen.getByText('Ephemeral'));
    expect(screen.queryByText('Tap to reveal definition')).toBeNull();
  });

  it('shows "No definition provided." when word has no definition', async () => {
    const wordNoDefinition = { ...makeWord('4', 'Laconic', ''), definition: undefined };
    mockGetAll.mockResolvedValue(makePage([wordNoDefinition as any]));
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Laconic'));
    fireEvent.press(screen.getByText('Laconic'));
    expect(screen.getByText('No definition provided.')).toBeTruthy();
  });
});

describe('LearnScreen — difficulty navigation', () => {
  it('calls wordsApi.review with correct=false on Hard press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hard'));
    await act(async () => {
      fireEvent.press(screen.getByText('Hard'));
    });
    expect(mockReview).toHaveBeenCalledWith('1', false);
  });

  it('calls wordsApi.review with correct=true on Good press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Good'));
    await act(async () => {
      fireEvent.press(screen.getByText('Good'));
    });
    expect(mockReview).toHaveBeenCalledWith('1', true);
  });

  it('calls wordsApi.review with correct=true on Easy press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Easy'));
    await act(async () => {
      fireEvent.press(screen.getByText('Easy'));
    });
    expect(mockReview).toHaveBeenCalledWith('1', true);
  });

  it('advances to next card after pressing Easy', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    await act(async () => {
      fireEvent.press(screen.getByText('Easy'));
    });
    await waitFor(() => expect(screen.getByText('Ubiquitous')).toBeTruthy());
    expect(screen.getByText('2 of 3')).toBeTruthy();
  });

  it('advances to next card after pressing Hard', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    await act(async () => {
      fireEvent.press(screen.getByText('Hard'));
    });
    await waitFor(() => expect(screen.getByText('Ubiquitous')).toBeTruthy());
  });

  it('resets flip state when advancing to next card', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    fireEvent.press(screen.getByText('Ephemeral')); // flip
    expect(screen.getByText('Definition')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText('Easy'));
    });
    await waitFor(() => expect(screen.queryByText('Definition')).toBeNull());
    expect(screen.getByText('Tap to reveal definition')).toBeTruthy();
  });

  it('wraps back to first card after last card', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    await act(async () => { fireEvent.press(screen.getByText('Easy')); });
    await act(async () => { fireEvent.press(screen.getByText('Easy')); });
    await act(async () => { fireEvent.press(screen.getByText('Easy')); });
    await waitFor(() => expect(screen.getByText('Ephemeral')).toBeTruthy());
    expect(screen.getByText('1 of 3')).toBeTruthy();
  });

  it('shows second card on counter', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    await act(async () => { fireEvent.press(screen.getByText('Easy')); });
    await waitFor(() => expect(screen.getByText('2 of 3')).toBeTruthy());
  });

  it('shows third card on counter', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    await act(async () => { fireEvent.press(screen.getByText('Easy')); });
    await act(async () => { fireEvent.press(screen.getByText('Easy')); });
    await waitFor(() => {
      expect(screen.getByText('Eloquent')).toBeTruthy();
      expect(screen.getByText('3 of 3')).toBeTruthy();
    });
  });
});
