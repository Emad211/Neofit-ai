import Link from 'next/link';
import { redirect } from 'next/navigation';
import { changePassword, requestEmailChange, signOutOtherSessions } from './actions';
import { AuthSubmitButton } from '@/app/auth/auth-submit-button';
import { activeAuthSession } from '@/lib/auth/active-session';
import { AUTH_PASSWORD_MAX_LENGTH, AUTH_PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { createClient } from '@/lib/supabase/server';

const errors: Readonly<Record<string, string>> = {
  input: 'رمز فعلی و رمز جدید را درست وارد کن؛ رمز جدید باید حداقل ۱۲ کاراکتر باشد و تکرار آن یکسان باشد.',
  password: 'تغییر رمز انجام نشد. رمز فعلی را بررسی کن و دوباره تلاش کن.',
  sessions: 'خروج از نشست‌های دیگر انجام نشد. دوباره تلاش کن.',
  'email-input': 'یک آدرس ایمیل معتبر وارد کن.',
  'email-current': 'ایمیل فعلی حساب قابل تأیید نیست. دوباره وارد حساب شو و تلاش کن.',
  'email-same': 'ایمیل جدید با ایمیل فعلی یکسان است.',
  'email-change': 'درخواست تغییر ایمیل ثبت نشد. کمی بعد دوباره تلاش کن.',
  'email-change-link': 'لینک تأیید تغییر ایمیل نامعتبر یا منقضی است. در صورت نیاز درخواست جدید ثبت کن.',
};

const messages: Readonly<Record<string, string>> = {
  'password-updated': 'رمز عبور با موفقیت تغییر کرد.',
  'other-sessions-revoked': 'از نشست‌های دیگر خارج شدی؛ این نشست همچنان باز است.',
  'email-change-sent': 'درخواست تغییر ایمیل ثبت شد. پیام‌های تأیید را در ایمیل فعلی و جدید بررسی کن.',
  'email-changed': 'تأیید تغییر ایمیل انجام شد. اگر یک تأیید دیگر لازم باشد، پیام مربوط برایت ارسال می‌شود.',
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
        <div><p className="section-kicker">امنیت حساب</p><h2 id="security-heading">ایمیل، رمز و دستگاه‌ها</h2></div>
        <Link className="text-button" href="/profile">بازگشت</Link>
      </div>
      {errors[errorCode] ? <p className="auth-notice auth-notice--error" role="alert">{errors[errorCode]}</p> : null}
      {messages[messageCode] ? <p className="auth-notice auth-notice--success" role="status">{messages[messageCode]}</p> : null}

      <article className="account-edit-card">
        <div><span>ایمیل حساب</span><h3>تغییر ایمیل</h3><p>ایمیل فعلی: <bdi>{currentEmail}</bdi></p></div>
        <form action={requestEmailChange} className="security-form">
          <label htmlFor="security-new-email">ایمیل جدید</label>
          <input id="security-new-email" name="email" type="email" autoComplete="email" inputMode="email" maxLength={254} required />
          <small>برای امنیت حساب ممکن است لازم باشد تغییر ایمیل را از طریق پیام‌های ارسالی تأیید کنی.</small>
          <AuthSubmitButton pendingLabel="در حال ارسال درخواست...">ارسال تأیید تغییر ایمیل</AuthSubmitButton>
        </form>
      </article>

      <article className="account-edit-card">
        <div><span>رمز عبور</span><h3>تغییر رمز</h3></div>
        <form action={changePassword} className="security-form">
          <label htmlFor="security-current-password">رمز فعلی</label><input id="security-current-password" name="current_password" type="password" autoComplete="current-password" maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
          <label htmlFor="security-new-password">رمز جدید</label><input id="security-new-password" name="password" type="password" autoComplete="new-password" minLength={AUTH_PASSWORD_MIN_LENGTH} maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
          <label htmlFor="security-new-password-confirmation">تکرار رمز جدید</label><input id="security-new-password-confirmation" name="password_confirmation" type="password" autoComplete="new-password" minLength={AUTH_PASSWORD_MIN_LENGTH} maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
          <small>رمز جدید باید حداقل ۱۲ کاراکتر باشد. بعد از تغییر رمز، نشست‌های دیگر حسابت بسته می‌شوند.</small>
          <AuthSubmitButton pendingLabel="در حال تغییر رمز...">تغییر رمز</AuthSubmitButton>
        </form>
      </article>

      <article className="local-data-card">
        <div><span>دستگاه‌ها</span><h3>خروج از نشست‌های دیگر</h3><p>اگر حسابت روی دستگاه دیگری باز است، می‌توانی همه نشست‌های دیگر را ببندی و فقط همین دستگاه را نگه داری.</p></div>
        <form action={signOutOtherSessions}><AuthSubmitButton pendingLabel="در حال خروج...">خروج از نشست‌های دیگر</AuthSubmitButton></form>
      </article>

      <form action="/auth/signout" method="post" className="signout-form"><input type="hidden" name="scope" value="global" /><button type="submit">خروج از همه دستگاه‌ها</button></form>
    </section>
  );
}
