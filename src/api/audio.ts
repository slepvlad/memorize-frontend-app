import apiClient from './client';
import { toDataUri } from './dataUri';
import type { ApiLanguage } from './phrases';

/** Backend rejects longer text with a 400. */
export const AUDIO_MAX_TEXT_LENGTH = 300;

export interface AudioGenerateRequest {
  text: string;
  language: ApiLanguage;
}

export interface AudioGenerateResponse {
  audio_id: string;
  url: string;
  content_type: string;
  duration_ms: number | null;
  /** True when the user already had a clip for this text — nothing was synthesized. */
  cached: boolean;
}

export const audioApi = {
  /** Synthesizes speech for `text`, or returns the clip already stored for it. */
  generate: async (text: string, language: ApiLanguage): Promise<AudioGenerateResponse> => {
    const { data } = await apiClient.post<AudioGenerateResponse>('/api/v1/audio', {
      text,
      language,
    } satisfies AudioGenerateRequest);
    return data;
  },

  /** Returns the clip as a data URI, because the endpoint needs the Authorization header. */
  getClip: async (audioId: string): Promise<string> => {
    const { data, headers } = await apiClient.get<ArrayBuffer>(`/api/v1/audio/${audioId}`, {
      responseType: 'arraybuffer',
    });
    return toDataUri(data, String(headers['content-type'] ?? 'audio/wav'));
  },
};
