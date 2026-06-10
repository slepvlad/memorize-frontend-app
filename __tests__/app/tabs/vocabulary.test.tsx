import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import VocabularyScreen from '../../../app/(tabs)/vocabulary';
import { phrasesApi } from '../../../src/api/phrases';
import { useLanguage } from '../../../src/context/LanguageContext';

jest.mock('../../../src/api/phrases', () => ({
  phrasesApi: {
    getAll: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    lookup: jest.fn(),
  },
  LANGUAGE_TO_API: { en: 'ENGLISH', ru: 'RUSSIAN' },
}));

jest.mock('../../../src/context/LanguageContext', () => ({
  useLanguage: jest.fn(),
}));

const mockGetAll = phrasesApi.getAll as jest.Mock;
const mockSave = phrasesApi.save as jest.Mock;
const mockUpdate = phrasesApi.update as jest.Mock;
const mockDelete = phrasesApi.delete as jest.Mock;
const mockLookup = phrasesApi.lookup as jest.Mock;
const mockUseLanguage = useLanguage as jest.Mock;

const makePhrase = (
  id: string,
  originalWord: string,
  translatedWord = '',
  repetitions = 0
) => ({
  id,
  originalWord,
  originalLanguage: 'ENGLISH' as const,
  translatedWord,
  translatedLanguage: 'RUSSIAN' as const,
  originalAudioId: null,
  translatedAudioId: null,
  examples: [],
  interval: 1,
  repetitions,
  easiness_factor: 2.5,
  next_review_date: '2026-04-09',
});

const makePage = (
  phrases = [
    makePhrase('1', 'Ephemeral', 'Lasting for a very short time'),
    makePhrase('2', 'Ubiquitous', 'Present everywhere', 2),
  ],
  extra: Partial<{ totalElements: number; last: boolean }> = {}
) => ({
  content: phrases,
  totalElements: extra.totalElements ?? phrases.length,
  totalPages: 1,
  numberOfElements: phrases.length,
  first: true,
  last: extra.last ?? true,
  empty: phrases.length === 0,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAll.mockResolvedValue(makePage());
  mockSave.mockResolvedValue({ id: '99' });
  mockUpdate.mockResolvedValue(makePhrase('1', 'Ephemeral Updated', 'Short-lived'));
  mockDelete.mockResolvedValue(undefined);
  mockLookup.mockResolvedValue({
    originalWord: 'serendipity',
    originalLanguage: 'ENGLISH',
    translatedWord: 'Счастливая случайность',
    translatedLanguage: 'RUSSIAN',
    originalAudioId: null,
    translatedAudioId: null,
    examples: [],
  });
  mockUseLanguage.mockReturnValue({
    nativeLanguage: 'ru',
    studiedLanguage: 'en',
    isConfigured: true,
    isInitializing: false,
    setLanguages: jest.fn(),
    clearLanguages: jest.fn(),
  });
  jest.spyOn(Alert, 'alert');
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ─── Rendering ──────────────────────────────────────────────────────────────

describe('VocabularyScreen — rendering', () => {
  it('shows activity indicator while loading', () => {
    mockGetAll.mockReturnValue(new Promise(() => {}));
    render(<VocabularyScreen />);
    const { ActivityIndicator } = require('react-native');
    expect(screen.UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('renders Vocabulary header after load', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getByText('Vocabulary')).toBeTruthy());
  });

  it('shows word count in header', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getByText('2 words')).toBeTruthy());
  });

  it('shows "1 word" for singular count', async () => {
    mockGetAll.mockResolvedValue(makePage([makePhrase('1', 'Solo')], { totalElements: 1 }));
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getByText('1 word')).toBeTruthy());
  });

  it('renders all phrase original words', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => {
      expect(screen.getByText('Ephemeral')).toBeTruthy();
      expect(screen.getByText('Ubiquitous')).toBeTruthy();
    });
  });

  it('renders phrase translations', async () => {
    render(<VocabularyScreen />);
    await waitFor(() =>
      expect(screen.getByText('Lasting for a very short time')).toBeTruthy()
    );
  });

  it('shows New badge for unreviewed phrases', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getAllByText('New').length).toBeGreaterThan(0));
  });

  it('shows Reviewed badge for reviewed phrases', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getAllByText('Reviewed').length).toBeGreaterThan(0));
  });

  it('calls phrasesApi.getAll with page=0 and PAGE_SIZE=20 on mount', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => expect(mockGetAll).toHaveBeenCalledWith(0, 20));
  });
});

