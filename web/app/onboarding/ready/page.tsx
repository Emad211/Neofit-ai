import Link from 'next/link';
import { redirect } from 'next/navigation';
import { activeAuthSession } from '@/lib/auth/active-session';
import { goalLabels, ONBOARDING_SCHEMA_VERSION, parseOnboardingDraft, type OnboardingDraft } from '@/lib/onboarding/model';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createProgramCycle } from './actions';
import { CreateCycleButton } from './create-cycle-button';

export const dynamic = 'force-dynamic';

function ReadySummary({
  draft,
  guest = false,
  hasCycle = false,
  cycleError = false,
}: {
  draft: OnboardingDraft | null;
  guest?: boolean;
  hasCycle?: boolean;
  cycleError?: boolean;
}) {
  const goal = draft?.goal.primaryGoal ? goalLabels[draft.goal.primaryGoal] : null;
  const duration = draft?.confirmation.programDurationDays ?? null;
  const startDate = draft?.confirmation.startDate || null;

  return (
    <main className="onboarding-page onboarding-ready-page" id="main-content">
      <section className="onboarding-ready-card" aria-labelledby="onboarding-ready-heading">
        <div className="onboarding-ready-card__mark" aria-hidden="true">✓</div>
        <p className="section-kicker">اطلاعاتت کامل شد</p>
        <h1 id="onboarding-ready-heading">آماده‌ای برنامه‌ات را بسازی</h1>
        <p className="onboarding-ready-card__intro">
          {guest
            ? 'برای ذخیره دائمی اطلاعات و دریافت برنامه شخصی، وارد حساب شو یا یک حساب بساز.'
            : 'خلاصه اطلاعاتت را یک‌بار ببین. اگر همه‌چیز درست است، وارد بخش برنامه شو و برنامه تمرین و تغذیه‌ات را بساز.'}
        </p>

        {draft ? (
          <div className="onboarding-ready-card__summary" aria-label="خلاصه دوره">
            <div><span>هدف</span><strong>{goal ?? '—'}</strong></div>
            <div><span>شروع</span><strong>{startDate ?? '—'}</strong></div>
            <div><span>مدت</span><strong>{duration === null ? '—' : `${duration.toLocaleString('fa-IR')} روز`}</strong></div>
            <div><span>تمرین</span><strong>{draft.availability.daysPerWeek === null ? '—' : `${draft.availability.daysPerWeek.toLocaleString('fa-IR')} روز در هفته`}</strong></div>
          </div>
        ) : null}

        {cycleError ? <p className="auth-message auth-message--error" role="alert">ورود به برنامه انجام نشد. صفحه را تازه کن و دوباره تلاش کن.</p> : null}

        <div className="onboarding-ready-card__actions">
          {guest ? <Link className="is-primary" href="/auth">ورود یا ساخت حساب</Link> : hasCycle ? (
            <Link className="is-primary" href="/program">رفتن به برنامه من</Link>
          ) : (
            <form action={createProgramCycle}><CreateCycleButton /></form>
          )}
          {!guest ? <Link href="/onboarding/review">مرور دوباره اطلاعات</Link> : null}
          {!guest ? <Link href="/profile/ai">تنظیمات مربی هوشمند</Link> : null}
        </div>
      </section>
    </main>
  );
}

export default async function OnboardingReadyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!hasSupabasePublicEnv()) {
    return <ReadySummary draft={null} guest />;
  }

  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) redirect('/auth');

  const [{ data, error }, avalaiCredential, cycle, params] = await Promise.all([
    supabase
      .from('user_onboarding')
      .select('status,schema_version,draft')
      .eq('user_id', active.userId)
      .maybeSingle(),
    supabase
      .from('encrypted_provider_credentials')
      .select('status')
      .eq('user_id', active.userId)
      .eq('provider', 'avalai')
      .maybeSingle(),
    supabase
      .from('program_cycles')
      .select('id')
      .eq('user_id', active.userId)
      .neq('status', 'completed')
      .limit(1)
      .maybeSingle(),
    searchParams,
  ]);

  const draft = parseOnboardingDraft(data?.draft ?? null);
  if (
    error ||
    avalaiCredential.error ||
    avalaiCredential.data?.status !== 'active' ||
    data?.status !== 'completed' ||
    data.schema_version !== ONBOARDING_SCHEMA_VERSION ||
    !draft
  ) {
    redirect('/onboarding/welcome');
  }

  return <ReadySummary draft={draft} hasCycle={Boolean(cycle.data)} cycleError={params.error === 'cycle' || Boolean(cycle.error)} />;
}
