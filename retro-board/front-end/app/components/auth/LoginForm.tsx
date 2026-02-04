'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '../../services/api';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authApi.login({ username, password });
      
      // Store token and username in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username || username);
      
      // Redirect to dashboard on success
      window.location.href = '/dashboard';
    } catch (err) {
      // Display specific error message from API
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Invalid username or password');
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-3 rounded-lg">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-2 dark:text-white">
          Username
        </label>
        <input
          type="text"
          id="username"
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2 dark:text-white">
          Password
        </label>
        <input
          type="password"
          id="password"
          className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-blue-500 focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm dark:text-white">
            Remember me
          </label>
        </div>
        <div className="text-sm">
          <Link href="/forgot-password" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
            Forgot password?
          </Link>
        </div>
      </div>
      <div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 ease-in-out w-full"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
      <div className="text-center text-sm dark:text-white">
        <span>Don't have an account? </span>
        <Link href="/register" className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
          Register
        </Link>
      </div>
    </form>
  );
}