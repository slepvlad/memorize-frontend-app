import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './locales/en';
import ru from './locales/ru';

const SUPPORTED_LOCALES = ['en', 'ru'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export function detectLocale(): SupportedLocale {
  const code = Localization.getLocales()[0]?.languageCode ?? 'en';
  return (SUPPORTED_LOCALES as readonly string[]).includes(code)
    ? (code as SupportedLocale)
    : 'en';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: detectLocale(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
