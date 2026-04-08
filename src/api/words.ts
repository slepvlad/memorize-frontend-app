import apiClient from './client';

export interface WordRequest {
  term: string;
  definition?: string;
}

export interface WordResponse {
  id: string;
  term: string;
  definition?: string;
  interval: number;
  repetitions: number;
  easiness_factor: number;
  next_review_date: string;
}

export interface PageWordResponse {
  content: WordResponse[];
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ReviewRequest {
  correct: boolean;
}

export const wordsApi = {
  getAll: async (page = 0, size = 100): Promise<PageWordResponse> => {
    const { data } = await apiClient.get<PageWordResponse>('/api/v1/words', {
      params: { page, size },
    });
    return data;
  },

  create: async (word: WordRequest): Promise<WordResponse> => {
    const { data } = await apiClient.post<WordResponse>('/api/v1/words', word);
    return data;
  },

  getById: async (id: string): Promise<WordResponse> => {
    const { data } = await apiClient.get<WordResponse>(`/api/v1/words/${id}`);
    return data;
  },

  update: async (id: string, word: WordRequest): Promise<WordResponse> => {
    const { data } = await apiClient.put<WordResponse>(`/api/v1/words/${id}`, word);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/words/${id}`);
  },

  review: async (id: string, correct: boolean): Promise<WordResponse> => {
    const { data } = await apiClient.patch<WordResponse>(`/api/v1/words/${id}/review`, {
      correct,
    } satisfies ReviewRequest);
    return data;
  },
};
