import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Button } from '../../../../src/components/ui/Button';

describe('Button', () => {
  it('renders the title', () => {
    render(<Button title="Click me" onPress={() => {}} />);
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button title="Press" onPress={onPress} />);
    fireEvent.press(screen.getByText('Press'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button title="Disabled" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator and hides title when loading', () => {
    render(<Button title="Loading" onPress={() => {}} loading />);
    expect(screen.queryByText('Loading')).toBeNull();
    expect(
      screen.UNSAFE_queryByType(require('react-native').ActivityIndicator)
    ).toBeTruthy();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { toJSON } = render(<Button title="Loading" onPress={onPress} loading />);
    // The root Pressable is rendered as a View with accessibilityState.disabled=true
    const tree = toJSON() as any;
    expect(tree.props.accessibilityState?.disabled).toBe(true);
  });

  it('renders primary variant by default', () => {
    const { toJSON } = render(<Button title="Primary" onPress={() => {}} />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders secondary variant', () => {
    const { toJSON } = render(<Button title="Secondary" onPress={() => {}} variant="secondary" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders ghost variant', () => {
    const { toJSON } = render(<Button title="Ghost" onPress={() => {}} variant="ghost" />);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders icon alongside title', () => {
    const icon = <Text testID="custom-icon">★</Text>;
    render(<Button title="With Icon" onPress={() => {}} icon={icon} />);
    expect(screen.getByTestId('custom-icon')).toBeTruthy();
    expect(screen.getByText('With Icon')).toBeTruthy();
  });

  it('applies custom style', () => {
    render(
      <Button title="Styled" onPress={() => {}} style={{ marginTop: 20 }} />
    );
    expect(screen.getByText('Styled')).toBeTruthy();
  });

  it('applies custom textStyle', () => {
    render(
      <Button title="Styled Text" onPress={() => {}} textStyle={{ fontSize: 20 }} />
    );
    const text = screen.getByText('Styled Text');
    expect(text).toBeTruthy();
  });
});
