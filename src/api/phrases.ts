import apiClient from './client';

export type ApiLanguage = 'ENGLISH' | 'RUSSIAN';

export interface Example {
  original: string;
  translation: string;
}

export interface PhraseLookupResponse {
  originalWord: string;
  originalLanguage: ApiLanguage;
  translatedWord: string;
  translatedLanguage: ApiLanguage;
  audioId: string | null;
  examples: Example[];
}

export interface PhraseCreateRequest {
  originalWord: string;
  originalLanguage: ApiLanguage;
  translatedWord: string;
  translatedLanguage: ApiLanguage;
  audioId?: string | null;
  examples?: Example[];
}

export interface PhraseCreateResponse {
  id: string;
}

export const LANGUAGE_TO_API: Record<string, ApiLanguage> = {
  en: 'ENGLISH',
  ru: 'RUSSIAN',
};

export const phrasesApi = {
  lookup: async (
    phrase: string,
    sourceLanguage: ApiLanguage,
    targetLanguage: ApiLanguage
  ): Promise<PhraseLookupResponse> => {
    const { data } = await apiClient.get<PhraseLookupResponse>('/api/v1/phrases/lookup', {
      params: { phrase, sourceLanguage, targetLanguage },
    });
    return data;
  },

  save: async (request: PhraseCreateRequest): Promise<PhraseCreateResponse> => {
    const { data } = await apiClient.post<PhraseCreateResponse>('/api/v1/phrases', request);
    return data;
  },
};
