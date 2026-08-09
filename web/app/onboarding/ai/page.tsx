import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AiProviderSettingsScreen } from '@/components/ai-provider-settings-screen';
import { activeAuthSession } from '@/lib/auth/active-session';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function OnboardingAiPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!hasSupabasePublicEnv()) redirect('/auth');

  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) redirect('/auth');

  const credentialResult = await supabase
    .from('encrypted_provider_credentials')
    .select('provider,status')
    .eq('user_id', active.userId)
    .eq('provider', 'google')
    .maybeSingle();

  const googleReady = !credentialResult.error && credentialResult.data?.status === 'active';
  const params = await searchParams;
  const error = typeof params.error === 'string' ? params.error : '';

  return (
    <main className="onboarding-page" id="main-content">
      <section className="onboarding-shell">
        <header className="onboarding-step-title">
          <span>مرحله پیش‌نیاز مربی</span>
          <h1>اول هوش مصنوعی شخصی‌ات را متصل کن</h1>
          <p>
            NeoFit برای ساخت و مدیریت دوره واقعی به Google Gemini متصل به حساب خودت نیاز دارد.
            AvalAI پشتیبان اختیاری است و می‌توانی همین‌جا یا بعداً تنظیمش کنی.
          </p>
        </header>

        <div className="onboarding-boundary-note">
          <strong>مرز امنیتی</strong>
          <p>
            API key داخل داده‌های Onboarding، localStorage، prompt یا analytics ذخیره نمی‌شود؛
            مسیر موجود BYOK آن را بعد از اعتبارسنجی در vault رمزنگاری‌شده حساب نگه می‌دارد.
          </p>
        </div>

        {error === 'google-required' ? (
          <p className="onboarding-action-error" role="alert">
            برای ادامه Onboarding باید Google Gemini با وضعیت فعال ذخیره شده باشد.
          </p>
        ) : null}

        {googleReady ? (
          <div className="auth-notice auth-notice--success" role="status">
            Google Gemini برای این حساب فعال است. می‌توانی وارد مراحل اطلاعات شخصی شوی.
          </div>
        ) : null}

        <AiProviderSettingsScreen />

        <footer className="onboarding-actions">
          <Link className="secondary" href="/auth">بازگشت به حساب</Link>
          <Link className="primary" href="/onboarding/ai/continue">
            بررسی Google و ادامه Onboarding
          </Link>
        </footer>
      </section>
    </main>
  );
}
