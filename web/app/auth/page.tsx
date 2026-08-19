import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resendConfirmation, signIn, signUp } from './actions';
import { AuthSubmitButton } from './auth-submit-button';
import { NeoFitIcon } from '@/components/neofit-icons';
import { activeAuthSession } from '@/lib/auth/active-session';
import { AUTH_PASSWORD_MAX_LENGTH, AUTH_PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';

const errorMessages: Readonly<Record<string, string>> = {
  config: 'ورود و ساخت حساب در این محیط موقتاً در دسترس نیست.',
  input: 'اطلاعات فرم معتبر نیست. رمز حساب جدید باید حداقل ۱۲ کاراکتر باشد.',
  credentials: 'ایمیل یا رمز عبور درست نیست.',
  session: 'نشست حسابت منقضی شده یا معتبر نیست. دوباره وارد شو.',
  signup: 'ساخت حساب انجام نشد. اطلاعات را بررسی کن یا کمی بعد دوباره تلاش کن.',
  callback: 'لینک تأیید معتبر نبود، منقضی شده یا قبلاً استفاده شده است. می‌توانی ایمیل تأیید را دوباره ارسال کنی.',
};

const messageTexts: Readonly<Record<string, string>> = {
  confirm: 'حساب ساخته شد. ایمیل تأیید را باز کن تا حسابت فعال شود.',
  'resent-generic': 'اگر این ایمیل نیاز به تأیید داشته باشد، یک پیام جدید برایش ارسال شده است.',
  'confirmed-login': 'ایمیل تأیید شد. حالا با رمز عبورت وارد حساب شو.',
  signedout: 'از حساب خارج شدی.',
  'signedout-all': 'از همه دستگاه‌ها خارج شدی.',
};

export default async function AuthPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const configured = hasSupabasePublicEnv();
  if (configured) {
    const supabase = await createClient();
    // Live validation prevents a stale local session from hiding the sign-in UI.
    const active = await activeAuthSession(supabase);
    if (active) redirect('/');
  }

  const params = await searchParams;
  const errorCode = typeof params.error === 'string' ? params.error : '';
  const messageCode = typeof params.message === 'string' ? params.message : '';
  const error = errorMessages[errorCode];
  const message = messageTexts[messageCode];

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card" aria-labelledby="auth-heading">
        <div className="auth-brand"><span><NeoFitIcon name="workout" size={27} /></span><div><p>NeoFit</p><h1 id="auth-heading">حساب نئوفیت</h1></div></div>
        <p className="auth-intro">با حساب NeoFit، اطلاعات و برنامه شخصی‌ات ذخیره می‌شوند و روی دستگاه‌های مختلف در دسترس می‌مانند.</p>
        {!configured ? <div className="auth-notice auth-notice--warning" role="status"><NeoFitIcon name="offline" size={18} /><span>ورود و ساخت حساب در این محیط موقتاً در دسترس نیست.</span></div> : null}
        {error ? <p className="auth-notice auth-notice--error" role="alert">{error}</p> : null}
        {message ? <p className="auth-notice auth-notice--success" role="status">{message}</p> : null}

        <div className="auth-grid">
          <form action={signIn} className="auth-form">
            <div><span className="section-kicker">حساب داری؟</span><h2>ورود</h2></div>
            <label htmlFor="signin-email">ایمیل</label><input id="signin-email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="signin-password">رمز عبور</label><input id="signin-password" name="password" type="password" autoComplete="current-password" maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
            <div className="auth-form__meta"><Link href="/auth/recover">رمز را فراموش کرده‌ام</Link></div>
            <AuthSubmitButton disabled={!configured} pendingLabel="در حال ورود...">ورود به حساب</AuthSubmitButton>
          </form>

          <form action={signUp} className="auth-form auth-form--secondary">
            <div><span className="section-kicker">اولین باره؟</span><h2>ساخت حساب</h2></div>
            <label htmlFor="signup-name">نام نمایشی</label><input id="signup-name" name="display_name" type="text" autoComplete="name" minLength={1} maxLength={80} required />
            <label htmlFor="signup-email">ایمیل</label><input id="signup-email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="signup-password">رمز عبور</label><input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={AUTH_PASSWORD_MIN_LENGTH} maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
            <p className="auth-field-help">حداقل ۱۲ کاراکتر و ترجیحاً منحصربه‌فرد.</p>
            <AuthSubmitButton disabled={!configured} pendingLabel="در حال ساخت حساب...">ساخت حساب</AuthSubmitButton>
          </form>
        </div>

        <form action={resendConfirmation} className="auth-resend-form">
          <div><strong>ایمیل تأیید به دستت نرسیده؟</strong><span>ایمیل را وارد کن تا در صورت نیاز پیام جدید ارسال شود.</span></div>
          <input name="email" type="email" autoComplete="email" placeholder="email@example.com" aria-label="ایمیل برای ارسال دوباره تأیید" required />
          <AuthSubmitButton disabled={!configured} pendingLabel="در حال ارسال...">ارسال دوباره</AuthSubmitButton>
        </form>

        <div className="auth-boundary"><NeoFitIcon name="check" size={17} /><p>اطلاعات ورودت امن نگه‌داری می‌شود و برای عملیات حساس دوباره اعتبار حساب بررسی می‌شود.</p></div>
        <Link className="auth-guest-link" href="/today">ادامه بدون حساب</Link>
      </section>
    </main>
  );
}
