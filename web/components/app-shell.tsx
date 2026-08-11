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
  if (pathname.startsWith('/program')) return 'برنامه من';
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

  const showStatus = !online || Boolean(loadError) || !account;
  const statusClass = !online || loadError ? 'offline-note' : 'offline-note offline-note--trusted';
  let statusText: ReactNode = null;

  if (!online) {
    statusText = 'اتصال اینترنت قطع است. بعضی تغییرات تا زمان اتصال دوباره ذخیره نمی‌شوند.';
  } else if (loadError) {
    statusText = 'بخشی از اطلاعات حساب در دسترس نیست. صفحه را دوباره بارگذاری کن.';
  } else if (!account && configured) {
    statusText = <><span>برای ذخیره اطلاعات و دریافت برنامه شخصی وارد حساب شو.</span> <Link href="/auth">ورود یا ساخت حساب</Link></>;
  } else if (!account) {
    statusText = 'ورود به حساب در این محیط در دسترس نیست.';
  }

  return (
    <main className="app-frame" id="main-content">
      <a className="skip-link" href="#screen-content">رفتن به محتوای اصلی</a>
      <div className="app-frame__halo" aria-hidden="true" />
      <header className="topbar">
        <div>
          <p className="eyebrow">NeoFit</p>
          <h1>{pageTitle(pathname, account?.displayName ?? null)}</h1>
        </div>
        <Link
          className="avatar-button avatar-link"
          href="/profile"
          aria-label={account ? `پروفایل ${account.displayName}` : 'پروفایل'}
        >
          {accountInitial(account?.displayName ?? null, account?.email ?? null)}
        </Link>
      </header>

      {showStatus ? (
        <div className={statusClass} role="status" data-account-state={account ? 'authenticated' : 'guest'}>
          <NeoFitIcon name={!online || loadError ? 'offline' : 'profile'} size={17} />
          <span>{statusText}</span>
        </div>
      ) : null}

      <div className="screen-content" id="screen-content" tabIndex={-1}>{children}</div>

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
