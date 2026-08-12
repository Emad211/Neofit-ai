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

  return <section className="page-stack profile-page" aria-labelledby="profile-heading">
    <div className="section-heading profile-page__heading">
      <div><p className="section-kicker">حساب من</p><h2 id="profile-heading">پروفایل</h2></div>
    </div>

    <article className="profile-identity-card">
      <span className="profile-identity-card__avatar">{(account?.displayName || account?.email || 'م').slice(0, 1)}</span>
      <div><h3>{account?.displayName ?? 'کاربر مهمان'}</h3><p>{account?.email ?? 'برای برنامه شخصی وارد حساب شو'}</p></div>
      <span className="profile-identity-card__state">{account ? 'فعال' : 'مهمان'}</span>
    </article>

    {!account ? (
      <article className="account-connect-card">
        <div>
          <span>حساب NeoFit</span>
          <h3>{configured ? 'برنامه و پیشرفتت را نگه دار' : 'ورود موقتاً در دسترس نیست'}</h3>
          <p>{configured ? 'برای ذخیره دائمی اطلاعات و دریافت برنامه شخصی وارد شو یا حساب بساز.' : 'کمی بعد دوباره تلاش کن.'}</p>
        </div>
        {configured ? <Link href="/auth">ورود یا ساخت حساب</Link> : null}
      </article>
    ) : null}

    <Link className="profile-coach-card" href="/coach">
      <span className="profile-coach-card__icon"><NeoFitIcon name="sparkle" size={22} /></span>
      <div><span>مربی NeoFit</span><h3>سؤال داری؟ از مربی بپرس</h3><p>درباره تمرین، تغذیه و روندت پاسخ مرتبط با اطلاعات خودت بگیر.</p></div>
      <NeoFitIcon name="chevron" size={19} />
    </Link>

    <Link className="profile-plan-card" href="/onboarding/review">
      <div><span>شخصی‌سازی برنامه</span><h3>هدف، سلامت و شرایط تمرین</h3><p>اطلاعاتی که برنامه بر اساس آن‌ها ساخته می‌شود را مرور یا ویرایش کن.</p></div>
      <NeoFitIcon name="chevron" size={20} />
    </Link>

    <section className="profile-link-group" aria-labelledby="profile-data-heading">
      <div className="profile-link-group__heading"><span>برنامه و داده‌ها</span><h3 id="profile-data-heading">فعالیت من</h3></div>
      <nav className="profile-links" aria-label="برنامه و داده‌های من">
        <Link href="/progress"><span><NeoFitIcon name="chart" />پیشرفت و اندازه‌گیری</span><NeoFitIcon name="chevron" /></Link>
        <Link href="/workout"><span><NeoFitIcon name="workout" />برنامه تمرین</span><NeoFitIcon name="chevron" /></Link>
        <Link href="/nutrition"><span><NeoFitIcon name="food" />تغذیه و ثبت غذا</span><NeoFitIcon name="chevron" /></Link>
      </nav>
    </section>

    <section className="profile-link-group" aria-labelledby="profile-settings-heading">
      <div className="profile-link-group__heading"><span>تنظیمات</span><h3 id="profile-settings-heading">حساب و اتصال‌ها</h3></div>
      <nav className="profile-links" aria-label="تنظیمات حساب">
        <Link href="/profile/security"><span><NeoFitIcon name="profile" />امنیت حساب</span><NeoFitIcon name="chevron" /></Link>
        <Link href="/profile/ai"><span><NeoFitIcon name="sparkle" />مربی هوشمند</span><NeoFitIcon name="chevron" /></Link>
        <Link href="/profile/integrations"><span><NeoFitIcon name="plus" />اتصال‌ها</span><NeoFitIcon name="chevron" /></Link>
      </nav>
    </section>

    {account ? (
      <details className="profile-edit-disclosure">
        <summary>ویرایش نام نمایشی</summary>
        <div className="account-edit-card">
          <label htmlFor="profile-display-name">نامی که در NeoFit می‌بینی</label>
          <input id="profile-display-name" value={displayName} minLength={1} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} />
          <button type="button" disabled={working} onClick={saveDisplayName}>{working ? 'در حال ذخیره...' : 'ذخیره نام'}</button>
          {message ? <p className="local-data-card__message" role="status">{message}</p> : null}
        </div>
      </details>
    ) : null}

    {account ? <form action="/auth/signout" method="post" className="signout-form"><button type="submit">خروج از این دستگاه</button></form> : null}
  </section>;
}
