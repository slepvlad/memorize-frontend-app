import en from '../src/i18n/locales/en';

type TranslationMap = Record<string, string>;
const translations = en as unknown as TranslationMap;

// Mimics i18next t() with plural and interpolation support so test assertions
// can use the same human-readable strings as production without spinning up i18n.
const t = (key: string, options?: Record<string, unknown>): string => {
  let resolvedKey = key;
  if (options && 'count' in options) {
    const count = options.count as number;
    const plural = count === 1 ? `${key}_one` : `${key}_other`;
    if (plural in translations) resolvedKey = plural;
  }
  let value = translations[resolvedKey] ?? key;
  if (options) {
    Object.entries(options).forEach(([k, v]) => {
      value = value.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
    });
  }
  return value;
};

module.exports = {
  useTranslation: () => ({
    t,
    i18n: { language: 'en', changeLanguage: jest.fn() },
  }),
  initReactI18next: { type: '3rdParty', init: jest.fn() },
  I18nextProvider: ({ children }: { children: React.ReactNode }) => children,
};
