import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import HomeScreen from '../../../app/(tabs)/index';
import { AuthProvider } from '../../../src/context/AuthContext';
import { authApi } from '../../../src/api/auth';
import { tokenStorage } from '../../../src/storage/tokenStorage';
import { wordsApi } from '../../../src/api/words';
import { phrasesApi } from '../../../src/api/phrases';

jest.mock('../../../src/api/words', () => ({
  wordsApi: { create: jest.fn() },
}));

jest.mock('../../../src/api/phrases', () => ({
  phrasesApi: { getAll: jest.fn() },
}));

const mockRefreshProfile = jest.fn();
const mockUseProfile = jest.fn();
jest.mock('../../../src/context/ProfileContext', () => ({
  useProfile: () => mockUseProfile(),
}));

jest.mock('../../../src/context/LanguageContext', () => ({
  useLanguage: jest.fn(() => ({
    nativeLanguage: 'ru',
    studiedLanguage: 'en',
    isConfigured: true,
    isInitializing: false,
    setLanguages: jest.fn(),
    clearLanguages: jest.fn(),
  })),
  SUPPORTED_LANGUAGES: [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  ],
}));
jest.mock('../../../src/api/auth', () => ({
  authApi: { login: jest.fn(), register: jest.fn(), refreshToken: jest.fn(), logout: jest.fn() },
}));
jest.mock('../../../src/storage/tokenStorage', () => ({
  tokenStorage: { getAccessToken: jest.fn(), setTokens: jest.fn(), clearTokens: jest.fn(), getRefreshToken: jest.fn() },
}));

const mockGetAll = phrasesApi.getAll as jest.Mock;
const mockCreate = wordsApi.create as jest.Mock;
const mockLogout = authApi.logout as jest.Mock;
const mockGetAccessToken = tokenStorage.getAccessToken as jest.Mock;
const mockRefreshToken = authApi.refreshToken as jest.Mock;
const { _mockRouter } = require('expo-router');

const mockWords = [
  { id: '1', originalWord: 'Ephemeral', translatedWord: 'Lasting for a very short time', originalLanguage: 'ENGLISH', translatedLanguage: 'RUSSIAN', originalAudioId: null, translatedAudioId: null, examples: [], interval: 1, repetitions: 0, easiness_factor: 2.5, next_review_date: '2026-04-09' },
  { id: '2', originalWord: 'Ubiquitous', translatedWord: 'Present everywhere', originalLanguage: 'ENGLISH', translatedLanguage: 'RUSSIAN', originalAudioId: null, translatedAudioId: null, examples: [], interval: 1, repetitions: 2, easiness_factor: 2.5, next_review_date: '2026-04-10' },
  { id: '3', originalWord: 'Resilient', translatedWord: 'Able to recover quickly', originalLanguage: 'ENGLISH', translatedLanguage: 'RUSSIAN', originalAudioId: null, translatedAudioId: null, examples: [], interval: 1, repetitions: 1, easiness_factor: 2.5, next_review_date: '2026-04-11' },
];

const mockPage = {
  content: mockWords,
  totalElements: 10,
  totalPages: 2,
  numberOfElements: 3,
  first: true,
  last: false,
  empty: false,
};

const renderScreen = () =>
  render(
    <AuthProvider>
      <HomeScreen />
    </AuthProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockGetAccessToken.mockResolvedValue('valid-token');
  mockRefreshToken.mockResolvedValue({ access_token: 'a', refresh_token: 'r' });
  mockLogout.mockResolvedValue(undefined);
  mockGetAll.mockResolvedValue(mockPage);
  mockCreate.mockResolvedValue(mockWords[0]);
  mockRefreshProfile.mockResolvedValue(undefined);
  mockUseProfile.mockReturnValue({ profile: null, avatarUri: null, refreshProfile: mockRefreshProfile });
});

describe('HomeScreen — rendering', () => {
  it('renders greeting and learner name', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Good morning')).toBeTruthy());
    expect(screen.getByText('Learner')).toBeTruthy();
  });

  it('shows — while words are loading', () => {
    mockGetAll.mockReturnValue(new Promise(() => {}));
    renderScreen();
    expect(screen.getByText('—')).toBeTruthy();
  });

  it('shows total word count from API after loading', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('10')).toBeTruthy());
  });

  it('renders Learn words and Quiz me quick actions', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Learn words')).toBeTruthy();
      expect(screen.getByText('Flashcards')).toBeTruthy();
      expect(screen.getByText('Quiz me')).toBeTruthy();
      expect(screen.getByText('Test yourself')).toBeTruthy();
    });
  });

  it('renders Recent words section header', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Recent words')).toBeTruthy());
  });

  it('shows up to 3 words from API', async () => {
    renderScreen();
    await waitFor(() => {
      expect(screen.getByText('Ephemeral')).toBeTruthy();
      expect(screen.getByText('Ubiquitous')).toBeTruthy();
      expect(screen.getByText('Resilient')).toBeTruthy();
    });
  });

  it('shows New badge for words with repetitions=0', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getAllByText('New').length).toBeGreaterThan(0));
  });

  it('shows Reviewed badge for words with repetitions>0', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getAllByText('Reviewed').length).toBeGreaterThan(0));
  });

  it('shows translations as subtitles', async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByText('Lasting for a very short time')).toBeTruthy());
  });

  it('shows empty state message when no words exist', async () => {
    mockGetAll.mockResolvedValue({ ...mockPage, content: [], totalElements: 0, empty: true });
    renderScreen();
    await waitFor(() =>
      expect(screen.getByText('No words yet. Tap "Add word" to get started.')).toBeTruthy()
    );
  });

  it('calls phrasesApi.getAll with page=0, size=5 on mount', async () => {
    renderScreen();
    await waitFor(() => expect(mockGetAll).toHaveBeenCalledWith(0, 5));
  });
});

