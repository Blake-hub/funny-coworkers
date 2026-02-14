import { jest } from '@jest/globals';

const useTranslation = () => {
  return {
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: jest.fn(),
    },
  };
};

export { useTranslation };
