import './styles/globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { ThemeProvider } from './contexts/ThemeContext';
import { I18nProvider } from './providers/I18nProvider';
import { ClientOnly } from './components/ClientOnly';

export const metadata = {
  title: 'Retro Board App',
  description: 'Collaborative retro board application for agile teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Theme initialization moved to ThemeProvider client-side */}
      </head>
      <body>
        <ClientOnly>
          <ThemeProvider>
            <I18nProvider>
              {children}
            </I18nProvider>
          </ThemeProvider>
        </ClientOnly>
      </body>
    </html>
  );
}