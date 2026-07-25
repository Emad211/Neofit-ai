import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { UserDataProvider } from '@/context/user-profile-context';
import { OnboardingProvider } from '@/context/onboarding-context';
import { SubscriptionProvider } from '@/context/subscription-context';
import { LocaleProvider } from '@/i18n/provider';
import { LanguageGate } from '@/components/language-gate';

export const metadata: Metadata = {
  applicationName: 'NeoFit AI',
  title: {
    default: 'NeoFit AI',
    template: '%s | NeoFit AI',
  },
  description: 'Personalized fitness and nutrition planning with secure bilingual AI assistance.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'NeoFit AI',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&family=Source+Code+Pro&family=Vazirmatn:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <LocaleProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <LanguageGate>
              <OnboardingProvider>
                <UserDataProvider>
                  <SubscriptionProvider>{children}</SubscriptionProvider>
                </UserDataProvider>
              </OnboardingProvider>
            </LanguageGate>
            <Toaster />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
