import { useEffect, useLayoutEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { detectLanguage, persistLanguage } from './config';
import type { AppLang } from './types';

// SSR 时回退到 useEffect，避免 "useLayoutEffect does nothing on the server" 警告
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * 客户端挂载后，在首帧绘制前把语言从初始 'zh' 切换到检测/记忆的语言。
 * i18n 初始化固定为 'zh'（与 SSR 一致，避免 hydration 警告），
 * 这里用 useLayoutEffect 保证切换发生在浏览器绘制前，用户看不到闪烁。
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
