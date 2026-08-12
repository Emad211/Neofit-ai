'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NeoFitIcon } from '@/components/neofit-icons';
import { useAccountState } from '@/components/account-state';
import { createClient } from '@/lib/supabase/client';

export function ProfileScreen() {
  const router = useRouter();
  const { account, configured } = useAccountState();
  const [message, setMessage] = useState('');
  const [displayName, setDisplayName] = useState(account?.displayName ?? '');
  const [working, setWorking] = useState(false);

  useEffect(() => { setDisplayName(account?.displayName ?? ''); }, [account?.displayName]);

  async function saveDisplayName() {
    if (!account || working) return;
    const name = displayName.trim();
    if (!name || name.length > 80) { setMessage('نام نمایشی باید بین ۱ تا ۸۰ کاراکتر باشد.'); return; }
    setWorking(true); setMessage('');
    const supabase = createClient();
    const { error } = await supabase.from('profiles').upsert({ id: account.id, display_name: name, locale: 'fa', timezone: account.timezone });
    if (error) { setMessage('نام ذخیره نشد. دوباره تلاش کن.'); setWorking(false); return; }
    setMessage('نام نمایشی ذخیره شد.'); setWorking(false); router.refresh();
  }

  return <section className="page-stack" aria-labelledby="profile-heading">
    <div className="section-heading">
      <div><p className="section-kicker">حساب من</p><h2 id="profile-heading">پروفایل</h2></div>
      <span className="status-pill status-pill--soft"><NeoFitIcon name={account ? 'check' : 'profile'} size={15} />{account ? 'حساب فعال' : 'مهمان'}</span>
    </div>

    <article className="profile-identity-card">
      <span className="profile-identity-card__avatar">{(account?.displayName || account?.email || 'م').slice(0, 1)}</span>
      <div><h3>{account?.displayName ?? 'کاربر مهمان'}</h3><p>{account?.email ?? 'اطلاعات فقط روی این دستگاه'}</p></div>
      <span className="profile-identity-card__state">{account ? 'وارد شده' : 'بدون حساب'}</span>
    </article>

    {account ? (
      <article className="account-edit-card">
        <div><span>اطلاعات حساب</span><h3>نام نمایشی</h3></div>
        <label htmlFor="profile-display-name">نامی که در NeoFit می‌بینی</label>
        <input id="profile-display-name" value={displayName} minLength={1} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} />
        <button type="button" disabled={working} onClick={saveDisplayName}>{working ? 'در حال ذخیره...' : 'ذخیره نام'}</button>
        {message ? <p className="local-data-card__message" role="status">{message}</p> : null}
      </article>
    ) : (
      <article className="account-connect-card">
        <div>
          <span>حساب NeoFit</span>
          <h3>{configured ? 'برنامه شخصی‌ات را با حساب نگه دار' : 'ورود موقتاً در دسترس نیست'}</h3>
          <p>{configured ? 'برای ذخیره دائمی اطلاعات و دریافت برنامه شخصی وارد شو یا حساب بساز.' : 'کمی بعد دوباره تلاش کن.'}</p>
        </div>
        {configured ? <Link href="/auth">ورود یا ساخت حساب</Link> : null}
      </article>
    )}

    <Link className="profile-plan-card" href="/onboarding/review">
      <div><span>شخصی‌سازی برنامه</span><h3>هدف، سلامت و شرایط تمرین</h3><p>هدف‌ها، اطلاعات سلامت، آسیب‌ها، زمان تمرین و ترجیحاتت را مرور یا ویرایش کن.</p></div>
      <NeoFitIcon name="sparkle" size={28} />
    </Link>

    <nav className="profile-links" aria-label="بخش‌های پروفایل">
      <Link href="/profile/security"><span><NeoFitIcon name="profile" />امنیت حساب</span><NeoFitIcon name="chevron" /></Link>
      <Link href="/coach"><span><NeoFitIcon name="sparkle" />مربی NeoFit</span><NeoFitIcon name="chevron" /></Link>
      <Link href="/onboarding"><span><NeoFitIcon name="profile" />هدف، سلامت و آسیب‌ها</span><NeoFitIcon name="chevron" /></Link>
      <Link href="/progress"><span><NeoFitIcon name="chart" />اندازه‌گیری و پیشرفت</span><NeoFitIcon name="chevron" /></Link>
      <Link href="/workout"><span><NeoFitIcon name="workout" />برنامه تمرین</span><NeoFitIcon name="chevron" /></Link>
      <Link href="/nutrition"><span><NeoFitIcon name="food" />تغذیه و ثبت غذا</span><NeoFitIcon name="chevron" /></Link>
      <Link href="/profile/ai"><span><NeoFitIcon name="sparkle" />تنظیمات مربی هوشمند</span><NeoFitIcon name="chevron" /></Link>
      <Link href="/profile/integrations"><span><NeoFitIcon name="sparkle" />اتصال‌ها و ابزارها</span><NeoFitIcon name="chevron" /></Link>
    </nav>

    {account ? <form action="/auth/signout" method="post" className="signout-form"><button type="submit">خروج از این دستگاه</button></form> : null}
  </section>;
}
