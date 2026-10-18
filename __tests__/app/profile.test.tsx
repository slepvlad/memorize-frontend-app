import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import ProfileScreen from '../../app/profile';
import { usersApi } from '../../src/api/users';
import { ProfileProvider } from '../../src/context/ProfileContext';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

jest.mock('../../src/api/users', () => ({
  usersApi: {
    getMe: jest.fn(),
    getAvatar: jest.fn(),
    uploadAvatar: jest.fn(),
    deleteAvatar: jest.fn(),
    changePassword: jest.fn(),
    changeEmail: jest.fn(),
  },
}));

const mockLogout = jest.fn();
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ logout: mockLogout, isAuthenticated: true }),
}));

const mockShowToast = jest.fn();
jest.mock('../../src/context/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

jest.mock('../../src/context/LanguageContext', () => ({
  useLanguage: () => ({ nativeLanguage: 'ru', studiedLanguage: 'en' }),
  SUPPORTED_LANGUAGES: [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  ],
}));

const { _mockRouter } = require('expo-router');
const mockGetMe = usersApi.getMe as jest.Mock;
const mockGetAvatar = usersApi.getAvatar as jest.Mock;
const mockUpload = usersApi.uploadAvatar as jest.Mock;
const mockDeleteAvatar = usersApi.deleteAvatar as jest.Mock;
const mockChangePassword = usersApi.changePassword as jest.Mock;
const mockChangeEmail = usersApi.changeEmail as jest.Mock;
const mockRequestPermission = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;

const renderProfile = () =>
  render(
    <ProfileProvider>
      <ProfileScreen />
    </ProfileProvider>
  );

const profile = { id: 'u1', email: 'me@test.com' };
const AVATAR = 'data:image/png;base64,aGk=';

const renderLoaded = async () => {
  renderProfile();
  await waitFor(() => screen.getByText('me@test.com'));
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetMe.mockResolvedValue(profile);
  mockGetAvatar.mockResolvedValue(null);
});

describe('ProfileScreen — rendering', () => {
  it('shows a loader, then email and initial', async () => {
    renderProfile();
    expect(screen.getByTestId('profile-loading')).toBeTruthy();
    await waitFor(() => screen.getByText('me@test.com'));
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.queryByText('Remove photo')).toBeNull();
  });

  it('shows avatar image and remove action when user has avatar', async () => {
    mockGetAvatar.mockResolvedValue(AVATAR);
    await renderLoaded();
    expect(screen.getByTestId('avatar-image').props.source).toEqual({ uri: AVATAR });
    expect(screen.getByText('Remove photo')).toBeTruthy();
  });

  it('falls back to the placeholder when the avatar fails to load', async () => {
    mockGetAvatar.mockRejectedValue(new Error('fail'));
    await renderLoaded();
    expect(screen.getByText('M')).toBeTruthy();
    expect(screen.queryByTestId('avatar-image')).toBeNull();
  });

  it('still renders when profile fails to load', async () => {
    mockGetMe.mockRejectedValue(new Error('fail'));
    renderProfile();
    await waitFor(() => screen.getByText('Account'));
    expect(screen.getByText('?')).toBeTruthy();
  });

  it('shows language pair and opens language setup', async () => {
    await renderLoaded();
    expect(screen.getByText('🇷🇺 → 🇬🇧')).toBeTruthy();
    fireEvent.press(screen.getByText('Study languages'));
    expect(_mockRouter.push).toHaveBeenCalledWith('/(onboarding)/language-setup');
  });

  it('goes back and logs out', async () => {
    await renderLoaded();
    fireEvent.press(screen.getByTestId('back-button'));
    expect(_mockRouter.back).toHaveBeenCalled();
    fireEvent.press(screen.getByText('Log out'));
    expect(mockLogout).toHaveBeenCalled();
  });
});

