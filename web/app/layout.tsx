import '@fontsource-variable/vazirmatn/wght.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { PwaRegister } from '@/components/pwa-register';
import { deploymentEnvironment, publicAppUrl } from '@/lib/environment';
import './globals.css';
import './refinements.css';
import './system-pages.css';
import './integration.css';
import './progress-integration.css';
import './profile-integration.css';
import './ai-provider-settings.css';
import './workout-player.css';
import './onboarding.css';
import './coach.css';
import './account-integration.css';
import './auth.css';

export const metadata: Metadata = {
  metadataBase: new URL(publicAppUrl),
  title: 'NeoFit | نئوفیت',
  description: 'وب‌اپلیکیشن فارسی و راست‌به‌چپ ثبت تغذیه و تمرین نئوفیت',
  applicationName: 'نئوفیت',
  manifest: '/manifest.webmanifest',
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: { capable: true, title: 'نئوفیت', statusBarStyle: 'default' },
  other: { 'mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#176b47', colorScheme: 'light' };

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="fa" dir="rtl"><body data-deployment-environment={deploymentEnvironment}>{children}<PwaRegister /></body></html>;
}