// ─── Empty State ─────────────────────────────────────────────────────────────

describe('VocabularyScreen — empty state', () => {
  beforeEach(() => {
    mockGetAll.mockResolvedValue(makePage([]));
  });

  it('shows empty title', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getByText('No words yet')).toBeTruthy());
  });

  it('shows empty hint text', async () => {
    render(<VocabularyScreen />);
    await waitFor(() =>
      expect(screen.getByText('Tap the + button to add your first word.')).toBeTruthy()
    );
  });
});

// ─── Pagination ───────────────────────────────────────────────────────────────

describe('VocabularyScreen — pagination', () => {
  it('fetches next page and appends phrases when list end is reached', async () => {
    const firstPage = makePage(
      [makePhrase('1', 'Ephemeral')],
      { totalElements: 2, last: false }
    );
    const secondPage = makePage(
      [makePhrase('2', 'Ubiquitous')],
      { totalElements: 2, last: true }
    );
    mockGetAll
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getByText('Ephemeral')).toBeTruthy());

    const { FlatList } = require('react-native');
    const list = screen.UNSAFE_getByType(FlatList);
    await act(async () => {
      list.props.onEndReached?.();
    });

    await waitFor(() => {
      expect(mockGetAll).toHaveBeenCalledWith(1, 20);
      expect(screen.getByText('Ubiquitous')).toBeTruthy();
    });
  });

  it('does not fetch next page when already on last page', async () => {
    mockGetAll.mockResolvedValue(makePage([makePhrase('1', 'Ephemeral')], { last: true }));
    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));

    const { FlatList } = require('react-native');
    const list = screen.UNSAFE_getByType(FlatList);
    await act(async () => {
      list.props.onEndReached?.();
    });

    expect(mockGetAll).toHaveBeenCalledTimes(1);
  });
});

// ─── Pull to Refresh ─────────────────────────────────────────────────────────

describe('VocabularyScreen — pull to refresh', () => {
  it('calls getAll with page=0 on refresh', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));

    const { FlatList } = require('react-native');
    const list = screen.UNSAFE_getByType(FlatList);
    await act(async () => {
      list.props.refreshControl.props.onRefresh?.();
    });

    await waitFor(() => expect(mockGetAll).toHaveBeenCalledTimes(2));
    expect(mockGetAll).toHaveBeenLastCalledWith(0, 20);
  });
});

// ─── Create ───────────────────────────────────────────────────────────────────

