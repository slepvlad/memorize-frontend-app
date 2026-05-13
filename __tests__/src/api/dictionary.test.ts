import { dictionaryApi, translationApi } from '../../../src/api/dictionary';

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

const fakeDictionaryEntry = {
  word: 'ephemeral',
  phonetic: '/ɪˈfemərəl/',
  audio: '',
  meanings: [
    {
      part_of_speech: 'adjective',
      definitions: [
        {
          definition: 'Lasting for a very short time',
          example: 'The ephemeral pleasures of life',
          synonyms: ['transitory'],
          antonyms: ['permanent'],
        },
      ],
      synonyms: [],
      antonyms: [],
    },
  ],
};

const fakeTranslationResponse = {
  source: 'en',
  target: 'ru',
  original_text: 'Lasting for a very short time',
  translated_text: 'Длящийся очень короткое время',
};

beforeEach(() => jest.clearAllMocks());

describe('dictionaryApi.lookup', () => {
  it('GETs /api/v1/dictionary/{word} with encoded word', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeDictionaryEntry });
    await dictionaryApi.lookup('ephemeral');
    expect(mockGet).toHaveBeenCalledWith('/api/v1/dictionary/ephemeral');
  });

  it('URL-encodes words with special characters', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeDictionaryEntry });
    await dictionaryApi.lookup('hello world');
    expect(mockGet).toHaveBeenCalledWith('/api/v1/dictionary/hello%20world');
  });

  it('returns the dictionary entry', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeDictionaryEntry });
    const result = await dictionaryApi.lookup('ephemeral');
    expect(result).toEqual(fakeDictionaryEntry);
  });

  it('exposes first definition through the meanings array', async () => {
    mockGet.mockResolvedValueOnce({ data: fakeDictionaryEntry });
    const result = await dictionaryApi.lookup('ephemeral');
    expect(result.meanings[0].definitions[0].definition).toBe(
      'Lasting for a very short time'
    );
  });

  it('propagates error on failure', async () => {
    mockGet.mockRejectedValueOnce(new Error('Not found'));
    await expect(dictionaryApi.lookup('xyz')).rejects.toThrow('Not found');
  });
});

describe('translationApi.translate', () => {
  it('POSTs to /api/v1/translation with the request body', async () => {
    mockPost.mockResolvedValueOnce({ data: fakeTranslationResponse });
    await translationApi.translate({
      text: 'Lasting for a very short time',
      source: 'en',
      target: 'ru',
    });
    expect(mockPost).toHaveBeenCalledWith('/api/v1/translation', {
      text: 'Lasting for a very short time',
      source: 'en',
      target: 'ru',
    });
  });

  it('returns the translation response', async () => {
    mockPost.mockResolvedValueOnce({ data: fakeTranslationResponse });
    const result = await translationApi.translate({
      text: 'Lasting for a very short time',
      source: 'en',
      target: 'ru',
    });
    expect(result).toEqual(fakeTranslationResponse);
  });

  it('returns the translated text', async () => {
    mockPost.mockResolvedValueOnce({ data: fakeTranslationResponse });
    const result = await translationApi.translate({
      text: 'Lasting for a very short time',
      source: 'en',
      target: 'ru',
    });
    expect(result.translated_text).toBe('Длящийся очень короткое время');
  });

  it('propagates error on failure', async () => {
    mockPost.mockRejectedValueOnce(new Error('Translation failed'));
    await expect(
      translationApi.translate({ text: 'hello', source: 'en', target: 'ru' })
    ).rejects.toThrow('Translation failed');
  });
});
