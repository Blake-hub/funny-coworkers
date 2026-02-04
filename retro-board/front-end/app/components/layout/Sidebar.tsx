'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  onCreateBoard?: () => void;
  isMobile?: boolean;
  onMobileToggle?: () => void;
}

export default function Sidebar({ onCreateBoard, isMobile, onMobileToggle }: SidebarProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('my-boards');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    router.push('/login');
  };

  const navigationItems = [
    {
      id: 'my-boards',
      label: 'My Boards',
      href: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'team-boards',
      label: 'Team Boards',
      href: '/teams',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      id: 'settings',
      label: 'Settings',
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
      label: 'Help & Support',
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
      {/* Mobile backdrop */}
      {isMobile && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onMobileToggle}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          bg-white border-r border-neutral-200 dark:bg-gray-900 dark:border-gray-800 transition-all duration-300 ease-in-out 
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobile ? 'fixed inset-y-0 left-0 z-40 lg:relative lg:static' : ''}
          ${isMobile ? '' : 'hidden lg:block'}
        `}
      >
        <div className="p-4 border-b border-neutral-200 dark:border-gray-800 flex items-center justify-between">
          {isMobile ? (
            <button
              onClick={onMobileToggle}
              className="p-2 rounded-full hover:bg-neutral-200 transition-smooth"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-full hover:bg-neutral-200 transition-smooth"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-neutral-500 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          )}
          {!isCollapsed && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search boards..."
                className="input-field w-full text-sm"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          )}
        </div>
        <nav className="p-4">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item.id);
                if ('href' in item) {
                  router.push(item.href);
                }
                // Close mobile sidebar after navigation
                if (isMobile && onMobileToggle) {
                  onMobileToggle();
                }
              }}
              className={`sidebar-item ${activeItem === item.id ? 'sidebar-item-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
        {!isCollapsed && (
          <div className="p-4 border-t border-neutral-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-neutral-400">Recent Boards</h3>
              <button className="text-primary hover:text-primary/80 text-sm">
                View All
              </button>
            </div>
            <div className="space-y-2">
              {recentBoards.map((board) => (
                <button
                  key={board.id}
                  className="w-full text-left p-2 rounded-lg hover:bg-neutral-200 transition-smooth text-sm"
                  onClick={() => {
                    // Close mobile sidebar after selecting board
                    if (isMobile && onMobileToggle) {
                      onMobileToggle();
                    }
                  }}
                >
                  {board.name}
                </button>
              ))}
            </div>
            <button 
              className="mt-6 w-full btn-primary text-sm"
              onClick={() => {
                onCreateBoard?.();
                // Close mobile sidebar after creating board
                if (isMobile && onMobileToggle) {
                  onMobileToggle();
                }
              }}
            >
              + Create New Board
            </button>
            {isAuthenticated ? (
              <button 
                className="mt-4 w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 ease-in-out text-sm"
                onClick={() => {
                  handleLogout();
                  // Close mobile sidebar after logout
                  if (isMobile && onMobileToggle) {
                    onMobileToggle();
                  }
                }}
              >
                Logout
              </button>
            ) : (
              <button 
                className="mt-4 w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 ease-in-out text-sm"
                onClick={() => {
                  router.push('/login');
                  // Close mobile sidebar after navigating to login
                  if (isMobile && onMobileToggle) {
                    onMobileToggle();
                  }
                }}
              >
                Login
              </button>
            )}
          </div>
        )}
        {isCollapsed && (
          <div className="p-4 border-t border-neutral-200 dark:border-gray-800 flex justify-center">
            <button 
              className="btn-primary rounded-full p-3"
              onClick={() => {
                onCreateBoard?.();
                // Close mobile sidebar after creating board
                if (isMobile && onMobileToggle) {
                  onMobileToggle();
                }
              }}
              title="Create New Board"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}