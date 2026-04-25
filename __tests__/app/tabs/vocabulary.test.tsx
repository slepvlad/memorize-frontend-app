import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import VocabularyScreen from '../../../app/(tabs)/vocabulary';
import { wordsApi } from '../../../src/api/words';

jest.mock('../../../src/api/words', () => ({
  wordsApi: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockGetAll = wordsApi.getAll as jest.Mock;
const mockCreate = wordsApi.create as jest.Mock;
const mockUpdate = wordsApi.update as jest.Mock;
const mockDelete = wordsApi.delete as jest.Mock;

const makeWord = (
  id: string,
  term: string,
  definition = '',
  repetitions = 0
) => ({
  id,
  term,
  definition: definition || undefined,
  interval: 1,
  repetitions,
  easiness_factor: 2.5,
  next_review_date: '2026-04-09',
});

const makePage = (
  words = [
    makeWord('1', 'Ephemeral', 'Lasting for a very short time'),
    makeWord('2', 'Ubiquitous', 'Present everywhere', 2),
  ],
  extra: Partial<{ totalElements: number; last: boolean }> = {}
) => ({
  content: words,
  totalElements: extra.totalElements ?? words.length,
  totalPages: 1,
  numberOfElements: words.length,
  first: true,
  last: extra.last ?? true,
  empty: words.length === 0,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAll.mockResolvedValue(makePage());
  mockCreate.mockResolvedValue(makeWord('99', 'Serendipity', 'Happy chance'));
  mockUpdate.mockResolvedValue(makeWord('1', 'Ephemeral Updated', 'Short-lived'));
  mockDelete.mockResolvedValue(undefined);
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
    mockGetAll.mockResolvedValue(makePage([makeWord('1', 'Solo')], { totalElements: 1 }));
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getByText('1 word')).toBeTruthy());
  });

  it('renders all word terms', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => {
      expect(screen.getByText('Ephemeral')).toBeTruthy();
      expect(screen.getByText('Ubiquitous')).toBeTruthy();
    });
  });

  it('renders word definitions', async () => {
    render(<VocabularyScreen />);
    await waitFor(() =>
      expect(screen.getByText('Lasting for a very short time')).toBeTruthy()
    );
  });

  it('shows New badge for unreviewed words', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getAllByText('New').length).toBeGreaterThan(0));
  });

  it('shows Reviewed badge for reviewed words', async () => {
    render(<VocabularyScreen />);
    await waitFor(() => expect(screen.getAllByText('Reviewed').length).toBeGreaterThan(0));
  });

  it('calls wordsApi.getAll with page=0 and PAGE_SIZE=20 on mount', async () => {
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
  it('fetches next page and appends words when list end is reached', async () => {
    const firstPage = makePage(
      [makeWord('1', 'Ephemeral')],
      { totalElements: 2, last: false }
    );
    const secondPage = makePage(
      [makeWord('2', 'Ubiquitous')],
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
    mockGetAll.mockResolvedValue(makePage([makeWord('1', 'Ephemeral')], { last: true }));
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
    expect(screen.getByText('Definition')).toBeTruthy();
  });

  it('does not call create when term is empty', async () => {
    await openModal();
    fireEvent.press(screen.getByText('Save'));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('does not call create when term is only whitespace', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), '   ');
    fireEvent.press(screen.getByText('Save'));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('calls create with term only when definition is blank', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    expect(mockCreate).toHaveBeenCalledWith({ term: 'Serendipity', definition: undefined });
  });

  it('calls create with both term and definition', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    fireEvent.changeText(
      screen.getByPlaceholderText('e.g. Lasting for a very short time'),
      'Happy chance'
    );
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    expect(mockCreate).toHaveBeenCalledWith({ term: 'Serendipity', definition: 'Happy chance' });
  });

  it('trims whitespace from term before creating', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), '  Serendipity  ');
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ term: 'Serendipity' })
    );
  });

  it('prepends created word to the list', async () => {
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

  it('pre-fills term field with current word term', async () => {
    await openEditModal();
    expect(screen.getByDisplayValue('Ephemeral')).toBeTruthy();
  });

  it('pre-fills definition field with current word definition', async () => {
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
      term: 'Ephemeral Updated',
      definition: 'Short-lived',
    });
  });

  it('updates word in the list after save', async () => {
    await openEditModal();
    fireEvent.changeText(screen.getByDisplayValue('Ephemeral'), 'Ephemeral Updated');
    await act(async () => {
      fireEvent.press(screen.getByText('Save changes'));
    });
    await waitFor(() => expect(screen.getByText('Ephemeral Updated')).toBeTruthy());
  });

  it('clears definition field when definition is removed', async () => {
    await openEditModal();
    fireEvent.changeText(
      screen.getByDisplayValue('Lasting for a very short time'),
      ''
    );
    await act(async () => {
      fireEvent.press(screen.getByText('Save changes'));
    });
    expect(mockUpdate).toHaveBeenCalledWith('1', {
      term: 'Ephemeral',
      definition: undefined,
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
    );
  });

  it('calls wordsApi.delete when Delete is confirmed', async () => {
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

  it('removes deleted word from the list', async () => {
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

  it('keeps word in list when Cancel is pressed', async () => {
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
