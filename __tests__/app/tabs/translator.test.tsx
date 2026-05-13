import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import TranslatorScreen from '../../../app/(tabs)/translator';
import { phrasesApi } from '../../../src/api/phrases';
import { useLanguage } from '../../../src/context/LanguageContext';

jest.mock('../../../src/api/phrases', () => ({
  phrasesApi: { lookup: jest.fn() },
  LANGUAGE_TO_API: { en: 'ENGLISH', ru: 'RUSSIAN' },
}));

jest.mock('../../../src/context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

const mockLookup = phrasesApi.lookup as jest.Mock;
const mockUseLanguage = useLanguage as jest.Mock;

const fakeResult = {
  originalWord: 'ephemeral',
  originalLanguage: 'ENGLISH' as const,
  translatedWord: 'эфемерный',
  translatedLanguage: 'RUSSIAN' as const,
  audioId: 'c1f2e3d4-0000-0000-0000-000000000001',
  examples: [
    { original: 'The ephemeral beauty of a sunset.', translation: 'Эфемерная красота заката.' },
    { original: 'Fame can be ephemeral.', translation: 'Слава может быть мимолётной.' },
  ],
};

const configuredLanguage = {
  nativeLanguage: 'ru',
  studiedLanguage: 'en',
  isConfigured: true,
  isInitializing: false,
  setLanguages: jest.fn(),
  clearLanguages: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLanguage.mockReturnValue(configuredLanguage);
  mockLookup.mockResolvedValue(fakeResult);
  jest.spyOn(Alert, 'alert');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('TranslatorScreen — initial render', () => {
  it('renders the header title', () => {
    render(<TranslatorScreen />);
    expect(screen.getByText('Translator')).toBeTruthy();
  });

  it('renders the phrase input', () => {
    render(<TranslatorScreen />);
    expect(screen.getByLabelText('Phrase input')).toBeTruthy();
  });

  it('renders the translate button', () => {
    render(<TranslatorScreen />);
    expect(screen.getByLabelText('Translate')).toBeTruthy();
  });

  it('shows the empty-state prompt', () => {
    render(<TranslatorScreen />);
    expect(screen.getByText('Translate a phrase')).toBeTruthy();
  });

  it('translate button is disabled when input is empty', () => {
    render(<TranslatorScreen />);
    const btn = screen.getByLabelText('Translate');
    expect(btn.props.accessibilityState?.disabled ?? btn.props.disabled).toBeTruthy();
  });
});

describe('TranslatorScreen — languages not configured', () => {
  it('shows not-configured message when isConfigured is false', () => {
    mockUseLanguage.mockReturnValue({ ...configuredLanguage, isConfigured: false });
    render(<TranslatorScreen />);
    expect(screen.getByText('Languages not configured')).toBeTruthy();
  });

  it('shows not-configured message when nativeLanguage is null', () => {
    mockUseLanguage.mockReturnValue({ ...configuredLanguage, nativeLanguage: null });
    render(<TranslatorScreen />);
    expect(screen.getByText('Languages not configured')).toBeTruthy();
  });

  it('shows not-configured message when studiedLanguage is null', () => {
    mockUseLanguage.mockReturnValue({ ...configuredLanguage, studiedLanguage: null });
    render(<TranslatorScreen />);
    expect(screen.getByText('Languages not configured')).toBeTruthy();
  });

  it('does not render the search input when not configured', () => {
    mockUseLanguage.mockReturnValue({ ...configuredLanguage, isConfigured: false });
    render(<TranslatorScreen />);
    expect(screen.queryByLabelText('Phrase input')).toBeNull();
  });
});

describe('TranslatorScreen — lookup flow', () => {
  it('calls phrasesApi.lookup with trimmed phrase and mapped languages', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), '  ephemeral  ');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Translate'));
    });
    await waitFor(() => {
      expect(mockLookup).toHaveBeenCalledWith('ephemeral', 'ENGLISH', 'RUSSIAN');
    });
  });

  it('shows translated word after successful lookup', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Translate'));
    });
    await waitFor(() => {
      expect(screen.getByText('эфемерный')).toBeTruthy();
    });
  });

  it('shows original word after successful lookup', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Translate'));
    });
    await waitFor(() => {
      expect(screen.getByText('ephemeral')).toBeTruthy();
    });
  });

  it('shows examples after successful lookup', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Translate'));
    });
    await waitFor(() => {
      expect(screen.getByText('The ephemeral beauty of a sunset.')).toBeTruthy();
      expect(screen.getByText('Эфемерная красота заката.')).toBeTruthy();
      expect(screen.getByText('Fame can be ephemeral.')).toBeTruthy();
    });
  });

  it('shows the Examples heading when examples are present', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Translate'));
    });
    await waitFor(() => {
      expect(screen.getByText('Examples')).toBeTruthy();
    });
  });

  it('does not show examples section when examples array is empty', async () => {
    mockLookup.mockResolvedValueOnce({ ...fakeResult, examples: [] });
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Translate'));
    });
    await waitFor(() => {
      expect(screen.getByText('эфемерный')).toBeTruthy();
    });
    expect(screen.queryByText('Examples')).toBeNull();
  });

  it('hides empty state after receiving results', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Translate'));
    });
    await waitFor(() => {
      expect(screen.queryByText('Translate a phrase')).toBeNull();
    });
  });

  it('clears previous result when a new lookup starts', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Translate'));
    });
    await waitFor(() => expect(screen.getByText('эфемерный')).toBeTruthy());

    mockLookup.mockResolvedValueOnce({ ...fakeResult, translatedWord: 'мимолётный' });
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'fleeting');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Translate'));
    });
    await waitFor(() => expect(screen.getByText('мимолётный')).toBeTruthy());
    expect(screen.queryByText('эфемерный')).toBeNull();
  });

  it('does not call lookup when input is whitespace only', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), '   ');
    fireEvent.press(screen.getByLabelText('Translate'));
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it('silently ignores API errors (handled by global toast)', async () => {
    mockLookup.mockRejectedValueOnce(new Error('Server error'));
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Translate'));
    });
    await waitFor(() => {
      expect(screen.queryByText('эфемерный')).toBeNull();
    });
  });
});

describe('TranslatorScreen — stub actions', () => {
  const renderWithResult = async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Translate'));
    });
    await waitFor(() => expect(screen.getByText('эфемерный')).toBeTruthy());
  };

  it('shows "Play audio" button after lookup', async () => {
    await renderWithResult();
    expect(screen.getByLabelText('Play audio')).toBeTruthy();
  });

  it('shows "Save for study" button after lookup', async () => {
    await renderWithResult();
    expect(screen.getByLabelText('Save for study')).toBeTruthy();
  });

  it('play audio button shows coming-soon alert', async () => {
    await renderWithResult();
    fireEvent.press(screen.getByLabelText('Play audio'));
    expect(Alert.alert).toHaveBeenCalledWith('Coming soon', expect.stringContaining('Audio'));
  });

  it('save button shows coming-soon alert', async () => {
    await renderWithResult();
    fireEvent.press(screen.getByLabelText('Save for study'));
    expect(Alert.alert).toHaveBeenCalledWith('Coming soon', expect.any(String));
  });
});

describe('TranslatorScreen — keyboard submit', () => {
  it('triggers lookup on keyboard submit', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => {
      fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing');
    });
    await waitFor(() => {
      expect(mockLookup).toHaveBeenCalledWith('ephemeral', 'ENGLISH', 'RUSSIAN');
    });
  });
});
