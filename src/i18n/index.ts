import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en/translation.json';
import uk from './locales/uk/translation.json';

export const LANGUAGES = ['en', 'uk'] as const;
export type Language = (typeof LANGUAGES)[number];

const KEY = 'language';

function stored(): Language {
  try {
    const value = localStorage.getItem(KEY);
    return LANGUAGES.find((l) => l === value) ?? 'en';
  } catch {
    return 'en';
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    uk: { translation: uk },
  },
  lng: stored(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  try {
    localStorage.setItem(KEY, lng);
  } catch {
    // storage unavailable (private mode): the choice just won't persist
  }
});
document.documentElement.lang = i18n.language;

export default i18n;
