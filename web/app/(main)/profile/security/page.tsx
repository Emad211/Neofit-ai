import Link from 'next/link';
import { redirect } from 'next/navigation';
import { changePassword, requestEmailChange, signOutOtherSessions } from './actions';
import { AuthSubmitButton } from '@/app/auth/auth-submit-button';
import { activeAuthSession } from '@/lib/auth/active-session';
import { AUTH_PASSWORD_MAX_LENGTH, AUTH_PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { createClient } from '@/lib/supabase/server';

const errors: Readonly<Record<string, string>> = {
  input: 'رمز فعلی و رمز جدید را درست وارد کن؛ رمز جدید باید حداقل ۱۲ کاراکتر باشد و تکرار آن یکسان باشد.',
  password: 'تغییر رمز انجام نشد. رمز فعلی یا سیاست امنیتی حساب را بررسی کن.',
  sessions: 'خاتمه دادن نشست‌های دیگر انجام نشد. دوباره تلاش کن.',
  'email-input': 'یک آدرس ایمیل معتبر وارد کن.',
  'email-current': 'ایمیل فعلی این حساب قابل تأیید نیست. دوباره وارد حساب شو و تلاش کن.',
  'email-same': 'ایمیل جدید با ایمیل فعلی یکسان است.',
  'email-change': 'درخواست تغییر ایمیل ثبت نشد. محدودیت ارسال یا تنظیمات Auth را بررسی کن و دوباره تلاش کن.',
  'email-change-link': 'لینک تأیید تغییر ایمیل نامعتبر یا منقضی است. در صورت نیاز درخواست جدید ثبت کن.',
};

const messages: Readonly<Record<string, string>> = {
  'password-updated': 'رمز با موفقیت تغییر کرد و refresh tokenهای نشست‌های دیگر تا حد امکان باطل شدند.',
  'other-sessions-revoked': 'نشست‌های دیگر باطل شدند؛ نشست فعلی باز مانده است.',
  'email-change-sent': 'درخواست تغییر ایمیل ثبت شد. پیام‌های تأیید لازم را بررسی کن؛ تا پایان تأیید، NeoFit تغییر ایمیل را قطعی فرض نمی‌کند.',
  'email-changed': 'یک مرحله تأیید تغییر ایمیل با موفقیت انجام شد. اگر Secure Email Change فعال باشد ممکن است تأیید آدرس دیگر نیز لازم باشد.',
};

export default async function ProfileSecurityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) redirect('/auth?error=session');

  const params = await searchParams;
  const errorCode = typeof params.error === 'string' ? params.error : '';
  const messageCode = typeof params.message === 'string' ? params.message : '';
  const currentEmail = active.user.email ?? 'نامشخص';

  return (
    <section className="page-stack" aria-labelledby="security-heading">
      <div className="section-heading">
        <div><p className="section-kicker">امنیت حساب</p><h2 id="security-heading">هویت، رمز و نشست‌ها</h2></div>
        <Link className="text-button" href="/profile">بازگشت</Link>
      </div>
      {errors[errorCode] ? <p className="auth-notice auth-notice--error" role="alert">{errors[errorCode]}</p> : null}
      {messages[messageCode] ? <p className="auth-notice auth-notice--success" role="status">{messages[messageCode]}</p> : null}
      <article className="profile-plan-card"><div><span>نشست تأییدشده</span><h3>بررسی زنده با Auth server</h3><p>برای این صفحه فقط JWT محلی کافی نیست؛ NeoFit اعتبار user را مستقیم با Supabase Auth نیز بررسی می‌کند.</p></div></article>
      <article className="account-edit-card">
        <div><span>ایمیل حساب</span><h3>تغییر ایمیل با تأیید</h3><p>ایمیل فعلی: <bdi>{currentEmail}</bdi></p></div>
        <form action={requestEmailChange} className="security-form">
          <label htmlFor="security-new-email">ایمیل جدید</label>
          <input id="security-new-email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required />
          <small>درخواست از یک نشست زنده ارسال می‌شود. اگر Secure Email Change در Supabase فعال باشد، ممکن است ایمیل فعلی و ایمیل جدید هر دو نیاز به تأیید داشته باشند. هیچ تغییر فوری فرض نمی‌شود.</small>
          <AuthSubmitButton pendingLabel="در حال ارسال درخواست...">ارسال تأیید تغییر ایمیل</AuthSubmitButton>
        </form>
      </article>
      <article className="account-edit-card">
        <div><span>تغییر رمز</span><h3>تأیید با رمز فعلی</h3></div>
        <form action={changePassword} className="security-form">
          <label htmlFor="security-current-password">رمز فعلی</label><input id="security-current-password" name="current_password" type="password" autoComplete="current-password" maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
          <label htmlFor="security-new-password">رمز جدید</label><input id="security-new-password" name="password" type="password" autoComplete="new-password" minLength={AUTH_PASSWORD_MIN_LENGTH} maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
          <label htmlFor="security-new-password-confirmation">تکرار رمز جدید</label><input id="security-new-password-confirmation" name="password_confirmation" type="password" autoComplete="new-password" minLength={AUTH_PASSWORD_MIN_LENGTH} maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
          <small>حداقل ۱۲ کاراکتر. بعد از تغییر رمز، refresh tokenهای نشست‌های دیگر revoke می‌شوند و همین نشست باز می‌ماند.</small>
          <AuthSubmitButton pendingLabel="در حال تغییر رمز...">تغییر رمز</AuthSubmitButton>
        </form>
      </article>
      <article className="local-data-card">
        <div><span>نشست‌های فعال</span><h3>کنترل نشست‌ها</h3><p>چون ورود از Server Action انجام می‌شود، metadata فعلی Supabase برای sessionها مرورگر/دستگاه واقعی را قابل اتکا نشان نمی‌دهد؛ بنابراین NeoFit فعلاً لیست دستگاه ساختگی نمایش نمی‌دهد.</p></div>
        <form action={signOutOtherSessions}><AuthSubmitButton pendingLabel="در حال لغو...">لغو نشست‌های دیگر</AuthSubmitButton></form>
      </article>
      <form action="/auth/signout" method="post" className="signout-form"><input type="hidden" name="scope" value="global" /><button type="submit">خروج از همه نشست‌ها</button></form>
    </section>
  );
}
