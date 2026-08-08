'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { NeoFitIcon, type NeoFitIconName } from '@/components/neofit-icons';
import { useAccountState } from '@/components/account-state';

const navigation: readonly { href: string; label: string; icon: NeoFitIconName }[] = [
  { href: '/today', label: 'امروز', icon: 'home' },
  { href: '/nutrition', label: 'تغذیه', icon: 'food' },
  { href: '/workout', label: 'تمرین', icon: 'workout' },
  { href: '/progress', label: 'پیشرفت', icon: 'chart' },
  { href: '/profile', label: 'پروفایل', icon: 'profile' },
];

function pageTitle(pathname: string, displayName: string | null): string {
  if (pathname.startsWith('/nutrition/plan')) return 'برنامهٔ غذایی';
  if (pathname.startsWith('/nutrition')) return 'تغذیه';
  if (pathname.startsWith('/workout')) return 'تمرین';
  if (pathname.startsWith('/progress')) return 'پیشرفت';
  if (pathname.startsWith('/coach')) return 'مربی نئوفیت';
  if (pathname.startsWith('/profile')) return 'پروفایل';
  return displayName ? `سلام ${displayName}، روزت چطوره؟` : 'سلام، روزت چطوره؟';
}

function accountInitial(displayName: string | null, email: string | null): string {
  const source = displayName?.trim() || email?.trim() || 'ن';
  return source.slice(0, 1).toLocaleUpperCase('fa-IR');
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { account, configured, loadError } = useAccountState();
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

  const statusClass = !online || loadError
    ? 'offline-note'
    : 'offline-note offline-note--trusted';
  let statusText: ReactNode;
  if (!online) {
    statusText = account
      ? 'آفلاین هستی؛ داده‌های حساب هنگام اتصال دوباره خوانده می‌شوند.'
      : 'آفلاین هستی؛ داده‌های مهمان همین مرورگر همچنان در دسترس‌اند.';
  } else if (loadError) {
    statusText = loadError;
  } else if (account) {
    statusText = 'حساب متصل است؛ هر بخش فقط داده‌های موردنیاز خودش را می‌خواند.';
  } else if (configured) {
    statusText = <><span>حالت مهمان فعال است.</span> <Link href="/auth">ورود برای ذخیره در حساب</Link></>;
  } else {
    statusText = 'حالت Preview محلی؛ اتصال حساب برای این محیط تنظیم نشده است.';
  }

  return (
    <main className="app-frame" id="main-content">
      <div className="app-frame__halo" aria-hidden="true" />
      <header className="topbar">
        <div>
          <p className="eyebrow">NeoFit</p>
          <h1>{pageTitle(pathname, account?.displayName ?? null)}</h1>
        </div>
        <Link
          className="avatar-button avatar-link"
          href="/profile"
          aria-label={account ? `پروفایل ${account.displayName}` : 'پروفایل مهمان'}
        >
          {accountInitial(account?.displayName ?? null, account?.email ?? null)}
        </Link>
      </header>

      <div className={statusClass} role="status" data-account-state={account ? 'authenticated' : 'guest'}>
        <NeoFitIcon name={!online || loadError ? 'offline' : 'check'} size={17} />
        <span>{statusText}</span>
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
