'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '../../public/locales/en/common.json';
import zhCommon from '../../public/locales/zh/common.json';

const resources = {
  en: {
    common: enCommon,
  },
  zh: {
    common: zhCommon,
  },
};

const getInitialLanguage = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('language');
    if (saved && ['en', 'zh'].includes(saved)) {
      return saved;
    }
  }
  return 'en';
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: getInitialLanguage(),
      fallbackLng: 'en',
      debug: process.env.NODE_ENV === 'development',
      interpolation: {
        escapeValue: false,
      },
      ns: ['common'],
      defaultNS: 'common',
    });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return children;
}