describe('ProfileScreen — avatar', () => {
  it('warns when photo permission is denied', async () => {
    mockRequestPermission.mockResolvedValue({ granted: false });
    await renderLoaded();
    fireEvent.press(screen.getByTestId('avatar-button'));
    await waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith('Allow photo access in Settings to change your avatar.', 'warning')
    );
    expect(mockLaunchLibrary).not.toHaveBeenCalled();
  });

  it('does nothing when picker is cancelled', async () => {
    mockRequestPermission.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: null });
    await renderLoaded();
    fireEvent.press(screen.getByTestId('avatar-button'));
    await waitFor(() => expect(mockLaunchLibrary).toHaveBeenCalled());
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('uploads picked image and shows it', async () => {
    const asset = { uri: 'file:///a.jpg', mimeType: 'image/jpeg', fileName: 'a.jpg' };
    mockRequestPermission.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [asset] });
    mockUpload.mockResolvedValue(undefined);
    await renderLoaded();
    mockGetAvatar.mockResolvedValue(AVATAR);

    fireEvent.press(screen.getByTestId('avatar-button'));

    await waitFor(() => expect(screen.getByTestId('avatar-image').props.source).toEqual({ uri: AVATAR }));
    expect(mockUpload).toHaveBeenCalledWith(asset);
    expect(mockShowToast).toHaveBeenCalledWith('Profile photo updated', 'success');
  });

  it('shows the picked image when refetching the avatar fails', async () => {
    const asset = { uri: 'file:///a.jpg' };
    mockRequestPermission.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [asset] });
    mockUpload.mockResolvedValue(undefined);
    await renderLoaded();
    mockGetAvatar.mockRejectedValue(new Error('fail'));

    fireEvent.press(screen.getByTestId('avatar-button'));

    await waitFor(() => expect(screen.getByTestId('avatar-image').props.source).toEqual({ uri: asset.uri }));
  });

  it('keeps placeholder when upload fails', async () => {
    mockRequestPermission.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///a.jpg' }] });
    mockUpload.mockRejectedValue(new Error('fail'));
    await renderLoaded();

    fireEvent.press(screen.getByTestId('avatar-button'));

    await waitFor(() => expect(mockUpload).toHaveBeenCalled());
    expect(screen.queryByTestId('avatar-image')).toBeNull();
    expect(mockShowToast).not.toHaveBeenCalledWith('Profile photo updated', 'success');
  });

  it('removes the avatar', async () => {
    mockGetAvatar.mockResolvedValue(AVATAR);
    mockDeleteAvatar.mockResolvedValue(undefined);
    await renderLoaded();

    fireEvent.press(screen.getByText('Remove photo'));

    await waitFor(() => expect(screen.queryByTestId('avatar-image')).toBeNull());
    expect(mockShowToast).toHaveBeenCalledWith('Profile photo removed', 'success');
  });

  it('keeps the avatar when removal fails', async () => {
    mockGetAvatar.mockResolvedValue(AVATAR);
    mockDeleteAvatar.mockRejectedValue(new Error('fail'));
    await renderLoaded();

    fireEvent.press(screen.getByText('Remove photo'));

    await waitFor(() => expect(mockDeleteAvatar).toHaveBeenCalled());
    expect(screen.getByTestId('avatar-image')).toBeTruthy();
  });
});

