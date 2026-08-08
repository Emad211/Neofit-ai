'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NeoFitIcon } from '@/components/neofit-icons';
import { useNutritionState } from '@/components/nutrition-state';
import { workoutPlan } from '@/data/workout-fixtures';
import { createClient } from '@/lib/supabase/client';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });

export function ProfileScreen() {
  const router = useRouter();
  const { summary, resetDiary, account, supabaseConfigured, syncStatus, syncMessage } = useNutritionState();
  const [message, setMessage] = useState('');
  const [displayName, setDisplayName] = useState(account?.displayName ?? '');
  const [working, setWorking] = useState(false);

  useEffect(() => { setDisplayName(account?.displayName ?? ''); }, [account?.displayName]);

  async function clearDiary() {
    const accepted = window.confirm(account ? 'تمام ثبت‌های تغذیه این حساب حذف شوند؟ این کار قابل بازگشت نیست.' : 'ثبت‌های آزمایشی تغذیه به حالت اولیه برگردند؟');
    if (!accepted) return;
    setWorking(true); setMessage('');
    try { await resetDiary(); setMessage(account ? 'ثبت‌های تغذیه حساب حذف شدند.' : 'ثبت‌های آزمایشی به حالت اولیه برگشتند.'); }
    catch { setMessage('انجام عملیات ممکن نشد. دوباره تلاش کن.'); }
    finally { setWorking(false); }
  }

  async function saveDisplayName() {
    if (!account || working) return;
    const name = displayName.trim();
    if (!name || name.length > 80) { setMessage('نام نمایشی باید بین ۱ تا ۸۰ کاراکتر باشد.'); return; }
    setWorking(true); setMessage('');
    const supabase = createClient();
    const { error } = await supabase.from('profiles').upsert({ id: account.id, display_name: name, locale: 'fa', timezone: account.timezone });
    if (error) { setMessage('ذخیره نام نمایشی انجام نشد.'); setWorking(false); return; }
    setMessage('نام نمایشی در حساب ذخیره شد.'); setWorking(false); router.refresh();
  }

  return <section className="page-stack" aria-labelledby="profile-heading">
    <div className="section-heading"><div><p className="section-kicker">حساب و برنامه</p><h2 id="profile-heading">پروفایل من</h2></div><span className="status-pill status-pill--soft"><NeoFitIcon name={account ? 'check' : 'profile'} size={15} />{account ? 'متصل' : 'مهمان'}</span></div>
    <article className="profile-identity-card"><span className="profile-identity-card__avatar">{(account?.displayName || account?.email || 'م').slice(0, 1)}</span><div><h3>{account?.displayName ?? 'کاربر مهمان'}</h3><p>{account?.email ?? 'داده‌های محلی همین مرورگر'}</p></div><span className="profile-identity-card__state">{account ? 'Supabase + RLS' : 'بدون حساب آنلاین'}</span></article>
    {account ? <article className="account-edit-card"><div><span>اطلاعات حساب</span><h3>نام نمایشی</h3></div><label htmlFor="profile-display-name">نامی که در نئوفیت می‌بینی</label><input id="profile-display-name" value={displayName} minLength={1} maxLength={80} onChange={(event) => setDisplayName(event.target.value)} /><button type="button" disabled={working} onClick={saveDisplayName}>{working ? 'در حال ذخیره...' : 'ذخیره نام'}</button></article> : <article className="account-connect-card"><div><span>همگام‌سازی شخصی</span><h3>{supabaseConfigured ? 'حساب نئوفیت آماده است' : 'اتصال این محیط تنظیم نشده'}</h3><p>{supabaseConfigured ? 'با ورود، هدف و وعده‌ها در فضای شخصی خودت ذخیره می‌شوند.' : 'فعلاً می‌توانی همه صفحات را با دادهٔ محلی بررسی کنی.'}</p></div>{supabaseConfigured ? <Link href="/auth">ورود یا ساخت حساب</Link> : null}</article>}
    <div className="profile-metrics"><article><span>پروفایل بدنی</span><strong>—<small> بعد از Onboarding</small></strong></article><article><span>هدف شخصی</span><strong>—<small> بعد از Onboarding</small></strong></article><article><span>جلسه در هفته</span><strong>{faNumber.format(workoutPlan.length)}</strong></article></div>
    <article className="profile-plan-card"><div><span>پایه شخصی‌سازی</span><h3>Onboarding و محدودیت‌ها</h3><p>هدف، اطلاعات بدنی، سابقه پزشکی، Body Map آسیب و زمان تمرین را ثبت یا اصلاح کن.</p></div><NeoFitIcon name="sparkle" size={28} /></article>
    <nav className="profile-links" aria-label="بخش‌های پروفایل"><Link href="/coach"><span><NeoFitIcon name="sparkle" />NeoFit Coach</span><NeoFitIcon name="chevron" /></Link><Link href="/onboarding"><span><NeoFitIcon name="profile" />Onboarding و Body Map</span><NeoFitIcon name="chevron" /></Link><Link href="/progress"><span><NeoFitIcon name="chart" />روند پیشرفت</span><NeoFitIcon name="chevron" /></Link><Link href="/workout"><span><NeoFitIcon name="workout" />برنامهٔ تمرین</span><NeoFitIcon name="chevron" /></Link><Link href="/nutrition"><span><NeoFitIcon name="food" />تغذیه و ثبت غذا</span><NeoFitIcon name="chevron" /></Link><Link href="/profile/ai"><span><NeoFitIcon name="sparkle" />هوش مصنوعی و کلیدهای شخصی</span><NeoFitIcon name="chevron" /></Link></nav>
    <article className="local-data-card"><div><span>{account ? 'داده‌های حساب' : 'داده‌های همین مرورگر'}</span><h3>{faNumber.format(summary.entryCount)} وعدهٔ تغذیه</h3><p>{syncStatus === 'saving' ? 'عملیات ذخیره در حال انجام است.' : syncMessage}</p></div><button type="button" disabled={working} onClick={clearDiary}>{account ? 'حذف ثبت‌های تغذیه حساب' : 'بازنشانی دادهٔ آزمایشی'}</button>{message ? <p className="local-data-card__message" role="status">{message}</p> : null}</article>
    {account ? <form action="/auth/signout" method="post" className="signout-form"><button type="submit">خروج از حساب</button></form> : null}
    <div className="profile-boundary-note"><NeoFitIcon name={account ? 'check' : 'offline'} size={18} /><p>{account ? 'Profile، Nutrition، Workout، Onboarding و Coach با Session معتبر و Policyهای مالک‌محور کار می‌کنند.' : 'در حالت مهمان، داده‌های شخصی فقط در همین مرورگر باقی می‌مانند.'}</p></div>
  </section>;
}
