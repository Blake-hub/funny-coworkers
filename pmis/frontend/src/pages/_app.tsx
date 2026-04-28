import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import '@/styles/globals.css';
import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    </ToastProvider>
  );
}
