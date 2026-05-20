import { phrasesApi, LANGUAGE_TO_API } from '../../../src/api/phrases';

jest.mock('../../../src/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

import apiClient from '../../../src/api/client';

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;

const fakeResponse = {
  originalWord: 'ephemeral',
  originalLanguage: 'ENGLISH' as const,
  translatedWord: 'эфемерный',
  translatedLanguage: 'RUSSIAN' as const,
  originalAudioId: 'c1f2e3d4-0000-0000-0000-000000000001',
  translatedAudioId: 'c1f2e3d4-0000-0000-0000-000000000002',
  examples: [
    { original: 'The ephemeral beauty of a sunset.', translation: 'Эфемерная красота заката.' },
    { original: 'Fame can be ephemeral.', translation: 'Слава может быть мимолётной.' },
  ],
};

beforeEach(() => jest.clearAllMocks());

describe('phrasesApi.lookup', () => {
  it('sends GET to /api/v1/phrases/lookup with correct params', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeResponse });
    await phrasesApi.lookup('ephemeral', 'ENGLISH', 'RUSSIAN');
    expect(mockGet).toHaveBeenCalledWith('/api/v1/phrases/lookup', {
      params: { phrase: 'ephemeral', sourceLanguage: 'ENGLISH', targetLanguage: 'RUSSIAN' },
    });
  });

  it('returns the phrase lookup response', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeResponse });
    const result = await phrasesApi.lookup('ephemeral', 'ENGLISH', 'RUSSIAN');
    expect(result).toEqual(fakeResponse);
  });

  it('returns originalWord and translatedWord', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeResponse });
    const result = await phrasesApi.lookup('ephemeral', 'ENGLISH', 'RUSSIAN');
    expect(result.originalWord).toBe('ephemeral');
    expect(result.translatedWord).toBe('эфемерный');
  });

  it('returns examples array', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeResponse });
    const result = await phrasesApi.lookup('ephemeral', 'ENGLISH', 'RUSSIAN');
    expect(result.examples).toHaveLength(2);
    expect(result.examples[0].original).toBe('The ephemeral beauty of a sunset.');
    expect(result.examples[0].translation).toBe('Эфемерная красота заката.');
  });

  it('returns originalAudioId and translatedAudioId', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeResponse });
    const result = await phrasesApi.lookup('ephemeral', 'ENGLISH', 'RUSSIAN');
    expect(result.originalAudioId).toBe('c1f2e3d4-0000-0000-0000-000000000001');
    expect(result.translatedAudioId).toBe('c1f2e3d4-0000-0000-0000-000000000002');
  });

  it('handles null audio ids', async () => {
    mockGet.mockResolvedValueOnce({
      data: { ...fakeResponse, originalAudioId: null, translatedAudioId: null },
    });
    const result = await phrasesApi.lookup('ephemeral', 'ENGLISH', 'RUSSIAN');
    expect(result.originalAudioId).toBeNull();
    expect(result.translatedAudioId).toBeNull();
  });

  it('handles empty examples array', async () => {
    mockGet.mockResolvedValueOnce({ data: { ...fakeResponse, examples: [] } });
    const result = await phrasesApi.lookup('ephemeral', 'ENGLISH', 'RUSSIAN');
    expect(result.examples).toEqual([]);
  });

  it('propagates errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    await expect(phrasesApi.lookup('ephemeral', 'ENGLISH', 'RUSSIAN')).rejects.toThrow(
      'Network error'
    );
  });
});

describe('phrasesApi.save', () => {
  const saveRequest = {
    originalWord: 'ephemeral',
    originalLanguage: 'ENGLISH' as const,
    translatedWord: 'эфемерный',
    translatedLanguage: 'RUSSIAN' as const,
    originalAudioId: 'c1f2e3d4-0000-0000-0000-000000000001',
    translatedAudioId: 'c1f2e3d4-0000-0000-0000-000000000002',
    examples: [
      { original: 'The ephemeral beauty of a sunset.', translation: 'Эфемерная красота заката.' },
    ],
  };

  it('sends POST to /api/v1/phrases with request body', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 'new-phrase-id' } });
    await phrasesApi.save(saveRequest);
    expect(mockPost).toHaveBeenCalledWith('/api/v1/phrases', saveRequest);
  });

  it('returns the created phrase id', async () => {
    mockPost.mockResolvedValueOnce({ data: { id: 'new-phrase-id' } });
    const result = await phrasesApi.save(saveRequest);
    expect(result.id).toBe('new-phrase-id');
  });

  it('sends only required fields when optional ones are omitted', async () => {
    const minimalRequest = {
      originalWord: 'ephemeral',
      originalLanguage: 'ENGLISH' as const,
      translatedWord: 'эфемерный',
      translatedLanguage: 'RUSSIAN' as const,
    };
    mockPost.mockResolvedValueOnce({ data: { id: 'new-phrase-id' } });
    await phrasesApi.save(minimalRequest);
    expect(mockPost).toHaveBeenCalledWith('/api/v1/phrases', minimalRequest);
  });

  it('propagates errors', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));
    await expect(phrasesApi.save(saveRequest)).rejects.toThrow('Network error');
  });
});

describe('LANGUAGE_TO_API', () => {
  it('maps en to ENGLISH', () => {
    expect(LANGUAGE_TO_API['en']).toBe('ENGLISH');
  });

  it('maps ru to RUSSIAN', () => {
    expect(LANGUAGE_TO_API['ru']).toBe('RUSSIAN');
  });
});
