import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

interface LoginProps {
  message?: { type: 'info' | 'warning' | 'error'; text: string };
}

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<LoginProps>> {
  const reason = context.query.reason as string;
  
  if (reason) {
    const messages: Record<string, { type: 'info' | 'warning' | 'error'; text: string }> = {
      'not-logged-in': { type: 'info', text: 'Please sign in to access the application.' },
      'session-expired': { type: 'warning', text: 'Your session has expired. Please sign in again.' },
      'invalid-token': { type: 'error', text: 'Invalid session detected. Please sign in again.' },
      'auth-error': { type: 'error', text: 'Authentication error. Please sign in again.' },
    };
    
    const message = messages[reason];
    if (message) {
      return {
        props: { message },
      };
    }
  }

  return {
    props: {},
  };
}

export default function Login({ message: initialMessage }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'info' | 'warning' | 'error'; text: string } | null>(initialMessage || null);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || 'Invalid email or password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">PMIS</h1>
          <p className="text-gray-500 mt-2">Project Manager Information System</p>
        </div>

        {/* Info Message */}
        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg mb-6 ${
            message.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-600' :
            message.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-700' :
            'bg-red-50 border border-red-200 text-red-600'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{message.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Fake Credentials Hint */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-700">
              <span className="font-medium">Demo credentials:</span>
              <br />
              Email: <code className="bg-white px-1 rounded">admin@pmis.com</code>
              <br />
              Password: <code className="bg-white px-1 rounded">password</code>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          © 2026 PMIS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
