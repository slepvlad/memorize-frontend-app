import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ActivityIndicator } from 'react-native';
import { SpeakerButton } from '../../../../src/components/ui/SpeakerButton';

describe('SpeakerButton', () => {
  it('renders the speaker icon and accessibility label', () => {
    render(<SpeakerButton onPress={() => {}} label="Play audio for cat" />);
    expect(screen.getByLabelText('Play audio for cat')).toBeTruthy();
    expect(screen.getByTestId('icon-volume-high-outline')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<SpeakerButton onPress={onPress} label="Play audio" />);
    fireEvent.press(screen.getByLabelText('Play audio'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the filled icon while playing', () => {
    render(<SpeakerButton onPress={() => {}} label="Play audio" playing />);
    expect(screen.getByTestId('icon-volume-high')).toBeTruthy();
    expect(screen.queryByTestId('icon-volume-high-outline')).toBeNull();
  });

  it('shows a spinner instead of the icon while loading', () => {
    render(<SpeakerButton onPress={() => {}} label="Play audio" loading />);
    expect(screen.UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
    expect(screen.queryByTestId('icon-volume-high-outline')).toBeNull();
  });

  it('does not call onPress while loading', () => {
    const onPress = jest.fn();
    render(<SpeakerButton onPress={onPress} label="Play audio" loading />);
    fireEvent.press(screen.getByLabelText('Play audio'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('passes size and color through to the icon', () => {
    render(<SpeakerButton onPress={() => {}} label="Play audio" size={18} color="#E24B4A" />);
    const icon = screen.getByTestId('icon-volume-high-outline');
    expect(icon.props.style[0]).toEqual({ fontSize: 18, color: '#E24B4A' });
  });
});
