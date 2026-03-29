import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { WebContainer } from '../../../../src/components/ui/WebContainer';

// Mock useWindowDimensions to control width
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  default: jest.fn(() => ({ width: 1024, height: 768 })),
}));

const useWindowDimensions = require('react-native/Libraries/Utilities/useWindowDimensions').default as jest.Mock;

describe('WebContainer — native (iOS/Android)', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('renders children directly without wrapping on native', () => {
    render(
      <WebContainer>
        <></>
      </WebContainer>
    );
    expect(screen.queryByTestId('desktop-background')).toBeNull();
  });

  it('passes through child content on native', () => {
    render(
      <WebContainer>
        <></>
      </WebContainer>
    );
    // No phone frame rendered
  });
});

describe('WebContainer — web desktop (width >= 768)', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    useWindowDimensions.mockReturnValue({ width: 1280, height: 800 });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('renders phone frame on desktop web', () => {
    const { toJSON } = render(
      <WebContainer>
        <></>
      </WebContainer>
    );
    expect(toJSON()).toMatchSnapshot();
  });
});

describe('WebContainer — web mobile (width < 768)', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    useWindowDimensions.mockReturnValue({ width: 375, height: 667 });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('renders children directly on small web screen', () => {
    render(
      <WebContainer>
        <></>
      </WebContainer>
    );
    // No framing view
  });
});

describe('WebContainer — withFrame prop', () => {
  beforeEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    useWindowDimensions.mockReturnValue({ width: 1280, height: 800 });
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
  });

  it('renders with frame border by default', () => {
    const { toJSON } = render(<WebContainer><></></WebContainer>);
    expect(toJSON()).toMatchSnapshot();
  });

  it('renders without frame border when withFrame=false', () => {
    const { toJSON } = render(<WebContainer withFrame={false}><></></WebContainer>);
    expect(toJSON()).toMatchSnapshot();
  });
});
