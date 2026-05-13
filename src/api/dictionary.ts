import apiClient from './client';

export interface DictionaryDefinition {
  definition: string;
  example?: string;
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryMeaning {
  part_of_speech: string;
  definitions: DictionaryDefinition[];
  synonyms: string[];
  antonyms: string[];
}

export interface DictionaryEntryResponse {
  word: string;
  phonetic?: string;
  audio?: string;
  meanings: DictionaryMeaning[];
}

export interface TranslationRequest {
  text: string;
  source: string;
  target: string;
}

export interface TranslationResponse {
  source: string;
  target: string;
  original_text: string;
  translated_text: string;
}

export const dictionaryApi = {
  lookup: async (word: string): Promise<DictionaryEntryResponse> => {
    const { data } = await apiClient.get<DictionaryEntryResponse>(
      `/api/v1/dictionary/${encodeURIComponent(word)}`
    );
    return data;
  },
};

export const translationApi = {
  translate: async (request: TranslationRequest): Promise<TranslationResponse> => {
    const { data } = await apiClient.post<TranslationResponse>('/api/v1/translation', request);
    return data;
  },
};
