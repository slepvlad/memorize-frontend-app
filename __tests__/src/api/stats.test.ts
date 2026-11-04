import MockAdapter from 'axios-mock-adapter';
import apiClient from '../../../src/api/client';
import { statsApi } from '../../../src/api/stats';

jest.mock('../../../src/storage/tokenStorage', () => ({
  tokenStorage: {
    getAccessToken: jest.fn().mockResolvedValue('token'),
    getRefreshToken: jest.fn(),
    setTokens: jest.fn(),
    clearTokens: jest.fn(),
  },
}));

jest.mock('../../../src/context/ToastContext', () => ({
  triggerToast: jest.fn(),
}));

const { triggerToast } = require('../../../src/context/ToastContext');

const summary = {
  totalPhrases: 10,
  dueNow: 2,
  dueToday: 3,
  newPhrases: 4,
  learningPhrases: 5,
  maturePhrases: 1,
  averageEasiness: 2.5,
};

let mock: MockAdapter;

beforeEach(() => {
  mock = new MockAdapter(apiClient);
  jest.clearAllMocks();
});

afterEach(() => mock.restore());

describe('statsApi.getSummary', () => {
  it('returns the summary for the given time zone', async () => {
    mock.onGet('/api/v1/users/me/stats/summary').reply((config) => {
      expect(config.params).toEqual({ tz: 'Europe/Moscow' });
      return [200, summary];
    });

    await expect(statsApi.getSummary('Europe/Moscow')).resolves.toEqual(summary);
  });

  it('defaults to the device time zone', async () => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    mock.onGet('/api/v1/users/me/stats/summary').reply((config) => {
      expect(config.params).toEqual({ tz });
      return [200, summary];
    });

    await statsApi.getSummary();
  });

  it('falls back to UTC when the time zone cannot be resolved', async () => {
    const spy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('no Intl');
    });
    mock.onGet('/api/v1/users/me/stats/summary').reply((config) => {
      expect(config.params).toEqual({ tz: 'UTC' });
      return [200, summary];
    });

    await statsApi.getSummary();
    spy.mockRestore();
  });

  it('rejects without a toast so the screen can show its own error', async () => {
    mock.onGet('/api/v1/users/me/stats/summary').reply(500, { message: 'Boom' });

    await expect(statsApi.getSummary('UTC')).rejects.toBeDefined();
    expect(triggerToast).not.toHaveBeenCalled();
  });
});
