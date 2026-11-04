import apiClient from './client';

export interface StatsSummary {
  totalPhrases: number;
  dueNow: number;
  dueToday: number;
  newPhrases: number;
  learningPhrases: number;
  /** Review interval of 21+ days. */
  maturePhrases: number;
  averageEasiness: number;
}

// The backend decides where "today" ends from an IANA zone, e.g. Europe/Moscow.
function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export const statsApi = {
  getSummary: async (tz: string = deviceTimeZone()): Promise<StatsSummary> => {
    const { data } = await apiClient.get<StatsSummary>('/api/v1/users/me/stats/summary', {
      params: { tz },
    });
    return data;
  },
};
