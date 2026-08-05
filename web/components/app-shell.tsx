'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { NeoFitIcon, type NeoFitIconName } from '@/components/neofit-icons';

const navigation: readonly { href: string; label: string; icon: NeoFitIconName }[] = [
  { href: '/today', label: 'امروز', icon: 'home' },
  { href: '/nutrition', label: 'تغذیه', icon: 'food' },
  { href: '/workout', label: 'تمرین', icon: 'workout' },
  { href: '/progress', label: 'پیشرفت', icon: 'chart' },
  { href: '/profile', label: 'پروفایل', icon: 'profile' },
];

function pageTitle(pathname: string): string {
  if (pathname.startsWith('/nutrition/plan')) return 'برنامهٔ غذایی';
  if (pathname.startsWith('/nutrition')) return 'تغذیه';
  if (pathname.startsWith('/workout')) return 'تمرین';
  if (pathname.startsWith('/progress')) return 'پیشرفت';
  if (pathname.startsWith('/profile')) return 'پروفایل';
  return 'سلام عماد، روزت چطوره؟';
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(window.navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <main className="app-frame" id="main-content">
      <div className="app-frame__halo" aria-hidden="true" />
      <header className="topbar">
        <div>
          <p className="eyebrow">NeoFit</p>
          <h1>{pageTitle(pathname)}</h1>
        </div>
        <Link className="avatar-button avatar-link" href="/profile" aria-label="پروفایل عماد">ع</Link>
      </header>

      <div className={online ? 'offline-note offline-note--trusted' : 'offline-note'} role="status">
        <NeoFitIcon name={online ? 'check' : 'offline'} size={17} />
        <span>
          {online
            ? 'مقادیر تغذیه‌ای از کاتالوگ معتبر نئوفیت محاسبه می‌شوند.'
            : 'آفلاین هستی؛ داده‌های همین دستگاه همچنان در دسترس‌اند.'}
        </span>
      </div>

      <div className="screen-content">{children}</div>

      <nav className="bottom-nav" aria-label="ناوبری اصلی">
        {navigation.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              href={item.href}
              key={item.href}
              className={active ? 'bottom-nav__item is-active' : 'bottom-nav__item'}
              aria-current={active ? 'page' : undefined}
            >
              <NeoFitIcon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
