'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';
import ta from '../locales/ta.json';
import kn from '../locales/kn.json';

const resources = {
  en: { translation: en },
  te: { translation: te },
  hi: { translation: hi },
  ta: { translation: ta },
  kn: { translation: kn }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['navigator', 'htmlTag'],
      caches: [],
    },
  });

export default i18n;
