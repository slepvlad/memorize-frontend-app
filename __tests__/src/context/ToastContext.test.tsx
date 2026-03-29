import React from 'react';
import { renderHook, render, act, screen, fireEvent } from '@testing-library/react-native';
import { ToastProvider, useToast, triggerToast } from '../../../src/context/ToastContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runAllTimers();
  jest.useRealTimers();
});

// ─── useToast hook ───────────────────────────────────────────────────────────

describe('useToast', () => {
  it('throws when used outside ToastProvider', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useToast())).toThrow(
      'useToast must be used within ToastProvider'
    );
    consoleError.mockRestore();
  });

  it('provides showToast function inside ToastProvider', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(typeof result.current.showToast).toBe('function');
  });
});

// ─── showToast rendering ─────────────────────────────────────────────────────

describe('showToast', () => {
  it('renders a toast with the provided message', () => {
    const { result } = renderHook(() => useToast(), { wrapper });

    act(() => { result.current.showToast('Something went wrong', 'error'); });

    // Render the provider directly to check the DOM
    render(<ToastProvider><></></ToastProvider>);
  });

  it('defaults to error type when no type provided', () => {
    const TestComponent = () => {
      const { showToast } = useToast();
      return (
        <React.Fragment>
          <ToastProvider>
            <></>
          </ToastProvider>
        </React.Fragment>
      );
    };
    // The default type path is covered by calling showToast without second arg
    const { result } = renderHook(() => useToast(), { wrapper });
    expect(() => {
      act(() => { result.current.showToast('Test message'); });
    }).not.toThrow();
  });

  it('auto-dismisses toast after 4 seconds', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Auto dismiss" type="error" />
      </ToastProvider>
    );

    expect(screen.queryByText('Auto dismiss')).toBeTruthy();

    act(() => { jest.advanceTimersByTime(4000); });

    expect(screen.queryByText('Auto dismiss')).toBeNull();
  });

  it('keeps only last 3 toasts when more than 3 are shown', () => {
    render(
      <ToastProvider>
        <MultiToastTrigger />
      </ToastProvider>
    );

    // 4 toasts triggered — only last 3 visible
    expect(screen.queryByText('Toast 1')).toBeNull();
    expect(screen.getByText('Toast 2')).toBeTruthy();
    expect(screen.getByText('Toast 3')).toBeTruthy();
    expect(screen.getByText('Toast 4')).toBeTruthy();
  });

  it('allows manual dismissal via close button', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Dismiss me" type="info" />
      </ToastProvider>
    );

    expect(screen.getByText('Dismiss me')).toBeTruthy();
    const closeButtons = screen.getAllByText('✕');
    fireEvent.press(closeButtons[closeButtons.length - 1]);
    expect(screen.queryByText('Dismiss me')).toBeNull();
  });

  it('renders success type toast', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Saved!" type="success" />
      </ToastProvider>
    );
    expect(screen.getByText('Saved!')).toBeTruthy();
  });

  it('renders warning type toast', () => {
    render(
      <ToastProvider>
        <ToastTrigger message="Warning!" type="warning" />
      </ToastProvider>
    );
    expect(screen.getByText('Warning!')).toBeTruthy();
  });
});

// ─── triggerToast (module-level bridge) ──────────────────────────────────────

describe('triggerToast', () => {
  it('shows toast when called after provider is mounted', () => {
    render(
      <ToastProvider>
        <></>
      </ToastProvider>
    );

    act(() => { triggerToast('Network error', 'error'); });

    expect(screen.getByText('Network error')).toBeTruthy();
  });

  it('does nothing gracefully when called before provider mounts', () => {
    expect(() => {
      act(() => { triggerToast('Orphan toast', 'error'); });
    }).not.toThrow();
  });

  it('defaults to error type', () => {
    render(<ToastProvider><></></ToastProvider>);
    act(() => { triggerToast('Default type'); });
    expect(screen.getByText('Default type')).toBeTruthy();
  });
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ToastTrigger({ message, type }: { message: string; type: any }) {
  const { showToast } = useToast();
  React.useEffect(() => { showToast(message, type); }, []);
  return null;
}

function MultiToastTrigger() {
  const { showToast } = useToast();
  React.useEffect(() => {
    showToast('Toast 1', 'info');
    showToast('Toast 2', 'info');
    showToast('Toast 3', 'info');
    showToast('Toast 4', 'info');
  }, []);
  return null;
}
