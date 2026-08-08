import Link from 'next/link';
import { verifyEmailLink } from './actions';
import { safeInternalPath } from '@/lib/auth/redirect';

export const dynamic = 'force-dynamic';

export default async function VerifyAuthLinkPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const tokenHash = typeof params.token_hash === 'string' ? params.token_hash : '';
  const type = typeof params.type === 'string' ? params.type : '';
  const next = safeInternalPath(typeof params.next === 'string' ? params.next : null, '/onboarding');
  const supported = tokenHash.length > 0 && tokenHash.length <= 4096 && (type === 'email' || type === 'recovery');
  const recovery = type === 'recovery';

  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card auth-card--compact" aria-labelledby="verify-heading">
        <div className="auth-brand">
          <span aria-hidden="true">N</span>
          <div>
            <p>NeoFit</p>
            <h1 id="verify-heading">{recovery ? 'بازیابی حساب' : 'تأیید ایمیل'}</h1>
          </div>
        </div>

        {supported ? (
          <>
            <p className="auth-intro">
              {recovery
                ? 'برای ساخت نشست بازیابی و انتخاب رمز جدید، این مرحله را خودت تأیید کن.'
                : 'برای فعال‌سازی حساب و ساخت نشست امن، تأیید را خودت انجام بده.'}
            </p>
            <div className="auth-notice auth-notice--warning" role="status">
              لینک ایمیل با بازشدن خودکار مصرف نمی‌شود؛ توکن فقط بعد از زدن دکمه زیر استفاده خواهد شد.
            </div>
            <form action={verifyEmailLink} className="auth-confirm-form">
              <input type="hidden" name="token_hash" value={tokenHash} />
              <input type="hidden" name="type" value={type} />
              <input type="hidden" name="next" value={next} />
              <button type="submit">{recovery ? 'تأیید بازیابی و ادامه' : 'تأیید ایمیل و ورود'}</button>
            </form>
          </>
        ) : (
          <>
            <p className="auth-notice auth-notice--error" role="alert">این لینک ناقص یا نامعتبر است.</p>
            <Link className="auth-guest-link" href={recovery ? '/auth/recover' : '/auth'}>
              {recovery ? 'درخواست لینک بازیابی جدید' : 'بازگشت به ورود'}
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
