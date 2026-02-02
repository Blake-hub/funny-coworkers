'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HeaderBar() {
  const router = useRouter();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const storedUsername = localStorage.getItem('username');
    setIsAuthenticated(!!token);
    setUsername(storedUsername || '');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername('');
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-medium">
            RB
          </div>
          <h1 className="text-xl font-medium text-primary">Retro Board</h1>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="/dashboard" className="text-primary font-medium">
            Dashboard
          </a>
          <a href="/teams" className="text-neutral-400 hover:text-neutral-500">
            Teams
          </a>
          <a href="/templates" className="text-neutral-400 hover:text-neutral-500">
            Templates
          </a>
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <button className="relative p-2 rounded-full hover:bg-neutral-200 transition-smooth">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
            </button>
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-full hover:bg-neutral-200 transition-smooth"
              >
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-white font-medium">
                  {username ? username.charAt(0).toUpperCase() + username.charAt(1).toUpperCase() : 'US'}
                </div>
                <span className="text-sm font-medium">{username || 'User Name'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isProfileMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-10">
                  <a href="/profile" className="block px-4 py-2 text-sm hover:bg-neutral-100">
                    Profile
                  </a>
                  <a href="/settings" className="block px-4 py-2 text-sm hover:bg-neutral-100">
                    Settings
                  </a>
                  <div className="border-t border-neutral-200 my-1"></div>
                  <button 
                    className="block px-4 py-2 text-sm text-error hover:bg-neutral-100 w-full text-left"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 ease-in-out"
            onClick={() => router.push('/login')}
          >
            Login
          </button>
        )}
      </div>
    </header>
  );
}