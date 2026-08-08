import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AuthSubmitButton } from '../auth-submit-button';
import { requestPasswordReset } from '../recovery-actions';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

const errors: Readonly<Record<string, string>> = {
  config: 'اتصال Auth برای این محیط کامل نیست.',
  input: 'یک ایمیل معتبر وارد کن.',
  session: 'نشست بازیابی معتبر نیست یا منقضی شده است. لینک جدید بگیر.',
  'invalid-link': 'لینک بازیابی معتبر نیست، منقضی شده یا قبلاً استفاده شده است.',
};

export default async function RecoverPasswordPage({
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

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card auth-card--compact" aria-labelledby="recover-heading">
        <div className="auth-brand"><span aria-hidden="true">N</span><div><p>NeoFit</p><h1 id="recover-heading">بازیابی رمز عبور</h1></div></div>
        <p className="auth-intro">ایمیل حساب را وارد کن. پاسخ صفحه برای ایمیل موجود و ناموجود یکسان است تا وجود حساب افشا نشود.</p>
        {errors[errorCode] ? <p className="auth-notice auth-notice--error" role="alert">{errors[errorCode]}</p> : null}
        {messageCode === 'sent' ? <p className="auth-notice auth-notice--success" role="status">اگر حسابی با این ایمیل وجود داشته باشد، لینک بازیابی ارسال شده است. جدیدترین ایمیل را بررسی کن.</p> : null}
        <form action={requestPasswordReset} className="auth-form auth-form--single">
          <label htmlFor="recovery-email">ایمیل</label>
          <input id="recovery-email" name="email" type="email" autoComplete="email" required />
          <AuthSubmitButton disabled={!configured} pendingLabel="در حال ارسال...">ارسال لینک بازیابی</AuthSubmitButton>
        </form>
        <Link className="auth-guest-link" href="/auth">بازگشت به ورود</Link>
      </section>
    </main>
  );
}
