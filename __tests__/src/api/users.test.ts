import { Platform } from 'react-native';
import { AxiosError, AxiosHeaders } from 'axios';
import { usersApi } from '../../../src/api/users';

jest.mock('../../../src/api/client', () => ({
  __esModule: true,
  API_BASE_URL: 'https://api.test',
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import apiClient from '../../../src/api/client';

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;

const profile = { id: 'u1', email: 'me@test.com' };

const httpError = (status: number) =>
  new AxiosError('fail', String(status), undefined, undefined, {
    status,
    statusText: '',
    data: null,
    headers: {},
    config: { headers: new AxiosHeaders() },
  });

beforeEach(() => jest.clearAllMocks());

describe('usersApi', () => {
  it('getMe fetches the current user', async () => {
    mockGet.mockResolvedValueOnce({ data: profile });
    await expect(usersApi.getMe()).resolves.toEqual(profile);
    expect(mockGet).toHaveBeenCalledWith('/api/v1/users/me');
  });

  it('getAvatar returns the image bytes as a data URI', async () => {
    const bytes = new Uint8Array([104, 105]).buffer; // "hi"
    mockGet.mockResolvedValueOnce({ data: bytes, headers: { 'content-type': 'image/png' } });
    await expect(usersApi.getAvatar()).resolves.toBe('data:image/png;base64,aGk=');
    expect(mockGet).toHaveBeenCalledWith('/api/v1/users/me/avatar', { responseType: 'arraybuffer' });
  });

  it('getAvatar defaults content type to jpeg', async () => {
    mockGet.mockResolvedValueOnce({ data: new Uint8Array([104, 105]).buffer, headers: {} });
    await expect(usersApi.getAvatar()).resolves.toBe('data:image/jpeg;base64,aGk=');
  });

  it('getAvatar returns null when no avatar is set (404)', async () => {
    mockGet.mockRejectedValueOnce(httpError(404));
    await expect(usersApi.getAvatar()).resolves.toBeNull();
  });

  it('getAvatar rethrows other errors', async () => {
    const err = httpError(500);
    mockGet.mockRejectedValueOnce(err);
    await expect(usersApi.getAvatar()).rejects.toBe(err);
  });

  it('uploadAvatar posts multipart form with the picked file', async () => {
    mockPost.mockResolvedValueOnce({ status: 204 });
    const appendSpy = jest.spyOn(FormData.prototype, 'append');

    await expect(
      usersApi.uploadAvatar({ uri: 'file:///a.png', mimeType: 'image/png', fileName: 'a.png' })
    ).resolves.toBeUndefined();

    expect(appendSpy).toHaveBeenCalledWith('file', { uri: 'file:///a.png', name: 'a.png', type: 'image/png' });
    expect(mockPost).toHaveBeenCalledWith('/api/v1/users/me/avatar', expect.any(FormData), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    appendSpy.mockRestore();
  });

  it('uploadAvatar defaults mime type and file name', async () => {
    mockPost.mockResolvedValueOnce({ status: 204 });
    const appendSpy = jest.spyOn(FormData.prototype, 'append');

    await usersApi.uploadAvatar({ uri: 'file:///a' });

    expect(appendSpy).toHaveBeenCalledWith('file', { uri: 'file:///a', name: 'avatar.jpeg', type: 'image/jpeg' });
    appendSpy.mockRestore();
  });

  it('uploadAvatar converts the uri to a Blob on web', async () => {
    const originalOS = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
    const blob = { size: 1 };
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ blob: () => Promise.resolve(blob) }) as any;
    const appendSpy = jest.spyOn(FormData.prototype, 'append').mockImplementation(() => {});
    mockPost.mockResolvedValueOnce({ status: 204 });

    await usersApi.uploadAvatar({ uri: 'blob:abc', mimeType: 'image/png' });

    expect(global.fetch).toHaveBeenCalledWith('blob:abc');
    expect(appendSpy).toHaveBeenCalledWith('file', blob, 'avatar.png');

    appendSpy.mockRestore();
    global.fetch = originalFetch;
    Object.defineProperty(Platform, 'OS', { value: originalOS, configurable: true });
  });

  it('deleteAvatar sends DELETE', async () => {
    mockDelete.mockResolvedValueOnce({});
    await usersApi.deleteAvatar();
    expect(mockDelete).toHaveBeenCalledWith('/api/v1/users/me/avatar');
  });

  it('changePassword sends PUT with both passwords', async () => {
    mockPut.mockResolvedValueOnce({ data: { message: 'ok' } });
    const req = { currentPassword: 'old123', newPassword: 'new123' };
    await expect(usersApi.changePassword(req)).resolves.toEqual({ message: 'ok' });
    expect(mockPut).toHaveBeenCalledWith('/api/v1/users/me/password', req);
  });

  it('changeEmail sends PUT with new email and password', async () => {
    mockPut.mockResolvedValueOnce({ data: { message: 'ok' } });
    const req = { newEmail: 'new@test.com', currentPassword: 'pw' };
    await expect(usersApi.changeEmail(req)).resolves.toEqual({ message: 'ok' });
    expect(mockPut).toHaveBeenCalledWith('/api/v1/users/me/email', req);
  });
});
