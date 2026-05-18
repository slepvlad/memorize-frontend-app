import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import TranslatorScreen from '../../../app/(tabs)/translator';
import { phrasesApi } from '../../../src/api/phrases';
import { useLanguage } from '../../../src/context/LanguageContext';
import { _mockRouter } from 'expo-router';

jest.mock('@react-navigation/bottom-tabs', () => ({
  useBottomTabBarHeight: () => 85,
}));

jest.mock('../../../src/api/phrases', () => ({
  phrasesApi: { lookup: jest.fn(), save: jest.fn() },
  LANGUAGE_TO_API: { en: 'ENGLISH', ru: 'RUSSIAN' },
}));

jest.mock('../../../src/context/LanguageContext', () => ({
  useLanguage: jest.fn(),
  SUPPORTED_LANGUAGES: [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  ],
}));

const mockLookup = phrasesApi.lookup as jest.Mock;
const mockSave = phrasesApi.save as jest.Mock;
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
  mockSave.mockResolvedValue({ id: 'saved-phrase-id' });
  jest.spyOn(Alert, 'alert');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('TranslatorScreen — language bar', () => {
  it('shows source language name', () => {
    render(<TranslatorScreen />);
    expect(screen.getByText('English')).toBeTruthy();
  });

  it('shows target language name', () => {
    render(<TranslatorScreen />);
    expect(screen.getByText('Russian')).toBeTruthy();
  });

  it('renders swap button', () => {
    render(<TranslatorScreen />);
    expect(screen.getByLabelText('Swap languages')).toBeTruthy();
  });

  it('swapping clears query and result, and flips languages', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => expect(screen.getByText('эфемерный')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Swap languages'));

    expect(screen.queryByText('эфемерный')).toBeNull();
    expect(screen.getByLabelText('Phrase input').props.value).toBe('');
    expect(screen.getByText('Russian')).toBeTruthy();
    expect(screen.getByText('English')).toBeTruthy();
  });

  it('lookup after swap sends flipped language params', async () => {
    render(<TranslatorScreen />);
    fireEvent.press(screen.getByLabelText('Swap languages'));
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'эфемерный');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => {
      expect(mockLookup).toHaveBeenCalledWith('эфемерный', 'RUSSIAN', 'ENGLISH');
    });
  });
});

describe('TranslatorScreen — home navigation', () => {
  it('renders the Home back button', () => {
    render(<TranslatorScreen />);
    expect(screen.getByLabelText('Go to Home')).toBeTruthy();
  });

  it('pressing Home navigates to /', () => {
    render(<TranslatorScreen />);
    fireEvent.press(screen.getByLabelText('Go to Home'));
    expect(_mockRouter.navigate).toHaveBeenCalledWith('/');
  });
});

describe('TranslatorScreen — initial render', () => {
  it('renders the phrase input', () => {
    render(<TranslatorScreen />);
    expect(screen.getByLabelText('Phrase input')).toBeTruthy();
  });

  it('shows the hint text', () => {
    render(<TranslatorScreen />);
    expect(screen.getByText('Enter a word or phrase to see its translation')).toBeTruthy();
  });

  it('does not show clear search button before any lookup', () => {
    render(<TranslatorScreen />);
    expect(screen.queryByLabelText('Clear search')).toBeNull();
  });

  it('does not show clear search button when result exists but query is empty', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => expect(screen.getByText('эфемерный')).toBeTruthy());

    fireEvent.changeText(screen.getByLabelText('Phrase input'), '');
    expect(screen.queryByLabelText('Clear search')).toBeNull();
  });

  it('shows clear search button in header when result exists and input has text', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => expect(screen.getByText('эфемерный')).toBeTruthy());

    expect(screen.getByLabelText('Clear search')).toBeTruthy();
  });

  it('clear search button resets query and result', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => expect(screen.getByText('эфемерный')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Clear search'));

    expect(screen.getByLabelText('Phrase input').props.value).toBe('');
    expect(screen.queryByText('эфемерный')).toBeNull();
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
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => {
      expect(mockLookup).toHaveBeenCalledWith('ephemeral', 'ENGLISH', 'RUSSIAN');
    });
  });

  it('shows translated word after successful lookup', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => {
      expect(screen.getByText('эфемерный')).toBeTruthy();
    });
  });

  it('shows examples after successful lookup', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => {
      expect(screen.getByText('The ephemeral beauty of a sunset.')).toBeTruthy();
      expect(screen.getByText('Эфемерная красота заката.')).toBeTruthy();
    });
  });

  it('shows examples title when examples are present', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => expect(screen.getByText('Examples')).toBeTruthy());
  });

  it('does not show examples section when examples array is empty', async () => {
    mockLookup.mockResolvedValueOnce({ ...fakeResult, examples: [] });
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => expect(screen.getByText('эфемерный')).toBeTruthy());
    expect(screen.queryByText('Examples')).toBeNull();
  });

  it('hides hint text after receiving results', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => {
      expect(screen.queryByText('Enter a word or phrase to see its translation')).toBeNull();
    });
  });

  it('clears previous result when a new lookup starts', async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => expect(screen.getByText('эфемерный')).toBeTruthy());

    mockLookup.mockResolvedValueOnce({ ...fakeResult, translatedWord: 'мимолётный' });
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'fleeting');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => expect(screen.getByText('мимолётный')).toBeTruthy());
    expect(screen.queryByText('эфемерный')).toBeNull();
  });

  it('does not call lookup when input is whitespace only', () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), '   ');
    fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing');
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it('silently ignores API errors', async () => {
    mockLookup.mockRejectedValueOnce(new Error('Server error'));
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => {
      expect(screen.queryByText('эфемерный')).toBeNull();
    });
  });


});

