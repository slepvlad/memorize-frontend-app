import { audioApi } from '../../../src/api/audio';

jest.mock('../../../src/api/client', () => ({
  __esModule: true,
  API_BASE_URL: 'https://api.test',
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import apiClient from '../../../src/api/client';

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

beforeEach(() => jest.clearAllMocks());

describe('audioApi', () => {
  it('generate posts the text and language', async () => {
    const response = {
      audio_id: 'a1',
      url: 'https://api.test/api/v1/audio/a1',
      content_type: 'audio/wav',
      duration_ms: 1200,
      cached: false,
    };
    mockPost.mockResolvedValueOnce({ data: response });

    await expect(audioApi.generate('ephemeral', 'ENGLISH')).resolves.toEqual(response);
    expect(mockPost).toHaveBeenCalledWith('/api/v1/audio', {
      text: 'ephemeral',
      language: 'ENGLISH',
    });
  });

  it('generate reports a cached clip', async () => {
    mockPost.mockResolvedValueOnce({
      data: { audio_id: 'a1', url: 'u', content_type: 'audio/wav', duration_ms: null, cached: true },
    });

    const result = await audioApi.generate('again', 'RUSSIAN');
    expect(result.cached).toBe(true);
    expect(mockPost).toHaveBeenCalledWith('/api/v1/audio', { text: 'again', language: 'RUSSIAN' });
  });

  it('getClip fetches the bytes and returns a data URI', async () => {
    const bytes = new Uint8Array([104, 105]).buffer; // "hi"
    mockGet.mockResolvedValueOnce({ data: bytes, headers: { 'content-type': 'audio/wav' } });

    await expect(audioApi.getClip('a1')).resolves.toBe('data:audio/wav;base64,aGk=');
    expect(mockGet).toHaveBeenCalledWith('/api/v1/audio/a1', { responseType: 'arraybuffer' });
  });

  it('getClip defaults the content type to audio/wav', async () => {
    mockGet.mockResolvedValueOnce({ data: new Uint8Array([104, 105]).buffer, headers: {} });

    await expect(audioApi.getClip('a1')).resolves.toBe('data:audio/wav;base64,aGk=');
  });

  it('getClip propagates failures', async () => {
    const error = new Error('not found');
    mockGet.mockRejectedValueOnce(error);

    await expect(audioApi.getClip('missing')).rejects.toBe(error);
  });
});
