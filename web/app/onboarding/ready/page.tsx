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
  demo = false,
  hasCycle = false,
  cycleError = false,
}: {
  draft: OnboardingDraft | null;
  demo?: boolean;
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
        <p className="section-kicker">{demo ? 'Demo Onboarding' : 'Onboarding کامل شد'}</p>
        <h1 id="onboarding-ready-heading">اطلاعات دوره آماده است</h1>
        <p className="onboarding-ready-card__intro">
          {demo
            ? 'این پیش‌نویس فقط روی همین مرورگر است و برنامه AI شخصی برای آن ساخته نمی‌شود.'
            : 'پاسخ‌ها، محدودیت‌های ایمنی و بازه دوره ذخیره شده‌اند. هنوز هیچ برنامه تمرین یا تغذیه‌ای را ساخته‌شده اعلام نمی‌کنیم.'}
        </p>

        {draft ? (
          <div className="onboarding-ready-card__summary" aria-label="خلاصه دوره">
            <div><span>هدف</span><strong>{goal ?? '—'}</strong></div>
            <div><span>شروع</span><strong>{startDate ?? '—'}</strong></div>
            <div><span>مدت</span><strong>{duration === null ? '—' : `${duration.toLocaleString('fa-IR')} روز`}</strong></div>
            <div><span>تمرین</span><strong>{draft.availability.daysPerWeek === null ? '—' : `${draft.availability.daysPerWeek.toLocaleString('fa-IR')} روز/هفته`}</strong></div>
          </div>
        ) : null}

        <div className="onboarding-boundary-note">
          <strong>قدم بعدی NeoFit</strong>
          <p>این داده‌ها ورودی معتبر چرخهٔ دوره هستند. برنامهٔ تمرین و تغذیه فقط بعد از تولید و اعتبارسنجی نمایش داده می‌شوند و هیچ برنامهٔ ساختگی جای آن‌ها را نمی‌گیرد.</p>
        </div>

        {cycleError ? <p className="auth-message auth-message--error" role="alert">ساخت یا بازیابی چرخه انجام نشد. اگر چرخهٔ دیگری باز است، از مسیر اصلی وارد آن شو.</p> : null}

        <div className="onboarding-ready-card__actions">
          {demo ? <Link className="is-primary" href="/auth">ورود و ساخت دوره واقعی</Link> : hasCycle ? (
            <Link className="is-primary" href="/program">مشاهدهٔ چرخهٔ دوره</Link>
          ) : (
            <form action={createProgramCycle}><CreateCycleButton /></form>
          )}
          {!demo ? <Link href="/onboarding/review">مرور دوباره اطلاعات</Link> : null}
          <Link href={demo ? '/today' : '/profile/ai'}>{demo ? 'بازگشت به Demo' : 'مدیریت کلید AI'}</Link>
        </div>
      </section>
    </main>
  );
}

export default async function OnboardingReadyPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!hasSupabasePublicEnv()) {
    return <ReadySummary draft={null} demo />;
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
