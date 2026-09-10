import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ToastProvider } from '@/context/ToastContext';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import '@/i18n/config';
import { useClientLanguage } from '@/i18n/useClientLanguage';
import '@/styles/globals.css';
import Head from 'next/head';
import type { AppProps } from 'next/app';

function I18nGate({ children }: { children: React.ReactNode }) {
  useClientLanguage();
  return <>{children}</>;
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>
      <I18nGate>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <Component {...pageProps} />
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </I18nGate>
    </ErrorBoundary>
  );
}