describe('TranslatorScreen — stub actions', () => {
  const renderWithResult = async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => expect(screen.getByText('эфемерный')).toBeTruthy());
  };

  it('shows play audio button (translation) after lookup', async () => {
    await renderWithResult();
    expect(screen.getByLabelText('Play audio')).toBeTruthy();
  });

  it('shows play original audio button after lookup', async () => {
    await renderWithResult();
    expect(screen.getByLabelText('Play original audio')).toBeTruthy();
  });

  it('does not show play original audio button before lookup', () => {
    render(<TranslatorScreen />);
    expect(screen.queryByLabelText('Play original audio')).toBeNull();
  });

  it('shows save for study button in header after lookup', async () => {
    await renderWithResult();
    expect(screen.getByLabelText('Save for study')).toBeTruthy();
  });

  it('does not show save for study button before lookup', () => {
    render(<TranslatorScreen />);
    expect(screen.queryByLabelText('Save for study')).toBeNull();
  });

  it('play original audio button shows coming-soon alert', async () => {
    await renderWithResult();
    fireEvent.press(screen.getByLabelText('Play original audio'));
    expect(Alert.alert).toHaveBeenCalledWith('Coming soon', expect.stringContaining('Audio'));
  });

  it('play audio button shows coming-soon alert', async () => {
    await renderWithResult();
    fireEvent.press(screen.getByLabelText('Play audio'));
    expect(Alert.alert).toHaveBeenCalledWith('Coming soon', expect.stringContaining('Audio'));
  });

});

describe('TranslatorScreen — save phrase', () => {
  const renderWithResult = async () => {
    render(<TranslatorScreen />);
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'ephemeral');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => expect(screen.getByText('эфемерный')).toBeTruthy());
  };

  it('pressing save calls phrasesApi.save with the lookup result', async () => {
    await renderWithResult();
    await act(async () => fireEvent.press(screen.getByLabelText('Save for study')));
    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith({
        originalWord: fakeResult.originalWord,
        originalLanguage: fakeResult.originalLanguage,
        translatedWord: fakeResult.translatedWord,
        translatedLanguage: fakeResult.translatedLanguage,
        audioId: fakeResult.audioId,
        examples: fakeResult.examples,
      });
    });
  });

  it('save button cannot be pressed again after successful save', async () => {
    await renderWithResult();
    await act(async () => fireEvent.press(screen.getByLabelText('Save for study')));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    fireEvent.press(screen.getByLabelText('Save for study'));
    expect(mockSave).toHaveBeenCalledTimes(1);
  });

  it('save button remains enabled after a save error', async () => {
    mockSave.mockRejectedValueOnce(new Error('Server error'));
    await renderWithResult();
    await act(async () => fireEvent.press(screen.getByLabelText('Save for study')));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    await act(async () => fireEvent.press(screen.getByLabelText('Save for study')));
    expect(mockSave).toHaveBeenCalledTimes(2);
  });

  it('saved state resets when a new lookup is performed', async () => {
    await renderWithResult();
    await act(async () => fireEvent.press(screen.getByLabelText('Save for study')));
    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));

    mockLookup.mockResolvedValueOnce({ ...fakeResult, translatedWord: 'мимолётный' });
    fireEvent.changeText(screen.getByLabelText('Phrase input'), 'fleeting');
    await act(async () => fireEvent(screen.getByLabelText('Phrase input'), 'submitEditing'));
    await waitFor(() => expect(screen.getByText('мимолётный')).toBeTruthy());

    await act(async () => fireEvent.press(screen.getByLabelText('Save for study')));
    expect(mockSave).toHaveBeenCalledTimes(2);
  });
});
