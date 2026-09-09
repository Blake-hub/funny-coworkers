import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { AppLang } from './types';
import { zh } from './locales/zh';
import { en } from './locales/en';

export const LANG_STORAGE_KEY = 'pmis-lang';

/**
 * 语言检测：localStorage 手动选择优先，其次跟随浏览器语言，最后回退中文。
 * 注意：i18n 初始化时固定 lng='zh'，保证 SSR HTML 与客户端首次渲染一致（无 hydration 警告）；
 * 客户端挂载后由 useClientLanguage 在首帧绘制前切换到检测到的语言。
 */
export function detectLanguage(): AppLang {
  if (typeof window === 'undefined') return 'zh';
  try {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    /* localStorage 不可用时忽略 */
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
