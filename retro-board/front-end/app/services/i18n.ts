import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

// Configure i18n
i18n
  .use(Backend) // Load translations from the public/locales folder
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language if the current language is not available
    debug: process.env.NODE_ENV === 'development', // Enable debug mode in development
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json', // Path to the translation files
    },
    ns: ['common'], // Namespaces
    defaultNS: 'common', // Default namespace
  });

export default i18n;