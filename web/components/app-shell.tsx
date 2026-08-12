'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { NeoFitIcon, type NeoFitIconName } from '@/components/neofit-icons';
import { useAccountState } from '@/components/account-state';

const navigation: readonly { href: string; label: string; icon: NeoFitIconName }[] = [
  { href: '/today', label: 'امروز', icon: 'home' },
  { href: '/workout', label: 'تمرین', icon: 'workout' },
  { href: '/nutrition', label: 'تغذیه', icon: 'food' },
  { href: '/progress', label: 'پیشرفت', icon: 'chart' },
  { href: '/profile', label: 'پروفایل', icon: 'profile' },
];

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

      <header className="topbar topbar--product">
        <Link className="topbar-brand" href="/today" aria-label="NeoFit - امروز">
          <span className="topbar-brand__mark" aria-hidden="true">N</span>
          <span className="topbar-brand__copy"><strong>NeoFit</strong><small>مربی شخصی تو</small></span>
        </Link>
        <div className="topbar-actions">
          <Link className="coach-shortcut" href="/coach" aria-label="مربی NeoFit">
            <NeoFitIcon name="sparkle" size={20} />
          </Link>
          <Link
            className="avatar-button avatar-link"
            href="/profile"
            aria-label={account ? `پروفایل ${account.displayName}` : 'پروفایل'}
          >
            {accountInitial(account?.displayName ?? null, account?.email ?? null)}
          </Link>
        </div>
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
              <span className="bottom-nav__icon"><NeoFitIcon name={item.icon} /></span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
