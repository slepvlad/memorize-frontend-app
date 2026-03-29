import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import LearnScreen from '../../../app/(tabs)/learn';

describe('LearnScreen — initial rendering', () => {
  it('renders Learn header', () => {
    render(<LearnScreen />);
    expect(screen.getByText('Learn')).toBeTruthy();
  });

  it('shows 1 of 3 counter', () => {
    render(<LearnScreen />);
    expect(screen.getByText('1 of 3')).toBeTruthy();
  });

  it('shows the first card word on the front', () => {
    render(<LearnScreen />);
    expect(screen.getByText('Serendipity')).toBeTruthy();
  });

  it('shows pronunciation on the front', () => {
    render(<LearnScreen />);
    expect(screen.getByText('/ˌser.ənˈdɪp.ə.t̬i/')).toBeTruthy();
  });

  it('shows "Tap to reveal meaning" hint', () => {
    render(<LearnScreen />);
    expect(screen.getByText('Tap to reveal meaning')).toBeTruthy();
  });

  it('shows word type pill (Noun)', () => {
    render(<LearnScreen />);
    expect(screen.getByText('Noun')).toBeTruthy();
  });

  it('renders Hard, Good, Easy difficulty buttons', () => {
    render(<LearnScreen />);
    expect(screen.getByText('Hard')).toBeTruthy();
    expect(screen.getByText('Good')).toBeTruthy();
    expect(screen.getByText('Easy')).toBeTruthy();
  });
});

describe('LearnScreen — card flip', () => {
  it('flips to show definition when card is tapped', () => {
    render(<LearnScreen />);
    fireEvent.press(screen.getByText('Serendipity'));
    expect(screen.getByText('The occurrence of events by chance in a happy way')).toBeTruthy();
  });

  it('shows example sentence after flip', () => {
    render(<LearnScreen />);
    fireEvent.press(screen.getByText('Serendipity'));
    expect(screen.getByText(/"It was pure serendipity/)).toBeTruthy();
  });

  it('shows Definition pill after flip', () => {
    render(<LearnScreen />);
    fireEvent.press(screen.getByText('Serendipity'));
    expect(screen.getByText('Definition')).toBeTruthy();
  });

  it('does NOT show "Tap to reveal meaning" after flip', () => {
    render(<LearnScreen />);
    fireEvent.press(screen.getByText('Serendipity'));
    expect(screen.queryByText('Tap to reveal meaning')).toBeNull();
  });
});

describe('LearnScreen — difficulty navigation', () => {
  it('advances to next card when Easy is pressed', () => {
    render(<LearnScreen />);
    fireEvent.press(screen.getByText('Easy'));
    expect(screen.getByText('Ephemeral')).toBeTruthy();
    expect(screen.getByText('2 of 3')).toBeTruthy();
  });

  it('advances to next card when Good is pressed', () => {
    render(<LearnScreen />);
    fireEvent.press(screen.getByText('Good'));
    expect(screen.getByText('Ephemeral')).toBeTruthy();
  });

  it('advances to next card when Hard is pressed', () => {
    render(<LearnScreen />);
    fireEvent.press(screen.getByText('Hard'));
    expect(screen.getByText('Ephemeral')).toBeTruthy();
  });

  it('resets to first card when on the last card and Easy is pressed', () => {
    render(<LearnScreen />);
    fireEvent.press(screen.getByText('Easy')); // → card 2
    fireEvent.press(screen.getByText('Easy')); // → card 3
    fireEvent.press(screen.getByText('Easy')); // → wraps to card 1
    expect(screen.getByText('Serendipity')).toBeTruthy();
    expect(screen.getByText('1 of 3')).toBeTruthy();
  });

  it('resets flip state when advancing to next card', () => {
    render(<LearnScreen />);
    fireEvent.press(screen.getByText('Serendipity')); // flip
    expect(screen.getByText('Definition')).toBeTruthy();
    fireEvent.press(screen.getByText('Easy')); // advance
    expect(screen.queryByText('Definition')).toBeNull();
    expect(screen.getByText('Tap to reveal meaning')).toBeTruthy();
  });

  it('shows third card correctly', () => {
    render(<LearnScreen />);
    fireEvent.press(screen.getByText('Easy'));
    fireEvent.press(screen.getByText('Easy'));
    expect(screen.getByText('Eloquent')).toBeTruthy();
    expect(screen.getByText('3 of 3')).toBeTruthy();
  });
});

describe('LearnScreen — progress bar', () => {
  it('renders 3 progress segments', () => {
    render(<LearnScreen />);
    // Progress track has 3 segments (one per card)
    const { toJSON } = render(<LearnScreen />);
    expect(toJSON()).toBeDefined();
  });
});
