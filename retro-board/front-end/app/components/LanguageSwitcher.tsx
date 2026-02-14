'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitcher() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation('common');

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={toggleMenu}
        className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-700 transition-smooth flex items-center gap-1"
      >
        <span className="text-sm font-medium">{i18n.language === 'en' ? 'EN' : '中文'}</span>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isMenuOpen && (
        <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg shadow-lg border border-neutral-200 py-2 z-10 dark:text-white">
          <button 
            className={`block px-4 py-2 text-sm w-full text-left hover:bg-neutral-100 dark:hover:bg-gray-700 ${i18n.language === 'en' ? 'bg-neutral-100 dark:bg-gray-700 font-medium' : ''}`}
            onClick={() => handleLanguageChange('en')}
          >
            English
          </button>
          <button 
            className={`block px-4 py-2 text-sm w-full text-left hover:bg-neutral-100 dark:hover:bg-gray-700 ${i18n.language === 'zh' ? 'bg-neutral-100 dark:bg-gray-700 font-medium' : ''}`}
            onClick={() => handleLanguageChange('zh')}
          >
            中文
          </button>
        </div>
      )}
    </div>
  );
}