describe('VocabularyScreen — create word', () => {
  const openModal = async () => {
    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('Vocabulary'));
    fireEvent.press(screen.getByLabelText('Add word'));
  };

  it('opens modal with Add word title', async () => {
    await openModal();
    expect(screen.getByText('Add word')).toBeTruthy();
  });

  it('shows Term * and Definition field labels', async () => {
    await openModal();
    expect(screen.getByText('Term *')).toBeTruthy();
    expect(screen.getAllByText('Definition').length).toBeGreaterThan(0);
  });

  it('does not call save when term is empty', async () => {
    await openModal();
    fireEvent.press(screen.getByText('Save'));
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('does not call save when term is only whitespace', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), '   ');
    fireEvent.press(screen.getByText('Save'));
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('calls save with originalWord and empty translatedWord when definition is blank', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    expect(mockSave).toHaveBeenCalledWith({
      originalWord: 'Serendipity',
      originalLanguage: 'ENGLISH',
      translatedWord: '',
      translatedLanguage: 'RUSSIAN',
    });
  });

  it('calls save with both originalWord and translatedWord', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    fireEvent.changeText(
      screen.getByPlaceholderText('e.g. Lasting for a very short time'),
      'Happy chance'
    );
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    expect(mockSave).toHaveBeenCalledWith({
      originalWord: 'Serendipity',
      originalLanguage: 'ENGLISH',
      translatedWord: 'Happy chance',
      translatedLanguage: 'RUSSIAN',
    });
  });

  it('trims whitespace from originalWord before saving', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), '  Serendipity  ');
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({ originalWord: 'Serendipity' })
    );
  });

  it('prepends created phrase to the list', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    await waitFor(() => expect(screen.getByText('Serendipity')).toBeTruthy());
  });

  it('closes modal after successful create', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    await waitFor(() =>
      expect(screen.queryByPlaceholderText('e.g. Ephemeral')).toBeNull()
    );
  });

  it('modal term input is empty when reopened after close', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    // Close by pressing outside / request close
    const modal = screen.UNSAFE_getByType(require('react-native').Modal);
    act(() => {
      modal.props.onRequestClose?.();
    });
    await waitFor(() =>
      expect(screen.queryByPlaceholderText('e.g. Ephemeral')).toBeNull()
    );
    // Reopen and confirm term is cleared
    fireEvent.press(screen.getByLabelText('Add word'));
    expect(screen.getByPlaceholderText('e.g. Ephemeral').props.value).toBe('');
  });
});

// ─── Edit ────────────────────────────────────────────────────────────────────

