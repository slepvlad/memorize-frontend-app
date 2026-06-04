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
  originalAudioId: string | null;
  translatedAudioId: string | null;
  examples: Example[];
}

export interface PhraseResponse {
  id: string;
  originalWord: string;
  originalLanguage: ApiLanguage;
  translatedWord: string;
  translatedLanguage: ApiLanguage;
  originalAudioId: string | null;
  translatedAudioId: string | null;
  examples: Example[];
  interval: number;
  repetitions: number;
  easiness_factor: number;
  next_review_date: string;
}

export interface PagePhraseResponse {
  content: PhraseResponse[];
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PhraseCreateRequest {
  originalWord: string;
  originalLanguage: ApiLanguage;
  translatedWord: string;
  translatedLanguage: ApiLanguage;
  originalAudioId?: string | null;
  translatedAudioId?: string | null;
  examples?: Example[];
}

export interface PhraseCreateResponse {
  id: string;
}

export interface PhraseUpdateRequest {
  originalWord: string;
  originalLanguage: ApiLanguage;
  translatedWord: string;
  translatedLanguage: ApiLanguage;
  originalAudioId?: string | null;
  translatedAudioId?: string | null;
  examples?: Example[];
}

export interface ReviewRequest {
  correct: boolean;
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

  getAll: async (page = 0, size = 100): Promise<PagePhraseResponse> => {
    const { data } = await apiClient.get<PagePhraseResponse>('/api/v1/phrases', {
      params: { page, size },
    });
    return data;
  },

  update: async (id: string, request: PhraseUpdateRequest): Promise<PhraseResponse> => {
    const { data } = await apiClient.put<PhraseResponse>(`/api/v1/phrases/${id}`, request);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/phrases/${id}`);
  },

  review: async (id: string, correct: boolean): Promise<PhraseResponse> => {
    const { data } = await apiClient.patch<PhraseResponse>(`/api/v1/phrases/${id}/review`, {
      correct,
    } satisfies ReviewRequest);
    return data;
  },
};
