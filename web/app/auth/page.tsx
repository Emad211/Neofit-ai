import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resendConfirmation, signIn, signUp } from './actions';
import { NeoFitIcon } from '@/components/neofit-icons';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';

const errorMessages: Readonly<Record<string, string>> = {
  config: 'اتصال Supabase هنوز برای این محیط تنظیم نشده است.',
  input: 'نام، ایمیل و رمز عبور را با فرمت درست وارد کن. رمز باید حداقل ۸ کاراکتر باشد.',
  credentials: 'ایمیل یا رمز عبور درست نیست.',
  signup: 'ساخت حساب انجام نشد. ممکن است این ایمیل قبلاً استفاده شده باشد.',
  resend: 'ارسال دوباره ایمیل تأیید انجام نشد. کمی بعد دوباره تلاش کن.',
  bootstrap: 'ورود انجام شد، اما ساخت داده‌های اولیه حساب کامل نشد. دوباره تلاش کن.',
  callback: 'لینک تأیید معتبر نبود یا منقضی شده است. می‌توانی ایمیل تأیید را دوباره ارسال کنی.',
};

const messageTexts: Readonly<Record<string, string>> = {
  confirm: 'حساب ساخته شد. ایمیل تأیید را باز کن تا ورود کامل شود.',
  resent: 'ایمیل تأیید دوباره ارسال شد. جدیدترین ایمیل را باز کن.',
  'confirmed-login': 'ایمیل تأیید شده است. برای ساخت نشست امن، یک‌بار با رمز عبور وارد شو.',
  signedout: 'با موفقیت از حساب خارج شدی.',
};

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const configured = hasSupabasePublicEnv();
  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) redirect('/profile');
  }

  const params = await searchParams;
  const errorCode = typeof params.error === 'string' ? params.error : '';
  const messageCode = typeof params.message === 'string' ? params.message : '';
  const error = errorMessages[errorCode];
  const message = messageTexts[messageCode];

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card" aria-labelledby="auth-heading">
        <div className="auth-brand">
          <span><NeoFitIcon name="workout" size={27} /></span>
          <div>
            <p>NeoFit</p>
            <h1 id="auth-heading">حساب نئوفیت</h1>
          </div>
        </div>

        <p className="auth-intro">
          با حساب واقعی، هدف‌ها و وعده‌های غذایی فقط در فضای شخصی خودت و تحت RLS ذخیره می‌شوند.
        </p>

        {!configured ? (
          <div className="auth-notice auth-notice--warning" role="status">
            <NeoFitIcon name="offline" size={18} />
            <span>این Build حالت Preview محلی دارد؛ متغیرهای عمومی Supabase برای این محیط تعریف نشده‌اند.</span>
          </div>
        ) : null}
        {error ? <p className="auth-notice auth-notice--error" role="alert">{error}</p> : null}
        {message ? <p className="auth-notice auth-notice--success" role="status">{message}</p> : null}

        <div className="auth-grid">
          <form action={signIn} className="auth-form">
            <div>
              <span className="section-kicker">کاربر فعلی</span>
              <h2>ورود</h2>
            </div>
            <label htmlFor="signin-email">ایمیل</label>
            <input id="signin-email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="signin-password">رمز عبور</label>
            <input id="signin-password" name="password" type="password" autoComplete="current-password" minLength={8} maxLength={128} required />
            <button type="submit" disabled={!configured}>ورود به حساب</button>
          </form>

          <form action={signUp} className="auth-form auth-form--secondary">
            <div>
              <span className="section-kicker">کاربر جدید</span>
              <h2>ساخت حساب</h2>
            </div>
            <label htmlFor="signup-name">نام نمایشی</label>
            <input id="signup-name" name="display_name" type="text" autoComplete="name" minLength={1} maxLength={80} required />
            <label htmlFor="signup-email">ایمیل</label>
            <input id="signup-email" name="email" type="email" autoComplete="email" required />
            <label htmlFor="signup-password">رمز عبور</label>
            <input id="signup-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required />
            <button type="submit" disabled={!configured}>ساخت حساب امن</button>
          </form>
        </div>

        <form action={resendConfirmation} className="auth-resend-form">
          <div>
            <strong>ایمیل تأیید به دستت نرسیده یا لینک قبلی مشکل داشت؟</strong>
            <span>ایمیل حساب را وارد کن؛ فقط یک لینک تأیید جدید ارسال می‌شود.</span>
          </div>
          <input name="email" type="email" autoComplete="email" placeholder="email@example.com" aria-label="ایمیل برای ارسال دوباره تأیید" required />
          <button type="submit" disabled={!configured}>ارسال دوباره</button>
        </form>

        <div className="auth-boundary">
          <NeoFitIcon name="check" size={17} />
          <p>کلید Publishable در مرورگر استفاده می‌شود و دسترسی داده‌ها با Policyهای مالک‌محور دیتابیس محدود شده است.</p>
        </div>

        <Link className="auth-guest-link" href="/today">ادامه در حالت مهمان و دادهٔ محلی</Link>
      </section>
    </main>
  );
}
