import '@fontsource-variable/vazirmatn/wght.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import './refinements.css';

export const metadata: Metadata = {
  title: 'NeoFit | نئوفیت',
  description: 'نمونهٔ فارسی و راست‌به‌چپ محصول تغذیه و تمرین نئوفیت',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f4f7f2',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
