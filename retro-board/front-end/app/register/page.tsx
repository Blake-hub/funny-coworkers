'use client';

import { useTranslation } from 'react-i18next';
import RegisterForm from '../components/auth/RegisterForm';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function RegisterPage() {
  const { t } = useTranslation('common');
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {t('auth.register.title')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
            {t('auth.register.orSignInPrefix')}{' '}
            <a href="/login" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
              {t('auth.register.orSignInLink')}
            </a>
          </p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
