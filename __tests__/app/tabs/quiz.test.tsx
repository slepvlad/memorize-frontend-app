import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import QuizScreen from '../../../app/(tabs)/quiz';
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

const makeWord = (id: string, term: string, definition: string) => ({
  id,
  term,
  definition,
  interval: 1,
  repetitions: 0,
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

// At least 4 words with unique definitions needed to build quiz questions
const mockWords = [
  makeWord('1', 'Ephemeral', 'Lasting for a very short time'),
  makeWord('2', 'Ubiquitous', 'Present everywhere'),
  makeWord('3', 'Eloquent', 'Fluent and persuasive in speech'),
  makeWord('4', 'Resilient', 'Able to recover quickly'),
];

const mockPhrases = [
  makePhrase('p1', 'Hello world', 'Привет мир'),
  makePhrase('p2', 'Good morning', 'Доброе утро'),
  makePhrase('p3', 'Thank you', 'Спасибо'),
  makePhrase('p4', 'Goodbye', 'До свидания'),
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

const makePhrasePage = (phrases = [] as typeof mockPhrases) => ({
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
  jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
  mockWordsGetAll.mockResolvedValue(makeWordPage());
  mockPhrasesGetAll.mockResolvedValue(makePhrasePage());
  mockWordsReview.mockResolvedValue(mockWords[0]);
  mockPhrasesReview.mockResolvedValue(mockPhrases[0]);
});

afterEach(() => {
  jest.spyOn(global.Math, 'random').mockRestore();
});

describe('QuizScreen — loading state', () => {
  it('shows loading indicator while fetching', () => {
    mockWordsGetAll.mockReturnValue(new Promise(() => {}));
    mockPhrasesGetAll.mockReturnValue(new Promise(() => {}));
    render(<QuizScreen />);
    expect(screen.toJSON()).toBeTruthy();
  });
});

describe('QuizScreen — not enough cards', () => {
  it('shows "Not enough cards" when fewer than 4 total items', async () => {
    mockWordsGetAll.mockResolvedValue(makeWordPage(mockWords.slice(0, 3)));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Not enough cards')).toBeTruthy());
    expect(
      screen.getByText('Add at least 4 words or phrases to start a quiz.')
    ).toBeTruthy();
  });

  it('shows "All caught up!" when words list is empty', async () => {
    mockWordsGetAll.mockResolvedValue(makeWordPage([]));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('All caught up!')).toBeTruthy());
  });

  it('shows "All caught up!" when both words and phrases are empty', async () => {
    mockWordsGetAll.mockResolvedValue(makeWordPage([]));
    mockPhrasesGetAll.mockResolvedValue(makePhrasePage([]));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('All caught up!')).toBeTruthy());
    expect(screen.getByText('Nothing is due for review right now. Come back later.')).toBeTruthy();
  });

  it('shows "Not enough cards" when only 3 phrases and no words', async () => {
    mockWordsGetAll.mockResolvedValue(makeWordPage([]));
    mockPhrasesGetAll.mockResolvedValue(makePhrasePage(mockPhrases.slice(0, 3)));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Not enough cards')).toBeTruthy());
  });

  it('can build quiz with 4 phrases and no words', async () => {
    mockWordsGetAll.mockResolvedValue(makeWordPage([]));
    mockPhrasesGetAll.mockResolvedValue(makePhrasePage(mockPhrases));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Quiz')).toBeTruthy());
    expect(screen.queryByText('Not enough cards')).toBeNull();
  });

  it('can build quiz with mixed words and phrases totalling 4+', async () => {
    mockWordsGetAll.mockResolvedValue(makeWordPage(mockWords.slice(0, 2)));
    mockPhrasesGetAll.mockResolvedValue(makePhrasePage(mockPhrases.slice(0, 2)));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Quiz')).toBeTruthy());
    expect(screen.queryByText('Not enough cards')).toBeNull();
  });
});

describe('QuizScreen — initial rendering', () => {
  it('renders Quiz header', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Quiz')).toBeTruthy());
  });

  it('shows Question 1 of N counter', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Question 1 of 4')).toBeTruthy());
  });

  it('shows "What does this mean?" label', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('What does this mean?')).toBeTruthy());
  });

  it('shows initial score as 0/0', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('0/0')).toBeTruthy());
  });

  it('does not show Next button before answering', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Quiz'));
    expect(screen.queryByText('Next question')).toBeNull();
    expect(screen.queryByText('Restart quiz')).toBeNull();
  });

  it('shows option letters A, B, C, D', async () => {
    render(<QuizScreen />);
    await waitFor(() => {
      expect(screen.getByText('A')).toBeTruthy();
      expect(screen.getByText('B')).toBeTruthy();
      expect(screen.getByText('C')).toBeTruthy();
      expect(screen.getByText('D')).toBeTruthy();
    });
  });

  it('shows the first question term', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Ephemeral')).toBeTruthy());
  });

  it('shows correct definition as one of the options', async () => {
    render(<QuizScreen />);
    await waitFor(() =>
      expect(screen.getByText('Lasting for a very short time')).toBeTruthy()
    );
  });

  it('fetches words with page=0, size=200 on mount', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(mockWordsGetAll).toHaveBeenCalledWith(0, 200));
  });

  it('fetches phrases with page=0, size=200 on mount', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(mockPhrasesGetAll).toHaveBeenCalledWith(0, 200));
  });
});

