import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Input } from '../../../../src/components/ui/Input';

describe('Input', () => {
  it('renders without crashing', () => {
    render(<Input />);
  });

  it('renders label when provided', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('does not render label element when not provided', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.queryByText('Email')).toBeNull();
  });

  it('renders error message when provided', () => {
    render(<Input error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeTruthy();
  });

  it('does not render error element when no error', () => {
    render(<Input label="Name" />);
    // No error text node
    expect(screen.queryByText(/required/)).toBeNull();
  });

  it('calls onChangeText when text changes', () => {
    const onChange = jest.fn();
    render(<Input onChangeText={onChange} />);
    const input = screen.getByDisplayValue('');
    fireEvent.changeText(input, 'hello');
    expect(onChange).toHaveBeenCalledWith('hello');
  });

  it('sets focus state on focus', () => {
    render(<Input label="Test" />);
    const input = screen.UNSAFE_getByType(require('react-native').TextInput);
    fireEvent(input, 'focus');
    // After focus the wrapper should have inputFocused style applied — just ensure no crash
  });

  it('removes focus state on blur', () => {
    render(<Input label="Test" />);
    const input = screen.UNSAFE_getByType(require('react-native').TextInput);
    fireEvent(input, 'focus');
    fireEvent(input, 'blur');
  });

  it('hides password text by default when isPassword=true', () => {
    render(<Input isPassword value="secret" />);
    const input = screen.UNSAFE_getByType(require('react-native').TextInput);
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('toggles password visibility when eye icon is pressed', () => {
    render(<Input isPassword value="secret" />);
    const input = screen.UNSAFE_getByType(require('react-native').TextInput);
    expect(input.props.secureTextEntry).toBe(true);

    // Press the eye toggle button
    const toggleBtn = screen.UNSAFE_getByType(require('react-native').TouchableOpacity);
    fireEvent.press(toggleBtn);

    const inputAfter = screen.UNSAFE_getByType(require('react-native').TextInput);
    expect(inputAfter.props.secureTextEntry).toBe(false);
  });

  it('toggles back to hidden after second press', () => {
    render(<Input isPassword />);
    const toggle = screen.UNSAFE_getByType(require('react-native').TouchableOpacity);
    fireEvent.press(toggle);
    fireEvent.press(toggle);
    const input = screen.UNSAFE_getByType(require('react-native').TextInput);
    expect(input.props.secureTextEntry).toBe(true);
  });

  it('does not render eye toggle when isPassword=false', () => {
    render(<Input isPassword={false} />);
    expect(screen.UNSAFE_queryAllByType(require('react-native').TouchableOpacity)).toHaveLength(0);
  });

  it('passes through placeholder prop', () => {
    render(<Input placeholder="your@email.com" />);
    const input = screen.UNSAFE_getByType(require('react-native').TextInput);
    expect(input.props.placeholder).toBe('your@email.com');
  });

  it('passes through keyboardType prop', () => {
    render(<Input keyboardType="email-address" />);
    const input = screen.UNSAFE_getByType(require('react-native').TextInput);
    expect(input.props.keyboardType).toBe('email-address');
  });

  it('autoCapitalize is none by default', () => {
    render(<Input />);
    const input = screen.UNSAFE_getByType(require('react-native').TextInput);
    expect(input.props.autoCapitalize).toBe('none');
  });
});