describe('HomeScreen — pull to refresh', () => {
  it('reloads words and the profile avatar', async () => {
    renderScreen();
    await waitFor(() => screen.getByText('Ephemeral'));
    const [scrollView] = screen.UNSAFE_getAllByType(require('react-native').ScrollView);
    await act(async () => {
      await scrollView.props.refreshControl.props.onRefresh();
    });
    expect(mockGetAll).toHaveBeenCalledTimes(2);
    expect(mockRefreshProfile).toHaveBeenCalledTimes(1);
  });
});

describe('HomeScreen — navigation', () => {
  it('navigates to learn tab when Learn words is pressed', async () => {
    renderScreen();
    await waitFor(() => screen.getByText('Learn words'));
    fireEvent.press(screen.getByText('Learn words'));
    expect(_mockRouter.push).toHaveBeenCalledWith('/(tabs)/learn');
  });

  it('navigates to quiz tab when Quiz me is pressed', async () => {
    renderScreen();
    await waitFor(() => screen.getByText('Quiz me'));
    fireEvent.press(screen.getByText('Quiz me'));
    expect(_mockRouter.push).toHaveBeenCalledWith('/(tabs)/quiz');
  });
});

describe('HomeScreen — profile', () => {
  it('navigates to profile when avatar is pressed', async () => {
    renderScreen();
    await waitFor(() => screen.getByText('L'));
    fireEvent.press(screen.getByTestId('profile-avatar'));
    expect(_mockRouter.push).toHaveBeenCalledWith('/profile');
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('shows the email initial when the user has no avatar', async () => {
    mockUseProfile.mockReturnValue({ profile: { id: 'u1', email: 'vova@test.com' }, avatarUri: null, refreshProfile: mockRefreshProfile });
    renderScreen();
    await waitFor(() => screen.getByText('V'));
    expect(screen.queryByTestId('profile-avatar-image')).toBeNull();
  });

  it('shows the avatar image when the user has one', async () => {
    mockUseProfile.mockReturnValue({ profile: { id: 'u1', email: 'vova@test.com' }, avatarUri: 'data:image/png;base64,aGk=', refreshProfile: mockRefreshProfile });
    renderScreen();
    const image = await screen.findByTestId('profile-avatar-image');
    expect(image.props.source).toEqual({ uri: 'data:image/png;base64,aGk=' });
    expect(screen.queryByText('V')).toBeNull();
  });
});

describe('HomeScreen — add word modal', () => {
  const openModal = async () => {
    renderScreen();
    await waitFor(() => screen.getByText('Add word'));
    fireEvent.press(screen.getByText('Add word'));
  };

  it('opens modal with Term and Definition fields', async () => {
    await openModal();
    expect(screen.getByPlaceholderText('e.g. Ephemeral')).toBeTruthy();
    expect(screen.getByPlaceholderText('e.g. Lasting for a very short time')).toBeTruthy();
  });

  it('shows field labels Term * and Definition', async () => {
    await openModal();
    expect(screen.getByText('Term *')).toBeTruthy();
    expect(screen.getByText('Definition')).toBeTruthy();
  });

  it('Save button is disabled when term is empty', async () => {
    await openModal();
    fireEvent.press(screen.getByText('Save'));
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('creates word with term only when definition is blank', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    expect(mockCreate).toHaveBeenCalledWith({ term: 'Serendipity', definition: undefined });
  });

  it('creates word with both term and definition', async () => {
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

  it('reloads words after saving', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), 'Serendipity');
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    // Initial load + reload after save
    expect(mockGetAll).toHaveBeenCalledTimes(2);
  });

  it('trims whitespace from term before saving', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), '  Serendipity  ');
    await act(async () => {
      fireEvent.press(screen.getByText('Save'));
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ term: 'Serendipity' })
    );
  });

  it('does not save when term is only whitespace', async () => {
    await openModal();
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Ephemeral'), '   ');
    fireEvent.press(screen.getByText('Save'));
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
