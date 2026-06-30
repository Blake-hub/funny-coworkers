'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { ThemeContext } from '../../contexts/ThemeContext';
import LanguageSwitcher from '../LanguageSwitcher';

interface SidebarProps {
  onCreateBoard?: () => void;
  isMobile?: boolean;
  onMobileToggle?: () => void;
}

export default function Sidebar({ onCreateBoard, isMobile, onMobileToggle }: SidebarProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('my-boards');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const themeContext = useContext(ThemeContext);
  const { theme, toggleTheme } = themeContext || { theme: 'light' as 'light' | 'dark', toggleTheme: () => {} };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    setIsAuthenticated(!!token);
    setUsername(storedUsername || '');
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };

    if (isProfileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
    setIsProfileMenuOpen(false);
    router.push('/login');
  };

  const navigationItems = [
    {
      id: 'my-boards',
      label: t('sidebar.myBoards'),
      href: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'team-boards',
      label: t('sidebar.teamBoards'),
      href: '/teams',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: t('sidebar.settings'),
      href: '/settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'help',
      label: t('sidebar.helpAndSupport'),
      href: '/help',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const recentBoards = [
    { id: 1, name: 'Sprint 1 Retro' },
    { id: 2, name: 'Team Planning' },
    { id: 3, name: 'Q1 Review' },
  ];

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onMobileToggle}
        />
      )}

      <aside
        className={`
          bg-white border-r border-neutral-200 dark:bg-gray-900 dark:border-gray-800 transition-all duration-300 ease-in-out
          flex flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobile ? 'fixed inset-y-0 left-0 z-40 lg:relative lg:static' : ''}
          ${isMobile ? '' : 'hidden lg:flex'}
        `}
      >
        <div className="p-4 border-b border-neutral-200 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 shrink-0 bg-primary rounded-lg flex items-center justify-center text-white font-medium">
              RB
            </div>
            {!isCollapsed && !isMobile && (
              <h1 className="text-xl font-medium text-primary truncate">Retro Board</h1>
            )}
          </div>
          {isMobile ? (
            <button
              onClick={onMobileToggle}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth shrink-0"
              aria-label="Close menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth shrink-0"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-neutral-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="p-4 border-b border-neutral-200 dark:border-gray-800 shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder={t('sidebar.searchBoards')}
                className="input-field w-full text-sm"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}

        <nav className="p-4 flex-1 overflow-y-auto min-h-0">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item.id);
                if ('href' in item) {
                  router.push(item.href);
                }
                if (isMobile && onMobileToggle) {
                  onMobileToggle();
                }
              }}
              className={`sidebar-item w-full ${activeItem === item.id ? 'sidebar-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}

          {!isCollapsed && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-400">
                  {t('sidebar.recentBoards')}
                </h3>
                <button className="text-primary hover:text-primary/80 text-sm">
                  {t('sidebar.viewAll')}
                </button>
              </div>
              <div className="space-y-2">
                {recentBoards.map((board) => (
                  <button
                    key={board.id}
                    className="w-full text-left p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth text-sm"
                    onClick={() => {
                      if (isMobile && onMobileToggle) {
                        onMobileToggle();
                      }
                    }}
                  >
                    {board.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="border-t border-neutral-200 dark:border-gray-800 p-3 shrink-0">
          {isAuthenticated ? (
            <>
              <div className={`flex ${isCollapsed ? 'flex-col items-center gap-2' : 'flex-col gap-3'}`}>
                <div className={`flex ${isCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between gap-2'}`}>
                  <button
                    className="relative p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth"
                    title={t('header.notifications') || 'Notifications'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
                  </button>

                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth"
                    title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                  >
                    {theme === 'light' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500 dark:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </button>

                  {isCollapsed ? (
                    <LanguageSwitcher />
                  ) : (
                    <div className="-mr-1">
                      <LanguageSwitcher />
                    </div>
                  )}
                </div>

                {!isCollapsed ? (
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth"
                    >
                      <div className="w-8 h-8 shrink-0 bg-secondary rounded-full flex items-center justify-center text-white font-medium">
                        {username ? username.charAt(0).toUpperCase() + (username.length > 1 ? username.charAt(1).toUpperCase() : '') : 'US'}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">{username || t('header.userName')}</div>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isProfileMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg shadow-lg border border-neutral-200 py-2 z-10 dark:text-white animate-scale-in">
                        <a href="/profile" className="block px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-gray-700">
                          {t('header.profile')}
                        </a>
                        <a href="/settings" className="block px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-gray-700">
                          {t('header.settings')}
                        </a>
                        <div className="border-t border-neutral-200 dark:border-gray-700 my-1"></div>
                        <button
                          className="block px-4 py-2 text-sm text-error hover:bg-neutral-100 dark:hover:bg-gray-700 w-full text-left"
                          onClick={handleLogout}
                        >
                          {t('header.logout')}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                      className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-gray-800 transition-smooth block"
                      title={username || t('header.userName') || 'User profile'}
                    >
                      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-medium">
                        {username ? username.charAt(0).toUpperCase() + (username.length > 1 ? username.charAt(1).toUpperCase() : '') : 'US'}
                      </div>
                    </button>
                    {isProfileMenuOpen && (
                      <div className="absolute bottom-0 left-full ml-2 w-48 bg-white dark:bg-gray-800 dark:border-gray-700 rounded-lg shadow-lg border border-neutral-200 py-2 z-10 dark:text-white animate-scale-in">
                        <div className="px-4 py-2 border-b border-neutral-200 dark:border-gray-700 mb-1">
                          <div className="text-sm font-medium truncate">{username || t('header.userName')}</div>
                        </div>
                        <a href="/profile" className="block px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-gray-700">
                          {t('header.profile')}
                        </a>
                        <a href="/settings" className="block px-4 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-gray-700">
                          {t('header.settings')}
                        </a>
                        <div className="border-t border-neutral-200 dark:border-gray-700 my-1"></div>
                        <button
                          className="block px-4 py-2 text-sm text-error hover:bg-neutral-100 dark:hover:bg-gray-700 w-full text-left"
                          onClick={handleLogout}
                        >
                          {t('header.logout')}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={`flex ${isCollapsed ? 'flex-col items-center gap-2' : 'items-center justify-between gap-2'}`}>
              {!isCollapsed ? (
                <LanguageSwitcher />
              ) : null}
              {isCollapsed && (
                <LanguageSwitcher />
              )}
              {!isCollapsed && (
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 ease-in-out text-sm"
                  onClick={() => {
                    router.push('/login');
                    if (isMobile && onMobileToggle) {
                      onMobileToggle();
                    }
                  }}
                >
                  {t('sidebar.login')}
                </button>
              )}
              {isCollapsed && (
                <button
                  className="p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-smooth"
                  onClick={() => {
                    router.push('/login');
                    if (isMobile && onMobileToggle) {
                      onMobileToggle();
                    }
                  }}
                  title={t('sidebar.login')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
