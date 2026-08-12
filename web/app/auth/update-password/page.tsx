import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthSubmitButton } from '../auth-submit-button';
import { updateRecoveredPassword } from '../recovery-actions';
import { activeAuthSession } from '@/lib/auth/active-session';
import { AUTH_PASSWORD_MAX_LENGTH, AUTH_PASSWORD_MIN_LENGTH } from '@/lib/auth/password';
import { hasValidRecoveryIntent } from '@/lib/auth/recovery-intent';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

const errors: Readonly<Record<string, string>> = {
  config: 'بازیابی حساب در این محیط موقتاً در دسترس نیست.',
  input: 'رمز جدید باید حداقل ۱۲ کاراکتر باشد و تکرار آن دقیقاً یکسان باشد.',
  provider: 'تغییر رمز انجام نشد. یک رمز دیگر انتخاب کن یا کمی بعد دوباره تلاش کن.',
};

export default async function UpdatePasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!hasSupabasePublicEnv()) redirect('/auth/recover?error=config');
  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active || !(await hasValidRecoveryIntent(active.userId, active.sessionId))) redirect('/auth/recover?error=session');

  const params = await searchParams;
  const errorCode = typeof params.error === 'string' ? params.error : '';
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card auth-card--compact" aria-labelledby="update-password-heading">
        <div className="auth-brand"><span aria-hidden="true">N</span><div><p>NeoFit</p><h1 id="update-password-heading">رمز جدید</h1></div></div>
        <p className="auth-intro">یک رمز جدید برای حسابت انتخاب کن.</p>
        {errors[errorCode] ? <p className="auth-notice auth-notice--error" role="alert">{errors[errorCode]}</p> : null}
        <form action={updateRecoveredPassword} className="auth-form auth-form--single">
          <label htmlFor="new-password">رمز جدید</label>
          <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={AUTH_PASSWORD_MIN_LENGTH} maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
          <label htmlFor="new-password-confirmation">تکرار رمز جدید</label>
          <input id="new-password-confirmation" name="password_confirmation" type="password" autoComplete="new-password" minLength={AUTH_PASSWORD_MIN_LENGTH} maxLength={AUTH_PASSWORD_MAX_LENGTH} required />
          <p className="auth-field-help">حداقل ۱۲ کاراکتر و ترجیحاً منحصربه‌فرد.</p>
          <AuthSubmitButton pendingLabel="در حال ذخیره...">ذخیره رمز جدید</AuthSubmitButton>
        </form>
        <Link className="auth-guest-link" href="/auth/recover">لغو و درخواست لینک جدید</Link>
      </section>
    </main>
  );
}
