import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AdminFlow - Plataforma de gestión',
  description: 'Gestión integral en español.',
  appleWebApp: {
    capable: true,
    title: 'AdminFlow',
    statusBarStyle: 'default',
  },
};

import { Toaster } from '@/components/ui/sonner';
import { SplashScreen } from '@/components/ui/splash-screen';
import Providers from './providers';
import Script from 'next/script';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/assets/patchpanel/rj45.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased overscroll-none`}>
        <Providers>
          <SplashScreen />
          {children}
          <Toaster />
        </Providers>
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(reg => {
                  reg.update();
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
