import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import LanguageSwitcher from '@/components/Layout/LanguageSwitcher';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

interface LoginProps {
  reason?: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<LoginProps>> {
  const reason = context.query.reason as string;
  const knownReasons = ['not-logged-in', 'session-expired', 'invalid-token', 'auth-error'];
  if (reason && knownReasons.includes(reason)) {
    return { props: { reason } };
  }
  return { props: {} };
}

const REASON_KEY: Record<string, string> = {
  'not-logged-in': 'login.reasonNotLoggedIn',
  'session-expired': 'login.reasonSessionExpired',
  'invalid-token': 'login.reasonInvalidToken',
  'auth-error': 'login.reasonAuthError',
};
const REASON_TYPE: Record<string, 'info' | 'warning' | 'error'> = {
  'not-logged-in': 'info',
  'session-expired': 'warning',
  'invalid-token': 'error',
  'auth-error': 'error',
};

export default function Login({ reason }: LoginProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const message = reason
    ? { type: REASON_TYPE[reason] || 'info', text: t(REASON_KEY[reason] || 'login.reasonNotLoggedIn') }
    : null;

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
      setError(t('login.fillAll'));
      setIsLoading(false);
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      router.push('/');
    } else {
      setError(result.error || t('login.invalidCredentials'));
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 relative">
      <div className="absolute top-4 right-4">
        <div className="bg-white/10 backdrop-blur rounded-lg p-1">
          <LanguageSwitcher compact />
        </div>
      </div>
      <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-4">
        {/* Logo & Title */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Lock className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">PMIS</h1>
          <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base">{t('login.subtitle')}</p>
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
          <div className="mb-3 sm:mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">{t('login.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4 sm:mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">{t('login.password')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                className="w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm sm:text-base"
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 sm:p-3 mb-4 sm:mb-6">
            <p className="text-xs sm:text-sm text-blue-700">
              <span className="font-medium">{t('login.demoHint')}</span>
              <br />
              {t('login.email')}: <code className="bg-white px-1 rounded">admin@pmis.com</code>
              <br />
              {t('login.password')}: <code className="bg-white px-1 rounded">password</code>
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2.5 sm:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('login.signingIn')}
              </>
            ) : (
              t('login.signIn')
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs sm:text-sm mt-4 sm:mt-6">
          {t('login.footer')}
        </p>
      </div>
    </div>
  );
}
