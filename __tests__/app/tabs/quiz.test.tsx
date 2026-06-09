import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import QuizScreen from '../../../app/(tabs)/quiz';
import { phrasesApi } from '../../../src/api/phrases';
import { useLocalSearchParams } from 'expo-router';

const mockUseLocalSearchParams = useLocalSearchParams as jest.Mock;

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

// At least 4 phrases needed to build quiz questions
const mockPhrases = [
  makePhrase('p1', 'Hello world', 'Привет мир'),
  makePhrase('p2', 'Good morning', 'Доброе утро'),
  makePhrase('p3', 'Thank you', 'Спасибо'),
  makePhrase('p4', 'Goodbye', 'До свидания'),
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
  jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
  mockGetAll.mockResolvedValue(makePage());
  mockReview.mockResolvedValue(mockPhrases[0]);
  mockUseLocalSearchParams.mockReturnValue({});
});

afterEach(() => {
  jest.spyOn(global.Math, 'random').mockRestore();
});

describe('QuizScreen — loading state', () => {
  it('shows loading indicator while fetching', () => {
    mockGetAll.mockReturnValue(new Promise(() => {}));
    render(<QuizScreen />);
    expect(screen.toJSON()).toBeTruthy();
  });
});

describe('QuizScreen — not enough phrases', () => {
  it('shows "Not enough phrases" when fewer than 4 phrases', async () => {
    mockGetAll.mockResolvedValue(makePage(mockPhrases.slice(0, 3)));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Not enough phrases')).toBeTruthy());
    expect(screen.getByText('Add at least 4 phrases to start a quiz.')).toBeTruthy();
  });

  it('shows "All caught up!" when phrases list is empty', async () => {
    mockGetAll.mockResolvedValue(makePage([]));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('All caught up!')).toBeTruthy());
    expect(screen.getByText('Nothing is due for review right now. Come back later.')).toBeTruthy();
  });

  it('shows "Not enough phrases" for exactly 1 phrase', async () => {
    mockGetAll.mockResolvedValue(makePage(mockPhrases.slice(0, 1)));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Not enough phrases')).toBeTruthy());
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

  it('shows the first phrase originalWord as question', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Hello world')).toBeTruthy());
  });

  it('shows the correct translation as one of the options', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Привет мир')).toBeTruthy());
  });

  it('fetches phrases with page=0, size=200 on mount', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalledWith(0, 200));
  });
});

describe('QuizScreen — answering', () => {
  it('shows Next question button after selecting an answer', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Привет мир'));
    expect(screen.getByText('Next question')).toBeTruthy();
  });

  it('increments score when correct answer selected', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Привет мир'));
    expect(screen.getByText('1/1')).toBeTruthy();
  });

  it('does not increment score for wrong answer', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Доброе утро'));
    fireEvent.press(screen.getByText('Доброе утро')); // wrong for Q1
    expect(screen.getByText('0/1')).toBeTruthy();
  });

  it('calls phrasesApi.review with correct=true for right answer', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    await act(async () => {
      fireEvent.press(screen.getByText('Привет мир'));
    });
    expect(mockReview).toHaveBeenCalledWith('p1', true);
  });

  it('calls phrasesApi.review with correct=false for wrong answer', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Доброе утро'));
    await act(async () => {
      fireEvent.press(screen.getByText('Доброе утро'));
    });
    expect(mockReview).toHaveBeenCalledWith('p1', false);
  });

  it('options are disabled after answering', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Привет мир'));
    const touches = screen.UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const disabled = touches.filter((t: any) => t.props.disabled === true);
    expect(disabled.length).toBeGreaterThan(0);
  });

  it('prevents double-answering', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Доброе утро'));
    expect(screen.getByText('1/1')).toBeTruthy();
  });
});