describe('QuizScreen — answering word questions', () => {
  it('shows Next question button after selecting an answer', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    expect(screen.getByText('Next question')).toBeTruthy();
  });

  it('increments score when correct answer selected', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    expect(screen.getByText('1/1')).toBeTruthy();
  });

  it('does not increment score for wrong answer', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Present everywhere'));
    fireEvent.press(screen.getByText('Present everywhere')); // wrong for Q1
    expect(screen.getByText('0/1')).toBeTruthy();
  });

  it('calls wordsApi.review on word answer', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    await act(async () => {
      fireEvent.press(screen.getByText('Lasting for a very short time'));
    });
    expect(mockWordsReview).toHaveBeenCalledWith('1', true);
    expect(mockPhrasesReview).not.toHaveBeenCalled();
  });

  it('calls wordsApi.review with correct=false for wrong answer', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Present everywhere'));
    await act(async () => {
      fireEvent.press(screen.getByText('Present everywhere'));
    });
    expect(mockWordsReview).toHaveBeenCalledWith('1', false);
  });

  it('options are disabled after answering', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    const touches = screen.UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const disabled = touches.filter((t: any) => t.props.disabled === true);
    expect(disabled.length).toBeGreaterThan(0);
  });

  it('prevents double-answering', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Present everywhere'));
    expect(screen.getByText('1/1')).toBeTruthy();
  });
});

describe('QuizScreen — phrase questions', () => {
  beforeEach(() => {
    mockWordsGetAll.mockResolvedValue(makeWordPage([]));
    mockPhrasesGetAll.mockResolvedValue(makePhrasePage(mockPhrases));
  });

  it('shows phrase originalWord as the question', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Hello world')).toBeTruthy());
  });

  it('shows translated word as one of the options', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Привет мир')).toBeTruthy());
  });

  it('calls phrasesApi.review with correct=true when correct translation selected', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    await act(async () => {
      fireEvent.press(screen.getByText('Привет мир'));
    });
    expect(mockPhrasesReview).toHaveBeenCalledWith('p1', true);
    expect(mockWordsReview).not.toHaveBeenCalled();
  });

  it('calls phrasesApi.review with correct=false for wrong translation', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Доброе утро'));
    await act(async () => {
      fireEvent.press(screen.getByText('Доброе утро'));
    });
    expect(mockPhrasesReview).toHaveBeenCalledWith('p1', false);
  });

  it('shows Question 1 of 4 for 4 phrases', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Question 1 of 4')).toBeTruthy());
  });
});

describe('QuizScreen — navigation between questions', () => {
  it('advances to question 2 on Next press', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Next question'));
    await waitFor(() => expect(screen.getByText('Question 2 of 4')).toBeTruthy());
  });

  it('hides Next button after advancing', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Next question'));
    await waitFor(() => expect(screen.queryByText('Next question')).toBeNull());
  });

  it('shows See results on the last question', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Present everywhere'));
    fireEvent.press(screen.getByText('Present everywhere'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Fluent and persuasive in speech'));
    fireEvent.press(screen.getByText('Fluent and persuasive in speech'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Able to recover quickly'));
    fireEvent.press(screen.getByText('Able to recover quickly'));
    await waitFor(() => expect(screen.getByText('See results')).toBeTruthy());
  });

  it('shows results screen and New session button after completing quiz', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Present everywhere'));
    fireEvent.press(screen.getByText('Present everywhere'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Fluent and persuasive in speech'));
    fireEvent.press(screen.getByText('Fluent and persuasive in speech'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Able to recover quickly'));
    fireEvent.press(screen.getByText('Able to recover quickly'));
    await waitFor(() => screen.getByText('See results'));
    fireEvent.press(screen.getByText('See results'));

    await waitFor(() => expect(screen.getByText('New session')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('New session')); });

    expect(mockWordsGetAll.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe('QuizScreen — score display', () => {
  it('shows correct score format N/total', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Lasting for a very short time')); // correct
    expect(screen.getByText('1/1')).toBeTruthy();
    fireEvent.press(screen.getByText('Next question'));
    await waitFor(() => screen.getByText('Question 2 of 4'));
    const options = screen.UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const option = options.find((t: any) => t.props.disabled !== true && t.props.onPress);
    if (option) fireEvent.press(option);
    expect(screen.getByText('1/2')).toBeTruthy();
  });
});
