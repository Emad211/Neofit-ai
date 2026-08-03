import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'نئوفیت — تغذیه و تمرین',
    short_name: 'نئوفیت',
    description: 'وب‌اپلیکیشن فارسی ثبت تغذیه، تمرین و پیشرفت با دادهٔ نسخه‌دار IFKB',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f4f7f2',
    theme_color: '#176b47',
    lang: 'fa',
    dir: 'rtl',
    orientation: 'portrait-primary',
    categories: ['health', 'fitness', 'lifestyle'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
