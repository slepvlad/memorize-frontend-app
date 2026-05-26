import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import LearnScreen from '../../../app/(tabs)/learn';
import { wordsApi } from '../../../src/api/words';
import { phrasesApi } from '../../../src/api/phrases';

jest.mock('../../../src/api/words', () => ({
  wordsApi: { getAll: jest.fn(), review: jest.fn() },
}));

jest.mock('../../../src/api/phrases', () => ({
  phrasesApi: { getAll: jest.fn(), review: jest.fn() },
}));

const mockWordsGetAll = wordsApi.getAll as jest.Mock;
const mockWordsReview = wordsApi.review as jest.Mock;
const mockPhrasesGetAll = phrasesApi.getAll as jest.Mock;
const mockPhrasesReview = phrasesApi.review as jest.Mock;

const makeWord = (id: string, term: string, definition: string, repetitions = 0) => ({
  id,
  term,
  definition,
  interval: 1,
  repetitions,
  easiness_factor: 2.5,
  next_review_date: '2026-04-09',
});

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

const mockWords = [
  makeWord('1', 'Ephemeral', 'Lasting for a very short time'),
  makeWord('2', 'Ubiquitous', 'Present everywhere', 2),
  makeWord('3', 'Eloquent', 'Fluent and persuasive in speech'),
];

const mockPhrases = [
  makePhrase('p1', 'Hello world', 'Привет мир'),
];

const makeWordPage = (words = mockWords) => ({
  content: words,
  totalElements: words.length,
  totalPages: 1,
  numberOfElements: words.length,
  first: true,
  last: true,
  empty: words.length === 0,
});

const makePhrasePage = (phrases = mockPhrases) => ({
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
  mockWordsGetAll.mockResolvedValue(makeWordPage());
  mockPhrasesGetAll.mockResolvedValue(makePhrasePage([]));
  mockWordsReview.mockResolvedValue({ ...mockWords[0], repetitions: 1 });
  mockPhrasesReview.mockResolvedValue({ ...mockPhrases[0], repetitions: 1 });
});

describe('LearnScreen — loading state', () => {
  it('shows activity indicator while fetching', () => {
    mockWordsGetAll.mockReturnValue(new Promise(() => {}));
    mockPhrasesGetAll.mockReturnValue(new Promise(() => {}));
    render(<LearnScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });
});

describe('LearnScreen — empty state', () => {
  it('shows empty message when no words or phrases exist', async () => {
    mockWordsGetAll.mockResolvedValue(makeWordPage([]));
    mockPhrasesGetAll.mockResolvedValue(makePhrasePage([]));
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('No cards yet')).toBeTruthy());
    expect(screen.getByText('Add words or phrases from the Home tab to start learning.')).toBeTruthy();
  });

  it('shows cards when words exist but phrases are empty', async () => {
    mockPhrasesGetAll.mockResolvedValue(makePhrasePage([]));
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Ephemeral')).toBeTruthy());
  });

  it('shows cards when phrases exist but words are empty', async () => {
    mockWordsGetAll.mockResolvedValue(makeWordPage([]));
    mockPhrasesGetAll.mockResolvedValue(makePhrasePage());
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Hello world')).toBeTruthy());
  });
});

describe('LearnScreen — initial rendering', () => {
  it('renders Learn header', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Learn')).toBeTruthy());
  });

  it('shows 1 of N counter for words only', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('1 of 3')).toBeTruthy());
  });

  it('shows 1 of N counter combining words and phrases', async () => {
    mockPhrasesGetAll.mockResolvedValue(makePhrasePage());
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('1 of 4')).toBeTruthy());
  });

  it('shows first word front on front face', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Ephemeral')).toBeTruthy());
  });

  it('shows Term pill on front face for word cards', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Term')).toBeTruthy());
  });

  it('shows "Tap to reveal" hint', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Tap to reveal')).toBeTruthy());
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
    await waitFor(() => expect(mockWordsGetAll).toHaveBeenCalledWith(0, 100));
  });

  it('fetches phrases with page=0, size=100', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(mockPhrasesGetAll).toHaveBeenCalledWith(0, 100));
  });
});

describe('LearnScreen — word card flip', () => {
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

  it('hides "Tap to reveal" after flip', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    fireEvent.press(screen.getByText('Ephemeral'));
    expect(screen.queryByText('Tap to reveal')).toBeNull();
  });

  it('shows "No definition provided." when word has no definition', async () => {
    const wordNoDefinition = { ...makeWord('4', 'Laconic', ''), definition: undefined };
    mockWordsGetAll.mockResolvedValue(makeWordPage([wordNoDefinition as any]));
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Laconic'));
    fireEvent.press(screen.getByText('Laconic'));
    expect(screen.getByText('No definition provided.')).toBeTruthy();
  });
});

describe('LearnScreen — phrase card flip', () => {
  beforeEach(() => {
    mockWordsGetAll.mockResolvedValue(makeWordPage([]));
    mockPhrasesGetAll.mockResolvedValue(makePhrasePage());
  });

  it('shows originalWord on front face', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Hello world')).toBeTruthy());
  });

  it('shows Phrase pill on front face', async () => {
    render(<LearnScreen />);
    await waitFor(() => expect(screen.getByText('Phrase')).toBeTruthy());
  });

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
});

describe('LearnScreen — word card difficulty navigation', () => {
  it('calls wordsApi.review with correct=false on Hard press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hard'));
    await act(async () => {
      fireEvent.press(screen.getByText('Hard'));
    });
    expect(mockWordsReview).toHaveBeenCalledWith('1', false);
  });

  it('calls wordsApi.review with correct=true on Good press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Good'));
    await act(async () => {
      fireEvent.press(screen.getByText('Good'));
    });
    expect(mockWordsReview).toHaveBeenCalledWith('1', true);
  });

  it('calls wordsApi.review with correct=true on Easy press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Easy'));
    await act(async () => {
      fireEvent.press(screen.getByText('Easy'));
    });
    expect(mockWordsReview).toHaveBeenCalledWith('1', true);
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
    fireEvent.press(screen.getByText('Ephemeral'));
    expect(screen.getByText('Definition')).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByText('Easy'));
    });
    await waitFor(() => expect(screen.queryByText('Definition')).toBeNull());
    expect(screen.getByText('Tap to reveal')).toBeTruthy();
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

describe('LearnScreen — phrase card difficulty navigation', () => {
  beforeEach(() => {
    mockWordsGetAll.mockResolvedValue(makeWordPage([]));
    mockPhrasesGetAll.mockResolvedValue(makePhrasePage());
  });

  it('calls phrasesApi.review with correct=false on Hard press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Hard'));
    await act(async () => {
      fireEvent.press(screen.getByText('Hard'));
    });
    expect(mockPhrasesReview).toHaveBeenCalledWith('p1', false);
    expect(mockWordsReview).not.toHaveBeenCalled();
  });

  it('calls phrasesApi.review with correct=true on Good press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Good'));
    await act(async () => {
      fireEvent.press(screen.getByText('Good'));
    });
    expect(mockPhrasesReview).toHaveBeenCalledWith('p1', true);
  });

  it('calls phrasesApi.review with correct=true on Easy press', async () => {
    render(<LearnScreen />);
    await waitFor(() => screen.getByText('Easy'));
    await act(async () => {
      fireEvent.press(screen.getByText('Easy'));
    });
    expect(mockPhrasesReview).toHaveBeenCalledWith('p1', true);
  });
});
