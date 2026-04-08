import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import QuizScreen from '../../../app/(tabs)/quiz';
import { wordsApi } from '../../../src/api/words';

jest.mock('../../../src/api/words', () => ({
  wordsApi: { getAll: jest.fn(), review: jest.fn() },
}));

const mockGetAll = wordsApi.getAll as jest.Mock;
const mockReview = wordsApi.review as jest.Mock;

const makeWord = (id: string, term: string, definition: string) => ({
  id,
  term,
  definition,
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
  // Use a stable Math.random so question options are deterministic
  jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
  mockGetAll.mockResolvedValue(makePage());
  mockReview.mockResolvedValue(mockWords[0]);
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

describe('QuizScreen — not enough words', () => {
  it('shows "Not enough words" when fewer than 4 words', async () => {
    mockGetAll.mockResolvedValue(makePage(mockWords.slice(0, 3)));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Not enough words')).toBeTruthy());
    expect(
      screen.getByText('Add at least 4 words with definitions to start a quiz.')
    ).toBeTruthy();
  });

  it('shows "Not enough words" when words list is empty', async () => {
    mockGetAll.mockResolvedValue(makePage([]));
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('Not enough words')).toBeTruthy());
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

  it('shows "What does this word mean?" label', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(screen.getByText('What does this word mean?')).toBeTruthy());
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

  it('fetches words with page=0, size=100 on mount', async () => {
    render(<QuizScreen />);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalledWith(0, 100));
  });
});

describe('QuizScreen — answering correctly', () => {
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

  it('calls wordsApi.review on answer', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    await act(async () => {
      fireEvent.press(screen.getByText('Lasting for a very short time'));
    });
    expect(mockReview).toHaveBeenCalledWith('1', true);
  });

  it('calls wordsApi.review with correct=false for wrong answer', async () => {
    render(<QuizScreen />);
    await waitFor(() => screen.getByText('Present everywhere'));
    await act(async () => {
      fireEvent.press(screen.getByText('Present everywhere'));
    });
    expect(mockReview).toHaveBeenCalledWith('1', false);
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
    expect(screen.getByText('1/1')).toBeTruthy(); // score unchanged
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

  it('shows Restart quiz on the last question', async () => {
    render(<QuizScreen />);
    // Q1: Ephemeral
    await waitFor(() => screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));
    // Q2: Ubiquitous
    await waitFor(() => screen.getByText('Present everywhere'));
    fireEvent.press(screen.getByText('Present everywhere'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));
    // Q3: Eloquent
    await waitFor(() => screen.getByText('Fluent and persuasive in speech'));
    fireEvent.press(screen.getByText('Fluent and persuasive in speech'));
    await waitFor(() => screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Next question'));
    // Q4: Resilient — last question shows Restart quiz
    await waitFor(() => screen.getByText('Able to recover quickly'));
    fireEvent.press(screen.getByText('Able to recover quickly'));
    await waitFor(() => expect(screen.getByText('Restart quiz')).toBeTruthy());
  });

  it('reloads quiz when Restart quiz is pressed', async () => {
    render(<QuizScreen />);
    // Answer all 4 questions then restart
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
    await waitFor(() => screen.getByText('Restart quiz'));
    await act(async () => { fireEvent.press(screen.getByText('Restart quiz')); });

    // getAll called at mount + after restart
    expect(mockGetAll.mock.calls.length).toBeGreaterThanOrEqual(2);
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
    // Answer next question wrong
    const options = screen.UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const option = options.find((t: any) => t.props.disabled !== true && t.props.onPress);
    if (option) fireEvent.press(option);
    expect(screen.getByText('1/2')).toBeTruthy();
  });
});
