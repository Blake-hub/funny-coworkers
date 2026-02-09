import './styles/globals.css';
import React from 'react';
import type { Metadata } from 'next';
import { ThemeProvider } from './contexts/ThemeContext';

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
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}