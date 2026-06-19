import React from 'react';
import { render } from '@testing-library/react-native';

type ScreenConfig = {
  name: string;
  options?: { title?: string; tabBarIcon?: (props: object) => React.ReactNode };
};

// Prefix "mock" is required so Jest allows this variable inside jest.mock() factory
var mockScreens: ScreenConfig[];

jest.mock('expo-router', () => {
  const R = require('react');
  const MockTabs = ({ children }: { children: React.ReactNode }) =>
    R.createElement(R.Fragment, null, children);
  MockTabs.Screen = (props: ScreenConfig) => {
    mockScreens.push(props);
    return null;
  };
  return { Tabs: MockTabs };
});

import TabLayout from '../../../app/(tabs)/_layout';

beforeEach(() => {
  mockScreens = [];
});

describe('(tabs) _layout — quiz tab registration', () => {
  it('registers quiz with name "quiz"', () => {
    render(<TabLayout />);
    expect(mockScreens.some((s) => s.name === 'quiz')).toBe(true);
  });

  it('does not register quiz as "quiz/index"', () => {
    render(<TabLayout />);
    expect(mockScreens.some((s) => s.name === 'quiz/index')).toBe(false);
  });

  it('positions quiz directly after learn and before vocabulary', () => {
    render(<TabLayout />);
    const names = mockScreens.map((s) => s.name);
    const learnIdx = names.indexOf('learn');
    const quizIdx = names.indexOf('quiz');
    const vocabIdx = names.indexOf('vocabulary');
    expect(quizIdx).toBe(learnIdx + 1);
    expect(vocabIdx).toBe(quizIdx + 1);
  });

  it('sets quiz tab title to "Quiz"', () => {
    render(<TabLayout />);
    const quiz = mockScreens.find((s) => s.name === 'quiz');
    expect(quiz?.options?.title).toBe('Quiz');
  });

  it('provides a tabBarIcon function for quiz', () => {
    render(<TabLayout />);
    const quiz = mockScreens.find((s) => s.name === 'quiz');
    expect(typeof quiz?.options?.tabBarIcon).toBe('function');
  });
});
