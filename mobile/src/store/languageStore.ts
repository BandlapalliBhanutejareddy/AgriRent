import { create } from 'zustand';

export type SupportedLanguage = 'en' | 'ta' | 'te' | 'hi' | 'kn';

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'en',
  setLanguage: (lang) => set({ language: lang }),
}));
