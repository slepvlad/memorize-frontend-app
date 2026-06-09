import { detectLocale } from '../../../src/i18n';
import en from '../../../src/i18n/locales/en';
import ru from '../../../src/i18n/locales/ru';

const mockGetLocales = require('expo-localization').getLocales as jest.Mock;

describe('detectLocale', () => {
  it('returns "en" for an English device', () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'en' }]);
    expect(detectLocale()).toBe('en');
  });

  it('returns "ru" for a Russian device', () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'ru' }]);
    expect(detectLocale()).toBe('ru');
  });

  it('falls back to "en" for an unsupported locale', () => {
    mockGetLocales.mockReturnValue([{ languageCode: 'fr' }]);
    expect(detectLocale()).toBe('en');
  });

  it('falls back to "en" when getLocales returns an empty array', () => {
    mockGetLocales.mockReturnValue([]);
    expect(detectLocale()).toBe('en');
  });

  it('falls back to "en" when languageCode is null', () => {
    mockGetLocales.mockReturnValue([{ languageCode: null }]);
    expect(detectLocale()).toBe('en');
  });
});

describe('locale completeness', () => {
  it('ru has exactly the same keys as en', () => {
    const enKeys = Object.keys(en).sort();
    const ruKeys = Object.keys(ru).sort();
    expect(ruKeys).toEqual(enKeys);
  });

  it('no key in en has an empty string value', () => {
    const empty = Object.entries(en).filter(([, v]) => v === '');
    expect(empty).toEqual([]);
  });

  it('no key in ru has an empty string value', () => {
    const empty = Object.entries(ru).filter(([, v]) => v === '');
    expect(empty).toEqual([]);
  });
});

describe('interpolation keys', () => {
  it('en reviewedCount_one contains {{count}}', () => {
    expect(en.reviewedCount_one).toContain('{{count}}');
  });

  it('en reviewedCount_other contains {{count}}', () => {
    expect(en.reviewedCount_other).toContain('{{count}}');
  });

  it('en questionCounter contains {{current}} and {{total}}', () => {
    expect(en.questionCounter).toContain('{{current}}');
    expect(en.questionCounter).toContain('{{total}}');
  });

  it('en scorePercent contains {{pct}}', () => {
    expect(en.scorePercent).toContain('{{pct}}');
  });

  it('en wordCount_one contains {{count}}', () => {
    expect(en.wordCount_one).toContain('{{count}}');
  });

  it('en deleteWordConfirm contains {{word}}', () => {
    expect(en.deleteWordConfirm).toContain('{{word}}');
  });
});
