import { phrasesApi, LANGUAGE_TO_API } from '../../../src/api/phrases';

jest.mock('../../../src/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

import apiClient from '../../../src/api/client';

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockPatch = apiClient.patch as jest.Mock;
const mockApiDelete = apiClient.delete as jest.Mock;

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

const fakePhraseResponse = {
  id: 'phrase-uuid-1',
  originalWord: 'ephemeral',
  originalLanguage: 'ENGLISH' as const,
  translatedWord: 'эфемерный',
  translatedLanguage: 'RUSSIAN' as const,
  originalAudioId: 'c1f2e3d4-0000-0000-0000-000000000001',
  translatedAudioId: 'c1f2e3d4-0000-0000-0000-000000000002',
  examples: [
    { original: 'The ephemeral beauty of a sunset.', translation: 'Эфемерная красота заката.' },
  ],
  interval: 1,
  repetitions: 0,
  easiness_factor: 2.5,
  next_review_date: '2026-05-25T00:00:00Z',
};

const fakePage = {
  content: [fakePhraseResponse],
  totalElements: 1,
  totalPages: 1,
  numberOfElements: 1,
  first: true,
  last: true,
  empty: false,
};

describe('phrasesApi.getAll', () => {
  it('sends GET to /api/v1/phrases with default page and size', async () => {
    mockGet.mockResolvedValueOnce({ data: fakePage });
    await phrasesApi.getAll();
    expect(mockGet).toHaveBeenCalledWith('/api/v1/phrases', { params: { page: 0, size: 100 } });
  });

  it('sends GET with custom page and size', async () => {
    mockGet.mockResolvedValueOnce({ data: fakePage });
    await phrasesApi.getAll(2, 50);
    expect(mockGet).toHaveBeenCalledWith('/api/v1/phrases', { params: { page: 2, size: 50 } });
  });

  it('returns the page response', async () => {
    mockGet.mockResolvedValueOnce({ data: fakePage });
    const result = await phrasesApi.getAll();
    expect(result).toEqual(fakePage);
  });

  it('returns content array with phrase items', async () => {
    mockGet.mockResolvedValueOnce({ data: fakePage });
    const result = await phrasesApi.getAll();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].id).toBe('phrase-uuid-1');
    expect(result.content[0].interval).toBe(1);
    expect(result.content[0].next_review_date).toBe('2026-05-25T00:00:00Z');
  });

  it('returns empty page when no phrases exist', async () => {
    const emptyPage = { ...fakePage, content: [], totalElements: 0, empty: true };
    mockGet.mockResolvedValueOnce({ data: emptyPage });
    const result = await phrasesApi.getAll();
    expect(result.content).toEqual([]);
    expect(result.empty).toBe(true);
  });

  it('propagates errors', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    await expect(phrasesApi.getAll()).rejects.toThrow('Network error');
  });
});

describe('phrasesApi.update', () => {
  const updateRequest = {
    originalWord: 'ephemeral-edited',
    originalLanguage: 'ENGLISH' as const,
    translatedWord: 'эфемерный-изм',
    translatedLanguage: 'RUSSIAN' as const,
  };

  it('sends PUT to /api/v1/phrases/{id} with request body', async () => {
    mockPut.mockResolvedValueOnce({ data: { ...fakePhraseResponse, ...updateRequest } });
    await phrasesApi.update('phrase-uuid-1', updateRequest);
    expect(mockPut).toHaveBeenCalledWith('/api/v1/phrases/phrase-uuid-1', updateRequest);
  });

  it('returns the updated PhraseResponse', async () => {
    const updated = { ...fakePhraseResponse, ...updateRequest };
    mockPut.mockResolvedValueOnce({ data: updated });
    const result = await phrasesApi.update('phrase-uuid-1', updateRequest);
    expect(result).toEqual(updated);
    expect(result.originalWord).toBe('ephemeral-edited');
  });

  it('propagates errors', async () => {
    mockPut.mockRejectedValueOnce(new Error('Network error'));
    await expect(phrasesApi.update('phrase-uuid-1', updateRequest)).rejects.toThrow(
      'Network error'
    );
  });
});

describe('phrasesApi.delete', () => {
  it('sends DELETE to /api/v1/phrases/{id}', async () => {
    mockApiDelete.mockResolvedValueOnce({});
    await phrasesApi.delete('phrase-uuid-1');
    expect(mockApiDelete).toHaveBeenCalledWith('/api/v1/phrases/phrase-uuid-1');
  });

  it('resolves without a return value', async () => {
    mockApiDelete.mockResolvedValueOnce({});
    const result = await phrasesApi.delete('phrase-uuid-1');
    expect(result).toBeUndefined();
  });

  it('propagates errors', async () => {
    mockApiDelete.mockRejectedValueOnce(new Error('Network error'));
    await expect(phrasesApi.delete('phrase-uuid-1')).rejects.toThrow('Network error');
  });
});

describe('phrasesApi.review', () => {
  it('sends PATCH to /api/v1/phrases/{id}/review with correct=true', async () => {
    mockPatch.mockResolvedValueOnce({ data: fakePhraseResponse });
    await phrasesApi.review('phrase-uuid-1', true);
    expect(mockPatch).toHaveBeenCalledWith('/api/v1/phrases/phrase-uuid-1/review', { correct: true });
  });

  it('sends PATCH with correct=false', async () => {
    mockPatch.mockResolvedValueOnce({ data: fakePhraseResponse });
    await phrasesApi.review('phrase-uuid-1', false);
    expect(mockPatch).toHaveBeenCalledWith('/api/v1/phrases/phrase-uuid-1/review', { correct: false });
  });

  it('returns the updated PhraseResponse', async () => {
    const updated = { ...fakePhraseResponse, repetitions: 1, interval: 2 };
    mockPatch.mockResolvedValueOnce({ data: updated });
    const result = await phrasesApi.review('phrase-uuid-1', true);
    expect(result).toEqual(updated);
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(2);
  });

  it('propagates errors', async () => {
    mockPatch.mockRejectedValueOnce(new Error('Network error'));
    await expect(phrasesApi.review('phrase-uuid-1', true)).rejects.toThrow('Network error');
  });
});