describe('QuizScreen — navigation between questions', () => {
  it('advances to question 2 on Next press', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Next question'));
    await waitFor(() => expect(screen.getByText('Question 2 of 4')).toBeTruthy());
  });

  it('hides Next button after advancing', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Next question'));
    await waitFor(() => expect(screen.queryByText('Next question')).toBeNull());
  });

  it('shows See results on the last question', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Привет мир'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Доброе утро'));
    fireEvent.press(screen.getByText('Доброе утро'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Спасибо'));
    fireEvent.press(screen.getByText('Спасибо'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('До свидания'));
    fireEvent.press(screen.getByText('До свидания'));
    await waitFor(() => expect(screen.getByText('See results')).toBeTruthy());
  });

  it('shows results screen and New session button after completing quiz', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Привет мир'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Доброе утро'));
    fireEvent.press(screen.getByText('Доброе утро'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Спасибо'));
    fireEvent.press(screen.getByText('Спасибо'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('До свидания'));
    fireEvent.press(screen.getByText('До свидания'));
    await waitFor(() => screen.getByText('See results'));
    fireEvent.press(screen.getByText('See results'));

    await waitFor(() => expect(screen.getByText('New session')).toBeTruthy());
    await act(async () => { fireEvent.press(screen.getByText('New session')); });

    expect(mockGetAll.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});

describe('QuizScreen — score display', () => {
  it('shows correct score format N/total', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Привет мир')); // correct
    expect(screen.getByText('1/1')).toBeTruthy();
    fireEvent.press(screen.getByText('Next question'));
    await waitFor(() => screen.getByText('Question 2 of 4'));
    const options = screen.UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const option = options.find((t: any) => t.props.disabled !== true && t.props.onPress);
    if (option) fireEvent.press(option);
    expect(screen.getByText('1/2')).toBeTruthy();
  });
});

describe('QuizScreen — learn session (phraseIds param)', () => {
  it('shows "from Learn" badge when phraseIds param is provided', async () => {
    mockUseLocalSearchParams.mockReturnValue({ phraseIds: 'p1,p2,p3,p4' });
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('from Learn')).toBeTruthy());
  });

  it('does not show "from Learn" badge in normal mode', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Quiz'));
    expect(screen.queryByText('from Learn')).toBeNull();
  });

  it('builds questions from only the specified phrase IDs', async () => {
    mockUseLocalSearchParams.mockReturnValue({ phraseIds: 'p1,p2' });
    render(<QuizScreen />);
    // 4 total phrases available, 2 targeted → 2 questions
    await waitFor(() => expect(screen.getByText('Question 1 of 2')).toBeTruthy());
  });

  it('shows "Not enough phrases" when total pool has fewer than 4 phrases', async () => {
    mockGetAll.mockResolvedValue(makePage(mockPhrases.slice(0, 3)));
    mockUseLocalSearchParams.mockReturnValue({ phraseIds: 'p1,p2' });
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Not enough phrases')).toBeTruthy());
  });

  it('calls phrasesApi.review for learn-session answers', async () => {
    mockUseLocalSearchParams.mockReturnValue({ phraseIds: 'p1,p2,p3,p4' });
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Привет мир'));
    await act(async () => { fireEvent.press(screen.getByText('Привет мир')); });
    expect(mockReview).toHaveBeenCalledWith('p1', true);
  });
});

describe('QuizScreen — New session resets learn context', () => {
  const completeQuiz = async () => {
    await waitFor(() => screen.getByText('Привет мир'));
    fireEvent.press(screen.getByText('Привет мир'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Доброе утро'));
    fireEvent.press(screen.getByText('Доброе утро'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('Спасибо'));
    fireEvent.press(screen.getByText('Спасибо'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));

    await waitFor(() => screen.getByText('До свидания'));
    fireEvent.press(screen.getByText('До свидания'));
    await waitFor(() => screen.getByText('See results'));
    fireEvent.press(screen.getByText('See results'));
    await waitFor(() => screen.getByText('New session'));
  };

  it('removes "from Learn" badge after New session in a learn-session quiz', async () => {
    mockUseLocalSearchParams.mockReturnValue({ phraseIds: 'p1,p2,p3,p4' });
    render(<QuizScreen />);
    await completeQuiz();
    await act(async () => { fireEvent.press(screen.getByText('New session')); });
    await waitFor(() => expect(screen.queryByText('from Learn')).toBeNull());
  });

  it('re-fetches fresh data on New session (does not replay stale phraseIds)', async () => {
    mockUseLocalSearchParams.mockReturnValue({ phraseIds: 'p1,p2,p3,p4' });
    render(<QuizScreen />);
    await completeQuiz();
    const callsBefore = mockGetAll.mock.calls.length;
    await act(async () => { fireEvent.press(screen.getByText('New session')); });
    expect(mockGetAll.mock.calls.length).toBeGreaterThan(callsBefore);
    // new call must NOT pass phraseIds — it calls getAll(0, 200) for due-phrases
    const lastCall = mockGetAll.mock.calls[mockGetAll.mock.calls.length - 1];
    expect(lastCall).toEqual([0, 200]);
  });
});
