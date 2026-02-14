import { useTranslation as useTranslationBase } from 'react-i18next';

export function useTranslation(namespace?: string | string[]) {
  const { t, i18n, ...rest } = useTranslationBase(namespace);
  return { t, i18n, ...rest };
}