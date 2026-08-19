import Link from 'next/link';
import { redirect } from 'next/navigation';
import { activeAuthSession } from '@/lib/auth/active-session';
import { goalLabels, ONBOARDING_SCHEMA_VERSION, parseOnboardingDraft, type OnboardingDraft } from '@/lib/onboarding/model';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';
import { createProgramCycle } from './actions';
import { CreateCycleButton } from './create-cycle-button';

export const dynamic = 'force-dynamic';

function formatReadyDate(value: string | null): string {
  if (!value) return '—';
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return value;
  const [year, month, day] = parts as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return value;
  return new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

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
  const startDate = formatReadyDate(draft?.confirmation.startDate || null);

  return (
    <main className="onboarding-page onboarding-ready-page" id="main-content">
      <section className="onboarding-ready-card" aria-labelledby="onboarding-ready-heading">
        <Link className="onboarding-ready-brand" href="/today">NeoFit</Link>
        <span className="onboarding-ready-card__mark" aria-hidden="true">✓</span>
        <div className="onboarding-ready-card__copy">
          <p className="section-kicker">اطلاعاتت کامل شد</p>
          <h1 id="onboarding-ready-heading">حالا برنامه‌ات را بساز</h1>
          <p className="onboarding-ready-card__intro">
            {guest
              ? 'برای ذخیره اطلاعات و دریافت برنامه شخصی، وارد حساب شو یا حساب بساز.'
              : 'این خلاصه مبنای ساخت برنامه است. اگر درست است، وارد برنامه شو.'}
          </p>
        </div>

        {draft ? (
          <div className="onboarding-ready-card__summary" aria-label="خلاصه دوره">
            <div><span>هدف</span><strong>{goal ?? '—'}</strong></div>
            <div><span>تمرین</span><strong>{draft.availability.daysPerWeek === null ? '—' : `${draft.availability.daysPerWeek.toLocaleString('fa-IR')} روز در هفته`}</strong></div>
            <div><span>شروع</span><strong>{startDate}</strong></div>
            <div><span>دوره</span><strong>{duration === null ? '—' : `${duration.toLocaleString('fa-IR')} روز`}</strong></div>
          </div>
        ) : null}

        {cycleError ? <p className="auth-message auth-message--error" role="alert">ورود به برنامه انجام نشد. صفحه را تازه کن و دوباره تلاش کن.</p> : null}

        <div className="onboarding-ready-card__actions">
          {guest ? <Link className="is-primary" href="/auth">ورود یا ساخت حساب</Link> : hasCycle ? (
            <Link className="is-primary" href="/program">رفتن به برنامه من</Link>
          ) : (
            <form action={createProgramCycle}><CreateCycleButton /></form>
          )}
          {!guest ? <Link href="/onboarding/review">ویرایش اطلاعات</Link> : null}
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

  const [{ data, error }, activeCredential, cycle, params] = await Promise.all([
    supabase
      .from('user_onboarding')
      .select('status,schema_version,draft')
      .eq('user_id', active.userId)
      .maybeSingle(),
    supabase
      .from('encrypted_provider_credentials')
      .select('provider,status')
      .eq('user_id', active.userId)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('program_cycles')
      .select('id')
      .eq('user_id', active.userId)
      .neq('status', 'completed')
      .neq('status', 'abandoned')
      .limit(1)
      .maybeSingle(),
    searchParams,
  ]);

  const draft = parseOnboardingDraft(data?.draft ?? null);
  if (
    error ||
    activeCredential.error ||
    !activeCredential.data ||
    data?.status !== 'completed' ||
    data.schema_version !== ONBOARDING_SCHEMA_VERSION ||
    !draft
  ) {
    redirect('/onboarding/welcome');
  }

  return <ReadySummary draft={draft} hasCycle={Boolean(cycle.data)} cycleError={params.error === 'cycle' || Boolean(cycle.error)} />;
}
