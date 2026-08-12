import Link from 'next/link';
import { verifyEmailLink } from './actions';
import { AuthSubmitButton } from '../auth-submit-button';
import { pendingEmailLinkToken } from '@/lib/auth/email-link-intent';
import { safeInternalPath } from '@/lib/auth/redirect';

export const dynamic = 'force-dynamic';

export default async function VerifyAuthLinkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const type = typeof params.type === 'string' ? params.type : '';
  const defaultNext = type === 'email_change' ? '/profile/security' : '/onboarding';
  const next = safeInternalPath(typeof params.next === 'string' ? params.next : null, defaultNext);
  const tokenPresent = Boolean(await pendingEmailLinkToken());
  const supported = tokenPresent && (type === 'email' || type === 'recovery' || type === 'email_change');
  const recovery = type === 'recovery';
  const emailChange = type === 'email_change';

  const heading = recovery ? 'بازیابی حساب' : emailChange ? 'تأیید تغییر ایمیل' : 'تأیید ایمیل';
  const intro = recovery
    ? 'برای ادامه بازیابی حساب و انتخاب رمز جدید، این درخواست را تأیید کن.'
    : emailChange
      ? 'برای ادامه تغییر ایمیل، این درخواست را تأیید کن.'
      : 'برای فعال‌شدن حساب، ایمیلت را تأیید کن.';
  const submitLabel = recovery
    ? 'تأیید و ادامه'
    : emailChange
      ? 'تأیید تغییر ایمیل'
      : 'تأیید ایمیل';
  const fallbackHref = recovery ? '/auth/recover' : emailChange ? '/profile/security' : '/auth';
  const fallbackLabel = recovery ? 'درخواست لینک بازیابی جدید' : emailChange ? 'بازگشت به امنیت حساب' : 'بازگشت به ورود';

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card auth-card--compact" aria-labelledby="verify-heading">
        <div className="auth-brand"><span aria-hidden="true">N</span><div><p>NeoFit</p><h1 id="verify-heading">{heading}</h1></div></div>
        {supported ? <>
          <p className="auth-intro">{intro}</p>
          <div className="auth-notice auth-notice--warning" role="status">این مرحله فقط با تأیید خودت انجام می‌شود.</div>
          <form action={verifyEmailLink} className="auth-confirm-form">
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="next" value={next} />
            <AuthSubmitButton pendingLabel="در حال تأیید...">{submitLabel}</AuthSubmitButton>
          </form>
        </> : <>
          <p className="auth-notice auth-notice--error" role="alert">این لینک ناقص، منقضی یا قبلاً استفاده شده است.</p>
          <Link className="auth-guest-link" href={fallbackHref}>{fallbackLabel}</Link>
        </>}
      </section>
    </main>
  );
}