describe('ProfileScreen — change email', () => {
  const openForm = async () => {
    await renderLoaded();
    fireEvent.press(screen.getByText('Change email'));
  };

  it('toggles the form open and closed', async () => {
    await openForm();
    expect(screen.getByTestId('new-email-input')).toBeTruthy();
    fireEvent.press(screen.getByText('Change email'));
    expect(screen.queryByTestId('new-email-input')).toBeNull();
  });

  it('validates required fields', async () => {
    await openForm();
    fireEvent.press(screen.getByText('Save'));
    expect(screen.getByText('Email is required')).toBeTruthy();
    expect(screen.getByText('Password is required')).toBeTruthy();
    expect(mockChangeEmail).not.toHaveBeenCalled();
  });

  it('rejects invalid and unchanged emails', async () => {
    await openForm();
    fireEvent.changeText(screen.getByTestId('new-email-input'), 'nope');
    fireEvent.press(screen.getByText('Save'));
    expect(screen.getByText('Please enter a valid email')).toBeTruthy();

    fireEvent.changeText(screen.getByTestId('new-email-input'), 'ME@test.com');
    fireEvent.press(screen.getByText('Save'));
    expect(screen.getByText('This is already your email')).toBeTruthy();
    expect(mockChangeEmail).not.toHaveBeenCalled();
  });

  it('submits and closes the form on success', async () => {
    mockChangeEmail.mockResolvedValue({ message: 'ok' });
    await openForm();
    fireEvent.changeText(screen.getByTestId('new-email-input'), ' new@test.com ');
    fireEvent.changeText(screen.getByTestId('email-current-password-input'), 'secret');
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => expect(screen.queryByTestId('new-email-input')).toBeNull());
    expect(mockChangeEmail).toHaveBeenCalledWith({ newEmail: 'new@test.com', currentPassword: 'secret' });
    expect(mockShowToast).toHaveBeenCalledWith('Check your new inbox to confirm the change', 'success');
  });

  it('keeps the form open on failure', async () => {
    mockChangeEmail.mockRejectedValue(new Error('fail'));
    await openForm();
    fireEvent.changeText(screen.getByTestId('new-email-input'), 'new@test.com');
    fireEvent.changeText(screen.getByTestId('email-current-password-input'), 'secret');
    fireEvent.press(screen.getByText('Save'));

    await waitFor(() => expect(mockChangeEmail).toHaveBeenCalled());
    expect(screen.getByTestId('new-email-input')).toBeTruthy();
  });
});

describe('ProfileScreen — change password', () => {
  const openForm = async () => {
    await renderLoaded();
    fireEvent.press(screen.getByText('Change password'));
  };
  const fill = (current: string, next: string, confirm: string) => {
    fireEvent.changeText(screen.getByTestId('current-password-input'), current);
    fireEvent.changeText(screen.getByTestId('new-password-input'), next);
    fireEvent.changeText(screen.getByTestId('confirm-password-input'), confirm);
    fireEvent.press(screen.getByText('Save'));
  };

  it('opening password form closes the email form', async () => {
    await renderLoaded();
    fireEvent.press(screen.getByText('Change email'));
    fireEvent.press(screen.getByText('Change password'));
    expect(screen.queryByTestId('new-email-input')).toBeNull();
    expect(screen.getByTestId('new-password-input')).toBeTruthy();
  });

  it('validates required fields', async () => {
    await openForm();
    fireEvent.press(screen.getByText('Save'));
    expect(screen.getAllByText('Password is required')).toHaveLength(2);
    expect(screen.getByText('Please confirm your password')).toBeTruthy();
  });

  it('validates length, sameness and confirmation', async () => {
    await openForm();
    fill('old123', '123', '123');
    expect(screen.getByText('Password must be at least 6 characters')).toBeTruthy();

    fill('old123', 'old123', 'old123');
    expect(screen.getByText('New password must differ from the current one')).toBeTruthy();

    fill('old123', 'new123', 'other1');
    expect(screen.getByText('Passwords do not match')).toBeTruthy();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it('submits and closes the form on success', async () => {
    mockChangePassword.mockResolvedValue({ message: 'ok' });
    await openForm();
    fill('old123', 'new123', 'new123');

    await waitFor(() => expect(screen.queryByTestId('new-password-input')).toBeNull());
    expect(mockChangePassword).toHaveBeenCalledWith({ currentPassword: 'old123', newPassword: 'new123' });
    expect(mockShowToast).toHaveBeenCalledWith('Password changed', 'success');
  });

  it('keeps the form open on failure', async () => {
    mockChangePassword.mockRejectedValue(new Error('fail'));
    await openForm();
    fill('old123', 'new123', 'new123');

    await waitFor(() => expect(mockChangePassword).toHaveBeenCalled());
    expect(screen.getByTestId('new-password-input')).toBeTruthy();
  });
});