describe('VocabularyScreen — edit word', () => {
  const openEditModal = async () => {
    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    fireEvent.press(screen.getByLabelText('Edit Ephemeral'));
  };

  it('opens modal with Edit word title', async () => {
    await openEditModal();
    expect(screen.getByText('Edit word')).toBeTruthy();
  });

  it('pre-fills term field with current originalWord', async () => {
    await openEditModal();
    expect(screen.getByDisplayValue('Ephemeral')).toBeTruthy();
  });

  it('pre-fills definition field with current translatedWord', async () => {
    await openEditModal();
    expect(screen.getByDisplayValue('Lasting for a very short time')).toBeTruthy();
  });

  it('shows Save changes button text in edit mode', async () => {
    await openEditModal();
    expect(screen.getByText('Save changes')).toBeTruthy();
  });

  it('calls update with correct id and payload', async () => {
    await openEditModal();
    fireEvent.changeText(screen.getByDisplayValue('Ephemeral'), 'Ephemeral Updated');
    fireEvent.changeText(
      screen.getByDisplayValue('Lasting for a very short time'),
      'Short-lived'
    );
    await act(async () => {
      fireEvent.press(screen.getByText('Save changes'));
    });
    expect(mockUpdate).toHaveBeenCalledWith('1', {
      originalWord: 'Ephemeral Updated',
      originalLanguage: 'ENGLISH',
      translatedWord: 'Short-lived',
      translatedLanguage: 'RUSSIAN',
    });
  });

  it('updates phrase in the list after save', async () => {
    await openEditModal();
    fireEvent.changeText(screen.getByDisplayValue('Ephemeral'), 'Ephemeral Updated');
    await act(async () => {
      fireEvent.press(screen.getByText('Save changes'));
    });
    await waitFor(() => expect(screen.getByText('Ephemeral Updated')).toBeTruthy());
  });

  it('sends empty translatedWord when definition is cleared', async () => {
    await openEditModal();
    fireEvent.changeText(
      screen.getByDisplayValue('Lasting for a very short time'),
      ''
    );
    await act(async () => {
      fireEvent.press(screen.getByText('Save changes'));
    });
    expect(mockUpdate).toHaveBeenCalledWith('1', {
      originalWord: 'Ephemeral',
      originalLanguage: 'ENGLISH',
      translatedWord: '',
      translatedLanguage: 'RUSSIAN',
    });
  });

  it('closes modal after successful update', async () => {
    await openEditModal();
    await act(async () => {
      fireEvent.press(screen.getByText('Save changes'));
    });
    await waitFor(() =>
      expect(screen.queryByText('Edit word')).toBeNull()
    );
  });

  it('does not call update when term field is cleared', async () => {
    await openEditModal();
    fireEvent.changeText(screen.getByDisplayValue('Ephemeral'), '');
    fireEvent.press(screen.getByText('Save changes'));
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ─── Delete ───────────────────────────────────────────────────────────────────

describe('VocabularyScreen — delete word', () => {
  it('shows Alert.alert when delete button is pressed', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    fireEvent.press(screen.getByLabelText('Delete Ephemeral'));
    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete word',
      'Remove "Ephemeral" from your vocabulary?',
      expect.any(Array)
    ); // t('deleteWord') and t('deleteWordConfirm', { word: ... }) return the same English strings
  });

  it('calls phrasesApi.delete when Delete is confirmed', async () => {
    (Alert.alert as jest.Mock).mockImplementationOnce((_title, _msg, buttons) => {
      const deleteBtn = buttons.find((b: any) => b.text === 'Delete');
      deleteBtn?.onPress?.();
    });

    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Delete Ephemeral'));
    });

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('1'));
  });

  it('removes deleted phrase from the list', async () => {
    (Alert.alert as jest.Mock).mockImplementationOnce((_title, _msg, buttons) => {
      const deleteBtn = buttons.find((b: any) => b.text === 'Delete');
      deleteBtn?.onPress?.();
    });

    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Delete Ephemeral'));
    });

    await waitFor(() => expect(screen.queryByText('Ephemeral')).toBeNull());
  });

  it('does not call delete when Cancel is pressed', async () => {
    (Alert.alert as jest.Mock).mockImplementationOnce((_title, _msg, buttons) => {
      const cancelBtn = buttons.find((b: any) => b.text === 'Cancel');
      cancelBtn?.onPress?.();
    });

    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Delete Ephemeral'));
    });

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('keeps phrase in list when Cancel is pressed', async () => {
    (Alert.alert as jest.Mock).mockImplementationOnce((_title, _msg, buttons) => {
      const cancelBtn = buttons.find((b: any) => b.text === 'Cancel');
      cancelBtn?.onPress?.();
    });

    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Delete Ephemeral'));
    });

    expect(screen.getByText('Ephemeral')).toBeTruthy();
  });

  it('decrements word count after delete', async () => {
    (Alert.alert as jest.Mock).mockImplementationOnce((_title, _msg, buttons) => {
      const deleteBtn = buttons.find((b: any) => b.text === 'Delete');
      deleteBtn?.onPress?.();
    });

    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('2 words'));
    await act(async () => {
      fireEvent.press(screen.getByLabelText('Delete Ephemeral'));
    });

    await waitFor(() => expect(screen.getByText('1 word')).toBeTruthy());
  });
});

// ─── Definition Lookup ────────────────────────────────────────────────────────

