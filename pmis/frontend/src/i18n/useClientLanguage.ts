import { useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { detectLanguage, persistLanguage } from './config';
import type { AppLang } from './types';

// Fall back to useEffect during SSR to avoid the "useLayoutEffect does nothing on the server" warning
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * After the client mounts, switch the language from the initial 'zh' to the detected/persisted
 * language before the first paint. i18n initializes to 'zh' (matching SSR to avoid hydration
 * warnings); useLayoutEffect ensures the switch happens before the browser paints, so the user
 * sees no flicker.
 */
export function useClientLanguage() {
  const { i18n: i18nInstance } = useTranslation();
  useIsomorphicLayoutEffect(() => {
    const detected = detectLanguage();
    if (i18nInstance.language !== detected) {
      i18nInstance.changeLanguage(detected);
    }
    persistLanguage(detected);
  }, [i18nInstance]);
}

export function changeAppLanguage(lang: AppLang) {
  i18n.changeLanguage(lang);
  persistLanguage(lang);
}
