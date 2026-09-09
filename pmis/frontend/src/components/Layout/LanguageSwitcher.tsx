import { useEffect, useRef, useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '@/i18n/useClientLanguage';
import type { AppLang } from '@/i18n/types';

const OPTIONS: { code: AppLang; label: string }[] = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
];

export default function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const current = (i18n.language?.startsWith('zh') ? 'zh' : 'en') as AppLang;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
        title={t('common.language')}
        aria-label={t('common.language')}
      >
        <Globe className="w-5 h-5 text-gray-600" />
        {!compact && <span className="text-xs text-gray-600 hidden sm:inline">{current === 'zh' ? '中' : 'EN'}</span>}
      </button>
      {open && (
        <div className="absolute top-full mt-2 right-0 w-32 bg-white border border-gray-200 rounded-lg shadow-xl z-50 py-1">
          {OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => {
                changeAppLanguage(opt.code);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors ${
                current === opt.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{opt.label}</span>
              {current === opt.code && <Check className="w-4 h-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