describe('VocabularyScreen — definition lookup', () => {
  const openModal = async () => {
    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('Vocabulary'));
    fireEvent.press(screen.getByLabelText('Add word'));
  };

  // Component calls phrasesApi.lookup(term, sourceApiLang, targetApiLang)
  it('calls phrasesApi.lookup when term input loses focus', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    await waitFor(() =>
      expect(mockLookup).toHaveBeenCalledWith('Serendipity', 'ENGLISH', 'RUSSIAN')
    );
  });

  it('trims term before passing to lookup', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), '  Serendipity  ');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    await waitFor(() =>
      expect(mockLookup).toHaveBeenCalledWith('Serendipity', 'ENGLISH', 'RUSSIAN')
    );
  });

  it('prefills definition with translated text after lookup', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText('e.g. Lasting for a very short time').props.value
      ).toBe('Счастливая случайность')
    );
  });

  it('passes correct source and target languages from context to lookup', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    await waitFor(() =>
      // studiedLanguage='en' → sourceLanguage='ENGLISH', nativeLanguage='ru' → targetLanguage='RUSSIAN'
      expect(mockLookup).toHaveBeenCalledWith('Serendipity', 'ENGLISH', 'RUSSIAN')
    );
  });

  it('uses definition as-is when native and studied languages match', async () => {
    mockUseLanguage.mockReturnValue({
      nativeLanguage: 'en',
      studiedLanguage: 'en',
      isConfigured: true,
      isInitializing: false,
      setLanguages: jest.fn(),
      clearLanguages: jest.fn(),
    });
    mockLookup.mockResolvedValueOnce({
      originalWord: 'serendipity',
      originalLanguage: 'ENGLISH',
      translatedWord: 'Happy chance',
      translatedLanguage: 'ENGLISH',
      originalAudioId: null,
      translatedAudioId: null,
      examples: [],
    });
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText('e.g. Lasting for a very short time').props.value
      ).toBe('Happy chance')
    );
  });

  it('does not call lookup in edit mode', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => screen.getByText('Ephemeral'));
    fireEvent.press(screen.getByLabelText('Edit Ephemeral'));
    await act(async () => {
      fireEvent(screen.getByDisplayValue('Ephemeral'), 'blur');
    });
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it('does not call lookup when term is empty on blur', async () => {
    await openModal();
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    expect(mockLookup).not.toHaveBeenCalled();
  });

  it('does not overwrite definition user typed before blur', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    fireEvent.changeText(
      screen.getByPlaceholderText('e.g. Lasting for a very short time'),
      'My own definition'
    );
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    await waitFor(() => expect(mockLookup).toHaveBeenCalled());
    expect(
      screen.getByPlaceholderText('e.g. Lasting for a very short time').props.value
    ).toBe('My own definition');
  });

  it('silently handles lookup API failure', async () => {
    mockLookup.mockRejectedValueOnce(new Error('Not found'));
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Unknownword');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    await waitFor(() => expect(mockLookup).toHaveBeenCalled());
    expect(
      screen.getByPlaceholderText('e.g. Lasting for a very short time').props.value
    ).toBe('');
  });

  it('silently handles lookup returning no translatedWord', async () => {
    mockLookup.mockResolvedValueOnce({
      originalWord: 'unknown',
      originalLanguage: 'ENGLISH',
      translatedWord: '',
      translatedLanguage: 'RUSSIAN',
      originalAudioId: null,
      translatedAudioId: null,
      examples: [],
    });
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Unknown');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    await waitFor(() => expect(mockLookup).toHaveBeenCalled());
    expect(
      screen.getByPlaceholderText('e.g. Lasting for a very short time').props.value
    ).toBe('');
  });

  it('shows loading indicator while lookup is in progress', async () => {
    mockLookup.mockReturnValueOnce(new Promise(() => {}));
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    act(() => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    await waitFor(() =>
      expect(screen.getByText('Looking up definition…')).toBeTruthy()
    );
  });

  it('hides loading indicator after lookup completes', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    await waitFor(() =>
      expect(screen.queryByText('Looking up definition…')).toBeNull()
    );
  });

  it('prefilled definition can be edited by the user', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent(screen.getByPlaceholderText('e.g. Ephemeral'), 'blur');
    });
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText('e.g. Lasting for a very short time').props.value
      ).toBe('Счастливая случайность')
    );
    fireEvent.changeText(
      screen.getByPlaceholderText('e.g. Lasting for a very short time'),
      'Custom edited definition'
    );
    expect(
      screen.getByPlaceholderText('e.g. Lasting for a very short time').props.value
    ).toBe('Custom edited definition');
  });
});
