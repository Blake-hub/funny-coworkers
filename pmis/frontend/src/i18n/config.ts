import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { AppLang } from './types';
import { zh } from './locales/zh';
import { en } from './locales/en';

export const LANG_STORAGE_KEY = 'pmis-lang';

/**
 * Language detection: localStorage manual selection first, then follow the browser language,
 * finally fall back to Chinese. Note: i18n initializes with lng='zh' so SSR HTML matches the
 * client's first render (no hydration warning); after the client mounts, useClientLanguage
 * switches to the detected language before the first paint.
 */
export function detectLanguage(): AppLang {
  if (typeof window === 'undefined') return 'zh';
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    /* Ignore when localStorage is unavailable */
  }
  const nav = window.navigator?.language || '';
  return nav.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

export function persistLanguage(lang: AppLang) {
  try {
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  } catch {
    /* ignore */
  }
}

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
  returnEmptyString: false,
});

export default i18n;
