import React from 'react';
import { Text } from 'react-native';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { ProfileProvider, useProfile } from '../../../src/context/ProfileContext';
import { usersApi } from '../../../src/api/users';
import { pendingEmailStorage } from '../../../src/storage/pendingEmailStorage';

jest.mock('../../../src/api/users', () => ({
  usersApi: {
    getMe: jest.fn(),
    getAvatar: jest.fn(),
    uploadAvatar: jest.fn(),
    deleteAvatar: jest.fn(),
    requestEmailChange: jest.fn(),
  },
}));

jest.mock('../../../src/storage/pendingEmailStorage', () => ({
  pendingEmailStorage: { get: jest.fn(), set: jest.fn(), clear: jest.fn() },
}));

let mockIsAuthenticated = true;
jest.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: mockIsAuthenticated }),
}));

const mockGetMe = usersApi.getMe as jest.Mock;
const mockGetAvatar = usersApi.getAvatar as jest.Mock;
const mockUpload = usersApi.uploadAvatar as jest.Mock;
const mockDelete = usersApi.deleteAvatar as jest.Mock;
const mockRequestEmailChange = usersApi.requestEmailChange as jest.Mock;
const mockPendingGet = pendingEmailStorage.get as jest.Mock;
const mockPendingSet = pendingEmailStorage.set as jest.Mock;
const mockPendingClear = pendingEmailStorage.clear as jest.Mock;

const AVATAR = 'data:image/png;base64,aGk=';
let ctx: ReturnType<typeof useProfile>;

function Probe() {
  ctx = useProfile();
  return (
    <>
      <Text testID="email">{ctx.profile?.email ?? 'none'}</Text>
      <Text testID="avatar">{ctx.avatarUri ?? 'none'}</Text>
      <Text testID="loading">{String(ctx.isLoading)}</Text>
      <Text testID="pending">{ctx.pendingEmail ?? 'none'}</Text>
    </>
  );
}

const renderProvider = () =>
  render(
    <ProfileProvider>
      <Probe />
    </ProfileProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockIsAuthenticated = true;
  mockGetMe.mockResolvedValue({ id: 'u1', email: 'me@test.com' });
  mockGetAvatar.mockResolvedValue(AVATAR);
  mockUpload.mockResolvedValue(undefined);
  mockDelete.mockResolvedValue(undefined);
  mockPendingGet.mockResolvedValue(null);
});

describe('ProfileContext', () => {
  it('loads profile and avatar when authenticated', async () => {
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('email')).toHaveTextContent('me@test.com');
    expect(screen.getByTestId('avatar')).toHaveTextContent(AVATAR);
  });

  it('treats a failed avatar fetch as no avatar', async () => {
    mockGetAvatar.mockRejectedValue(new Error('fail'));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('email')).toHaveTextContent('me@test.com'));
    expect(screen.getByTestId('avatar')).toHaveTextContent('none');
  });

  it('stops loading when the profile request fails', async () => {
    mockGetMe.mockRejectedValue(new Error('fail'));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(screen.getByTestId('email')).toHaveTextContent('none');
  });

  it('does not load anything when unauthenticated', async () => {
    mockIsAuthenticated = false;
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    expect(mockGetMe).not.toHaveBeenCalled();
    expect(screen.getByTestId('avatar')).toHaveTextContent('none');
  });

  it('uploadAvatar stores the refetched server copy', async () => {
    mockGetAvatar.mockResolvedValueOnce(null).mockResolvedValueOnce(AVATAR);
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    await act(() => ctx.uploadAvatar({ uri: 'file://local.jpg' }));
    expect(mockUpload).toHaveBeenCalledWith({ uri: 'file://local.jpg' });
    expect(screen.getByTestId('avatar')).toHaveTextContent(AVATAR);
  });

  it('uploadAvatar falls back to the local uri when the refetch fails', async () => {
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('loading')).toHaveTextContent('false'));
    mockGetAvatar.mockRejectedValueOnce(new Error('fail'));
    await act(() => ctx.uploadAvatar({ uri: 'file://local.jpg' }));
    expect(screen.getByTestId('avatar')).toHaveTextContent('file://local.jpg');
  });

  it('removeAvatar clears the avatar', async () => {
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('avatar')).toHaveTextContent(AVATAR));
    await act(() => ctx.removeAvatar());
    expect(mockDelete).toHaveBeenCalled();
    expect(screen.getByTestId('avatar')).toHaveTextContent('none');
  });

  it('exposes a pending email change for the current user', async () => {
    mockPendingGet.mockResolvedValue({ userId: 'u1', email: 'new@test.com' });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('pending')).toHaveTextContent('new@test.com'));
    expect(mockPendingClear).not.toHaveBeenCalled();
  });

  it('clears the pending change once the profile shows the new email', async () => {
    mockPendingGet.mockResolvedValue({ userId: 'u1', email: 'ME@test.com' });
    renderProvider();
    await waitFor(() => expect(mockPendingClear).toHaveBeenCalled());
    expect(screen.getByTestId('pending')).toHaveTextContent('none');
  });

  it('clears a pending change that belongs to another account', async () => {
    mockPendingGet.mockResolvedValue({ userId: 'other', email: 'new@test.com' });
    renderProvider();
    await waitFor(() => expect(mockPendingClear).toHaveBeenCalled());
    expect(screen.getByTestId('pending')).toHaveTextContent('none');
  });

  it('requestEmailChange calls the API and stores the pending change', async () => {
    mockRequestEmailChange.mockResolvedValue({ message: 'ok' });
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('email')).toHaveTextContent('me@test.com'));
    await act(() => ctx.requestEmailChange('new@test.com'));
    expect(mockRequestEmailChange).toHaveBeenCalledWith({ newEmail: 'new@test.com' });
    expect(mockPendingSet).toHaveBeenCalledWith({ userId: 'u1', email: 'new@test.com' });
    expect(screen.getByTestId('pending')).toHaveTextContent('new@test.com');
  });

  it('requestEmailChange stores nothing when the API fails', async () => {
    mockRequestEmailChange.mockRejectedValue(new Error('fail'));
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('email')).toHaveTextContent('me@test.com'));
    await expect(act(() => ctx.requestEmailChange('new@test.com'))).rejects.toThrow('fail');
    expect(mockPendingSet).not.toHaveBeenCalled();
    expect(screen.getByTestId('pending')).toHaveTextContent('none');
  });

  it('throws when used outside the provider', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow('useProfile must be used within a ProfileProvider');
  });
});
