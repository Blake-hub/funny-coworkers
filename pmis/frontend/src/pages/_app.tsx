import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ToastProvider } from '@/context/ToastContext';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Component {...pageProps} />
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
