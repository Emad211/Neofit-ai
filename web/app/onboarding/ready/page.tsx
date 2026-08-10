import Link from 'next/link';
import { redirect } from 'next/navigation';
import { activeAuthSession } from '@/lib/auth/active-session';
import { goalLabels, ONBOARDING_SCHEMA_VERSION, parseOnboardingDraft, type OnboardingDraft } from '@/lib/onboarding/model';
import { createClient } from '@/lib/supabase/server';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';

export const dynamic = 'force-dynamic';

function ReadySummary({ draft, demo = false }: { draft: OnboardingDraft | null; demo?: boolean }) {
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
          <p>این داده‌ها ورودی معتبر چرخه برنامه هستند. تا وقتی چرخه برنامه و Plannerهای ساختاریافته فعال نشده‌اند، NeoFit برنامه ساختگی یا محاسبات تغذیه‌ای حدسی نمایش نمی‌دهد.</p>
        </div>

        <div className="onboarding-ready-card__actions">
          {demo ? <Link className="is-primary" href="/auth">ورود و ساخت دوره واقعی</Link> : <Link className="is-primary" href="/onboarding/review">مرور دوباره اطلاعات</Link>}
          <Link href={demo ? '/today' : '/profile/ai'}>{demo ? 'بازگشت به Demo' : 'مدیریت کلید AI'}</Link>
        </div>
      </section>
    </main>
  );
}

export default async function OnboardingReadyPage() {
  if (!hasSupabasePublicEnv()) {
    return <ReadySummary draft={null} demo />;
  }

  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) redirect('/auth');

  const { data, error } = await supabase
    .from('user_onboarding')
    .select('status,schema_version,draft')
    .eq('user_id', active.userId)
    .maybeSingle();

  const draft = parseOnboardingDraft(data?.draft ?? null);
  if (
    error ||
    data?.status !== 'completed' ||
    data.schema_version !== ONBOARDING_SCHEMA_VERSION ||
    !draft
  ) {
    redirect('/onboarding/welcome');
  }

  return <ReadySummary draft={draft} />;
}
