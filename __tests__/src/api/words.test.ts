import { wordsApi } from '../../../src/api/words';

jest.mock('../../../src/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
  },
}));

import apiClient from '../../../src/api/client';

const mockGet = apiClient.get as jest.Mock;
const mockPost = apiClient.post as jest.Mock;
const mockPut = apiClient.put as jest.Mock;
const mockDelete = apiClient.delete as jest.Mock;
const mockPatch = apiClient.patch as jest.Mock;

const fakeWord = {
  id: '1',
  term: 'Ephemeral',
  definition: 'Lasting for a very short time',
  interval: 1,
  repetitions: 0,
  easiness_factor: 2.5,
  next_review_date: '2026-04-09',
};

const fakePage = {
  content: [fakeWord],
  totalElements: 1,
  totalPages: 1,
  numberOfElements: 1,
  first: true,
  last: true,
  empty: false,
};

beforeEach(() => jest.clearAllMocks());

describe('wordsApi.getAll', () => {
  it('fetches with default page=0, size=100', async () => {
    mockGet.mockResolvedValueOnce({ data: fakePage });
    const result = await wordsApi.getAll();
    expect(mockGet).toHaveBeenCalledWith('/api/v1/words', { params: { page: 0, size: 100 } });
    expect(result).toEqual(fakePage);
  });

  it('passes custom page and size', async () => {
    mockGet.mockResolvedValueOnce({ data: fakePage });
    await wordsApi.getAll(2, 10);
    expect(mockGet).toHaveBeenCalledWith('/api/v1/words', { params: { page: 2, size: 10 } });
  });

  it('returns the page data', async () => {
    mockGet.mockResolvedValueOnce({ data: fakePage });
    const result = await wordsApi.getAll();
    expect(result.content).toEqual([fakeWord]);
    expect(result.totalElements).toBe(1);
  });

  it('propagates error on failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));
    await expect(wordsApi.getAll()).rejects.toThrow('Network error');
  });
});

describe('wordsApi.create', () => {
  it('posts to /api/v1/words and returns created word', async () => {
    mockPost.mockResolvedValueOnce({ data: fakeWord });
    const result = await wordsApi.create({ term: 'Ephemeral', definition: 'Lasting for a very short time' });
    expect(mockPost).toHaveBeenCalledWith('/api/v1/words', {
      term: 'Ephemeral',
      definition: 'Lasting for a very short time',
    });
    expect(result).toEqual(fakeWord);
  });

  it('creates word without definition', async () => {
    const wordNoDefinition = { ...fakeWord, definition: undefined };
    mockPost.mockResolvedValueOnce({ data: wordNoDefinition });
    const result = await wordsApi.create({ term: 'Ephemeral' });
    expect(mockPost).toHaveBeenCalledWith('/api/v1/words', { term: 'Ephemeral' });
    expect(result).toEqual(wordNoDefinition);
  });

  it('propagates error on failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('Conflict'));
    await expect(wordsApi.create({ term: 'Ephemeral' })).rejects.toThrow('Conflict');
  });
});

describe('wordsApi.getById', () => {
  it('fetches word by id', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeWord });
    const result = await wordsApi.getById('1');
    expect(mockGet).toHaveBeenCalledWith('/api/v1/words/1');
    expect(result).toEqual(fakeWord);
  });

  it('propagates 404 error', async () => {
    mockGet.mockRejectedValueOnce(new Error('Not found'));
    await expect(wordsApi.getById('999')).rejects.toThrow('Not found');
  });
});

describe('wordsApi.update', () => {
  it('puts updated word and returns it', async () => {
    const updated = { ...fakeWord, term: 'Updated' };
    mockPut.mockResolvedValueOnce({ data: updated });
    const result = await wordsApi.update('1', { term: 'Updated' });
    expect(mockPut).toHaveBeenCalledWith('/api/v1/words/1', { term: 'Updated' });
    expect(result).toEqual(updated);
  });

  it('updates with both term and definition', async () => {
    mockPut.mockResolvedValueOnce({ data: fakeWord });
    await wordsApi.update('1', { term: 'Ephemeral', definition: 'Short-lived' });
    expect(mockPut).toHaveBeenCalledWith('/api/v1/words/1', {
      term: 'Ephemeral',
      definition: 'Short-lived',
    });
  });

  it('propagates error on failure', async () => {
    mockPut.mockRejectedValueOnce(new Error('Forbidden'));
    await expect(wordsApi.update('1', { term: 'Test' })).rejects.toThrow('Forbidden');
  });
});

describe('wordsApi.delete', () => {
  it('sends DELETE to /api/v1/words/:id', async () => {
    mockDelete.mockResolvedValueOnce({});
    await wordsApi.delete('1');
    expect(mockDelete).toHaveBeenCalledWith('/api/v1/words/1');
  });

  it('resolves without a return value', async () => {
    mockDelete.mockResolvedValueOnce({});
    const result = await wordsApi.delete('1');
    expect(result).toBeUndefined();
  });

  it('propagates error on failure', async () => {
    mockDelete.mockRejectedValueOnce(new Error('Not found'));
    await expect(wordsApi.delete('999')).rejects.toThrow('Not found');
  });
});

describe('wordsApi.review', () => {
  it('patches /api/v1/words/:id/review with correct:true', async () => {
    const reviewed = { ...fakeWord, repetitions: 1 };
    mockPatch.mockResolvedValueOnce({ data: reviewed });
    const result = await wordsApi.review('1', true);
    expect(mockPatch).toHaveBeenCalledWith('/api/v1/words/1/review', { correct: true });
    expect(result.repetitions).toBe(1);
  });

  it('patches with correct:false', async () => {
    mockPatch.mockResolvedValueOnce({ data: fakeWord });
    await wordsApi.review('1', false);
    expect(mockPatch).toHaveBeenCalledWith('/api/v1/words/1/review', { correct: false });
  });

  it('returns updated word', async () => {
    const updated = { ...fakeWord, interval: 6, repetitions: 3 };
    mockPatch.mockResolvedValueOnce({ data: updated });
    const result = await wordsApi.review('1', true);
    expect(result).toEqual(updated);
  });

  it('propagates error on failure', async () => {
    mockPatch.mockRejectedValueOnce(new Error('Not found'));
    await expect(wordsApi.review('999', true)).rejects.toThrow('Not found');
  });
});
