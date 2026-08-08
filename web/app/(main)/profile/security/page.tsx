import Link from 'next/link';
import { redirect } from 'next/navigation';
import { changePassword, signOutOtherSessions } from './actions';
import { AUTH_PASSWORD_MAX_LENGTH, AUTH_PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { createClient } from '@/lib/supabase/server';

const errors: Readonly<Record<string, string>> = {
  input: 'رمز فعلی و رمز جدید را درست وارد کن؛ رمز جدید باید حداقل ۱۲ کاراکتر باشد و تکرار آن یکسان باشد.',
  password: 'تغییر رمز انجام نشد. رمز فعلی یا سیاست امنیتی حساب را بررسی کن.',
  sessions: 'خاتمه دادن نشست‌های دیگر انجام نشد. دوباره تلاش کن.',
};

const messages: Readonly<Record<string, string>> = {
  'password-updated': 'رمز با موفقیت تغییر کرد و refresh tokenهای دستگاه‌های دیگر تا حد امکان باطل شدند.',
  'other-sessions-revoked': 'نشست‌های دیگر باطل شدند؛ نشست فعلی باز مانده است.',
};

export default async function ProfileSecurityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect('/auth');

  const params = await searchParams;
  const errorCode = typeof params.error === 'string' ? params.error : '';
  const messageCode = typeof params.message === 'string' ? params.message : '';

  return (
    <section className="page-stack" aria-labelledby="security-heading">
      <div className="section-heading">
        <div><p className="section-kicker">امنیت حساب</p><h2 id="security-heading">رمز و نشست‌ها</h2></div>
        <Link className="text-button" href="/profile">بازگشت</Link>
      </div>

      {errors[errorCode] ? <p className="auth-notice auth-notice--error" role="alert">{errors[errorCode]}</p> : null}
      {messages[messageCode] ? <p className="auth-notice auth-notice--success" role="status">{messages[messageCode]}</p> : null}

      <article className="account-edit-card">
        <div><span>تغییر رمز</span><h3>تأیید با رمز فعلی</h3></div>
        <form action={changePassword} className="security-form">
          <label htmlFor="security-current-password">رمز فعلی</label>
          <input id="security-current-password" name="current_password" type="password" autoComplete="current-password" maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
          <label htmlFor="security-new-password">رمز جدید</label>
          <input id="security-new-password" name="password" type="password" autoComplete="new-password" minLength={AUTH_PASSWORD_MIN_LENGTH} maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
          <label htmlFor="security-new-password-confirmation">تکرار رمز جدید</label>
          <input id="security-new-password-confirmation" name="password_confirmation" type="password" autoComplete="new-password" minLength={AUTH_PASSWORD_MIN_LENGTH} maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
          <small>حداقل ۱۲ کاراکتر. بعد از تغییر رمز، نشست‌های دیگر revoke می‌شوند و همین دستگاه باز می‌ماند.</small>
          <button type="submit">تغییر رمز</button>
        </form>
      </article>

      <article className="local-data-card">
        <div><span>نشست‌های فعال</span><h3>کنترل دستگاه‌ها</h3><p>Access tokenهای صادرشده تا زمان انقضای خود می‌توانند معتبر بمانند؛ این عملیات refresh tokenها را revoke می‌کند.</p></div>
        <form action={signOutOtherSessions}><button type="submit">خروج دستگاه‌های دیگر</button></form>
      </article>

      <form action="/auth/signout" method="post" className="signout-form">
        <input type="hidden" name="scope" value="global" />
        <button type="submit">خروج از همه دستگاه‌ها</button>
      </form>
    </section>
  );
}
