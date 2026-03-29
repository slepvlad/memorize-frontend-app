import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import QuizScreen from '../../../app/(tabs)/quiz';

describe('QuizScreen — initial rendering', () => {
  it('renders Quiz header', () => {
    render(<QuizScreen />);
    expect(screen.getByText('Quiz')).toBeTruthy();
  });

  it('renders Question 1 of 3 counter', () => {
    render(<QuizScreen />);
    expect(screen.getByText('Question 1 of 3')).toBeTruthy();
  });

  it('renders the first question word', () => {
    render(<QuizScreen />);
    expect(screen.getByText('Ephemeral')).toBeTruthy();
  });

  it('renders the "What does this word mean?" label', () => {
    render(<QuizScreen />);
    expect(screen.getByText('What does this word mean?')).toBeTruthy();
  });

  it('renders all 4 options for the first question', () => {
    render(<QuizScreen />);
    expect(screen.getByText('Very important or significant')).toBeTruthy();
    expect(screen.getByText('Lasting for a very short time')).toBeTruthy();
    expect(screen.getByText('Extremely beautiful')).toBeTruthy();
    expect(screen.getByText('Difficult to understand')).toBeTruthy();
  });

  it('shows initial score as 0/0', () => {
    render(<QuizScreen />);
    expect(screen.getByText('0/0')).toBeTruthy();
  });

  it('does not show Next button before answering', () => {
    render(<QuizScreen />);
    expect(screen.queryByText('Next question')).toBeNull();
    expect(screen.queryByText('Restart quiz')).toBeNull();
  });
});

describe('QuizScreen — answering correctly', () => {
  it('shows Next question button after selecting an answer', () => {
    render(<QuizScreen />);
    fireEvent.press(screen.getByText('Lasting for a very short time')); // correct (index 1)
    expect(screen.getByText('Next question')).toBeTruthy();
  });

  it('increments score when correct answer is selected', () => {
    render(<QuizScreen />);
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    expect(screen.getByText('1/1')).toBeTruthy();
  });

  it('does not increment score when wrong answer is selected', () => {
    render(<QuizScreen />);
    fireEvent.press(screen.getByText('Very important or significant')); // wrong
    expect(screen.getByText('0/1')).toBeTruthy();
  });

  it('prevents selecting another answer after answering', () => {
    render(<QuizScreen />);
    fireEvent.press(screen.getByText('Lasting for a very short time')); // correct
    // Press a wrong option — score should not change (disabled)
    fireEvent.press(screen.getByText('Very important or significant'));
    expect(screen.getByText('1/1')).toBeTruthy(); // score unchanged
  });

  it('options are disabled after answering', () => {
    render(<QuizScreen />);
    fireEvent.press(screen.getByText('Very important or significant'));
    // All TouchableOpacities should be disabled
    const touches = screen.UNSAFE_getAllByType(require('react-native').TouchableOpacity);
    const optionButtons = touches.filter((t: any) => t.props.disabled === true);
    expect(optionButtons.length).toBeGreaterThan(0);
  });
});

describe('QuizScreen — navigation between questions', () => {
  it('advances to question 2 when Next is pressed', () => {
    render(<QuizScreen />);
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Next question'));
    expect(screen.getByText('Question 2 of 3')).toBeTruthy();
    expect(screen.getByText('Ubiquitous')).toBeTruthy();
  });

  it('resets selected state after advancing', () => {
    render(<QuizScreen />);
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Next question'));
    expect(screen.queryByText('Next question')).toBeNull();
  });

  it('shows Restart quiz on the last question', () => {
    render(<QuizScreen />);
    // Q1
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Next question'));
    // Q2
    fireEvent.press(screen.getByText('Found everywhere'));
    fireEvent.press(screen.getByText('Next question'));
    // Q3
    fireEvent.press(screen.getByText('Fluent or persuasive in speaking'));
    expect(screen.getByText('Restart quiz')).toBeTruthy();
  });

  it('resets to question 1 when Restart quiz is pressed', () => {
    render(<QuizScreen />);
    fireEvent.press(screen.getByText('Lasting for a very short time'));
    fireEvent.press(screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Found everywhere'));
    fireEvent.press(screen.getByText('Next question'));
    fireEvent.press(screen.getByText('Fluent or persuasive in speaking'));
    fireEvent.press(screen.getByText('Restart quiz'));

    expect(screen.getByText('Question 1 of 3')).toBeTruthy();
    expect(screen.getByText('Ephemeral')).toBeTruthy();
    expect(screen.getByText('0/0')).toBeTruthy();
  });
});

describe('QuizScreen — progress indicators', () => {
  it('option letters A, B, C, D are shown', () => {
    render(<QuizScreen />);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByText('B')).toBeTruthy();
    expect(screen.getByText('C')).toBeTruthy();
    expect(screen.getByText('D')).toBeTruthy();
  });
});
