import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loadProgramCycleSnapshot } from '@/lib/program-cycle/data';
import { programCycleStatusLabel } from '@/lib/program-cycle/core';
import { activateProgramCycle, generateProgramCycle, recoverProgramCycleGeneration } from './actions';
import { ProgramActionButton } from './program-action-button';
import './program.css';

export const dynamic = 'force-dynamic';

const GENERATION_STALE_MS = 5 * 60_000;

type ProgramIssue = {
  readonly text: string;
  readonly tone: 'warning' | 'error';
  readonly retry: boolean;
  readonly actionHref?: string;
  readonly actionLabel?: string;
};

const PROGRAM_ISSUES: Readonly<Record<string, ProgramIssue>> = {
  invalid_request: {
    text: 'این صفحه به‌روز نیست. یک‌بار صفحه را تازه کن و دوباره تلاش کن.',
    tone: 'error',
    retry: false,
  },
  stale_or_incomplete: {
    text: 'بخشی از اطلاعات دوره تغییر کرده یا کامل نیست. قبل از ادامه، اطلاعاتت را مرور کن.',
    tone: 'warning',
    retry: false,
    actionHref: '/onboarding/review',
    actionLabel: 'مرور اطلاعات',
  },
  profile_incomplete: {
    text: 'برای ساخت برنامه، بخشی از اطلاعات لازم هنوز کامل نیست. اطلاعاتت را تکمیل کن و دوباره برگرد.',
    tone: 'warning',
    retry: false,
    actionHref: '/onboarding/review',
    actionLabel: 'تکمیل اطلاعات',
  },
  onboarding_snapshot_changed: {
    text: 'اطلاعاتت بعد از شروع این دوره تغییر کرده است. یک‌بار آن را مرور و تأیید کن تا برنامه بر اساس آخرین اطلاعات ساخته شود.',
    tone: 'warning',
    retry: false,
    actionHref: '/onboarding/review',
    actionLabel: 'مرور و تأیید اطلاعات',
  },
  clinical_review_required: {
    text: 'برای ساخت برنامه تمرین، یکی از محدودیت‌های سلامت یا دردهایی که ثبت کرده‌ای نیاز به مرور دارد.',
    tone: 'warning',
    retry: false,
    actionHref: '/onboarding/review',
    actionLabel: 'مرور اطلاعات سلامت',
  },
  nutrition_clinical_review_required: {
    text: 'برای ساخت برنامه غذایی، اطلاعات سلامت یا دارویی ثبت‌شده نیاز به بررسی بیشتری دارد.',
    tone: 'warning',
    retry: false,
    actionHref: '/onboarding/medical',
    actionLabel: 'مرور اطلاعات سلامت',
  },
  allergy_review_required: {
    text: 'به‌خاطر حساسیت غذایی ثبت‌شده، فعلاً برنامه غذایی خودکار ساخته نمی‌شود تا انتخاب غذا مطمئن بماند.',
    tone: 'warning',
    retry: false,
    actionHref: '/onboarding/nutrition',
    actionLabel: 'مرور حساسیت‌ها',
  },
  diet_catalog_unsupported: {
    text: 'الگوی غذایی انتخاب‌شده هنوز در برنامه‌ساز فعلی پشتیبانی نمی‌شود.',
    tone: 'warning',
    retry: false,
    actionHref: '/onboarding/nutrition',
    actionLabel: 'تغییر الگوی غذایی',
  },
  insufficient_safe_exercises: {
    text: 'با تجهیزات و محدودیت‌های فعلی، تمرین مناسب کافی برای ساخت یک برنامه کامل پیدا نشد.',
    tone: 'warning',
    retry: false,
    actionHref: '/onboarding/availability',
    actionLabel: 'مرور تجهیزات و زمان',
  },
  insufficient_catalog_foods: {
    text: 'با انتخاب‌های غذایی فعلی، گزینه کافی برای ساخت یک برنامه هفتگی پیدا نشد.',
    tone: 'warning',
    retry: false,
    actionHref: '/onboarding/nutrition',
    actionLabel: 'مرور تغذیه',
  },
  planner_unavailable: {
    text: 'ارتباط با مربی هوشمند برقرار نشد. اتصال هوش مصنوعی را بررسی کن.',
    tone: 'error',
    retry: false,
    actionHref: '/profile/ai',
    actionLabel: 'بررسی اتصال هوش مصنوعی',
  },
  planner_invalid_output: {
    text: 'ساخت برنامه این بار کامل نشد. دوباره تلاش کن.',
    tone: 'error',
    retry: true,
  },
  planner_output_incomplete: {
    text: 'پاسخ مربی هوشمند این بار ناتمام ماند و برنامه کامل ساخته نشد. اتصال هوش مصنوعی و مدل انتخاب‌شده را بررسی کن.',
    tone: 'error',
    retry: false,
    actionHref: '/profile/ai',
    actionLabel: 'بررسی اتصال هوش مصنوعی',
  },
  planner_selection_invalid: {
    text: 'ساخت برنامه این بار کامل نشد. دوباره تلاش کن.',
    tone: 'error',
    retry: true,
  },
  generation_start_failed: {
    text: 'ساخت برنامه شروع نشد. دوباره تلاش کن.',
    tone: 'error',
    retry: true,
  },
  generation_persist_failed: {
    text: 'ساخت برنامه کامل نشد. هیچ برنامه ناقصی فعال نشده؛ دوباره تلاش کن.',
    tone: 'error',
    retry: true,
  },
  materialization_persist_failed: {
    text: 'ساخت برنامه کامل نشد. هیچ برنامه ناقصی فعال نشده؛ دوباره تلاش کن.',
    tone: 'error',
    retry: true,
  },
  generation_failed: {
    text: 'ساخت برنامه کامل نشد. دوباره تلاش کن.',
    tone: 'error',
    retry: true,
  },
  generation_stale_recovered: {
    text: 'تلاش قبلی بسته شد. می‌توانی ساخت برنامه را دوباره شروع کنی.',
    tone: 'warning',
    retry: true,
  },
  generation_still_running: {
    text: 'ساخت برنامه هنوز در حال انجام است. کمی بعد صفحه را تازه کن.',
    tone: 'warning',
    retry: false,
  },
  generation_recovery_failed: {
    text: 'تلاش قبلی هنوز بسته نشده است. صفحه را تازه کن و دوباره بررسی کن.',
    tone: 'error',
    retry: false,
  },
  activation_failed: {
    text: 'فعال‌سازی برنامه کامل نشد. دوباره تلاش کن.',
    tone: 'error',
    retry: false,
  },
};

const FALLBACK_ISSUE: ProgramIssue = {
  text: 'ساخت برنامه کامل نشد. اطلاعاتت را مرور کن یا دوباره تلاش کن.',
  tone: 'error',
  retry: true,
};

function formatProgramDate(value: string): string {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return value;
  const [year, month, day] = parts as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return value;
  return new Intl.DateTimeFormat('fa-IR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export default async function ProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const [snapshot, query] = await Promise.all([loadProgramCycleSnapshot(), searchParams]);
  if (snapshot.mode === 'guest') redirect('/auth');
  if (snapshot.mode === 'account' && !snapshot.cycle) redirect('/onboarding/ready');

  const cycle = snapshot.cycle;
  if (!cycle) {
    return <section className="program-cycle-page"><p role="alert">{snapshot.loadError ?? 'برنامه در دسترس نیست.'}</p></section>;
  }

  const generated = snapshot.workoutPlan && snapshot.nutritionPlan;
  const cycleUpdatedAt = Date.parse(cycle.updated_at);
  const canRecoverGeneration = cycle.status === 'generating'
    && Number.isFinite(cycleUpdatedAt)
    && Date.now() - cycleUpdatedAt >= GENERATION_STALE_MS;

  const success = query.message === 'plans-ready' && cycle.status === 'ready'
    ? 'برنامه تمرین و تغذیه آماده‌اند. خلاصه را ببین و در صورت تأیید فعالشان کن.'
    : query.message === 'plans-active' && cycle.status === 'active'
      ? 'برنامه‌ها فعال شدند و حالا در بخش تمرین و تغذیه در دسترس‌اند.'
      : query.message === 'generation-recovered'
        ? 'تلاش قبلی بسته شد. حالا می‌توانی دوباره برنامه را بسازی.'
        : null;

  // Generation eligibility and the "needs review" prompt derive ONLY from the
  // persisted cycle row, never from the user-controllable URL. A ?message= or
  // ?error= param may color the transient banner below, but it can never
  // re-open a fail-closed cycle for generation or hide a required review step.
  const persistedFailureCode = cycle.status === 'failed' ? cycle.generation_failure_code : null;
  const persistedIssue = persistedFailureCode ? PROGRAM_ISSUES[persistedFailureCode] ?? FALLBACK_ISSUE : null;
  // A cycle pinned to a now-diverged onboarding draft cannot be generated: the
  // action fails closed on the same mismatch. Route to review instead of
  // offering a dead button, and treat it as the reason needing user action.
  const snapshotChanged = snapshot.onboardingChanged;
  const canGenerate = !snapshotChanged && (
    cycle.status === 'draft'
    || (cycle.status === 'failed' && (persistedIssue?.retry ?? true))
  );
  const reviewIssue = snapshotChanged
    ? PROGRAM_ISSUES.onboarding_snapshot_changed
    : (cycle.status === 'failed' && persistedIssue && !persistedIssue.retry ? persistedIssue : null);
  const needsUserAction = Boolean(reviewIssue?.actionHref && reviewIssue.actionLabel);

  // Banner: an explicit ?error= wins; otherwise fall back to the persisted
  // failure reason, suppressed while a fresh success message is showing.
  const bannerCode = query.error ?? (query.message ? null : persistedFailureCode);
  const issue = bannerCode ? PROGRAM_ISSUES[bannerCode] ?? FALLBACK_ISSUE : null;
  const startLabel = formatProgramDate(cycle.start_date);
  const endLabel = formatProgramDate(cycle.end_date);

  return (
    <section className="page-stack program-cycle-page" aria-labelledby="program-cycle-heading">
      <header className="program-cycle-heading">
        <div>
          <p className="section-kicker">برنامه من</p>
          <h2 id="program-cycle-heading">دورهٔ شخصی تو</h2>
          <p>تمرین و وعده‌های هفتگی براساس اطلاعات و ترجیحات ثبت‌شده‌ات آماده می‌شوند.</p>
        </div>
        <span className={`program-cycle-status is-${cycle.status}`}>{programCycleStatusLabel(cycle.status)}</span>
      </header>

      {success ? <div className="auth-notice auth-notice--success" role="status">{success}</div> : null}
      {issue ? (
        <div className={`auth-notice ${issue.tone === 'error' ? 'auth-notice--error' : 'auth-notice--warning'}`} role={issue.tone === 'error' ? 'alert' : 'status'}>
          {issue.text}
        </div>
      ) : null}

      <article className="program-cycle-period" aria-label="بازه دوره">
        <span>{cycle.requested_duration_days.toLocaleString('fa-IR')} روز</span>
        <strong>{startLabel} تا {endLabel}</strong>
      </article>

      {needsUserAction ? (
        <article className="program-cycle-command">
          <div>
            <p className="section-kicker">قبل از ادامه</p>
            <h3>یک مورد نیاز به مرور دارد</h3>
            <p>اطلاعات مربوط را اصلاح یا تأیید کن، بعد برگرد و برنامه را بساز.</p>
          </div>
          <Link className="primary-button" href={reviewIssue!.actionHref!}>{reviewIssue!.actionLabel}</Link>
        </article>
      ) : null}

      {canGenerate ? (
        <article className="program-cycle-command">
          <div>
            <p className="section-kicker">گام بعد</p>
            <h3>ساخت برنامهٔ تمرین و تغذیه</h3>
            <p>محدودیت‌های سلامت، تجهیزات، سابقه تمرین و ترجیحاتت بررسی می‌شوند؛ بخش غذایی فعلاً وعده‌ها را بدون تعیین هدف کالری یا سهم شخصی می‌چیند.</p>
          </div>
          <form action={generateProgramCycle}>
            <input type="hidden" name="cycleId" value={cycle.id} />
            <input type="hidden" name="revision" value={cycle.revision} />
            <ProgramActionButton pendingLabel="در حال ساخت برنامه…">ساخت برنامه</ProgramActionButton>
          </form>
        </article>
      ) : null}

      {cycle.status === 'generating' ? (
        <article className="program-cycle-command" aria-live="polite">
          <div>
            <p className="section-kicker">در حال آماده‌سازی</p>
            <h3>برنامه‌ها در حال ساخته‌شدن هستند</h3>
            <p>این مرحله ممکن است کمی زمان ببرد. وقتی هر دو برنامه آماده شوند، خلاصه‌شان همین‌جا نمایش داده می‌شود.</p>
          </div>
          {canRecoverGeneration ? (
            <form action={recoverProgramCycleGeneration}>
              <input type="hidden" name="cycleId" value={cycle.id} />
              <input type="hidden" name="revision" value={cycle.revision} />
              <ProgramActionButton pendingLabel="در حال بازنشانی…">تلاش دوباره</ProgramActionButton>
            </form>
          ) : null}
        </article>
      ) : null}

      {generated ? (
        <div className="program-plan-grid" aria-label="خلاصه برنامه‌ها">
          <article>
            <span>برنامه تمرین</span>
            <h3>{snapshot.workoutPlan!.title}</h3>
            <strong>{snapshot.workoutPlan!.document.days.length.toLocaleString('fa-IR')} جلسه</strong>
            <p>{snapshot.workoutPlan!.document.days.reduce((sum, day) => sum + day.exercises.length, 0).toLocaleString('fa-IR')} حرکت در کل برنامه</p>
          </article>
          <article>
            <span>برنامه غذایی</span>
            <h3>{snapshot.nutritionPlan!.title}</h3>
            <strong>{snapshot.nutritionPlan!.document.days.length.toLocaleString('fa-IR')} روز</strong>
            <p>{snapshot.nutritionPlan!.document.days.reduce((sum, day) => sum + day.meals.length, 0).toLocaleString('fa-IR')} وعده در طول هفته</p>
          </article>
        </div>
      ) : null}

      {cycle.status === 'ready' && generated ? (
        <article className="program-cycle-command is-ready">
          <div>
            <p className="section-kicker">آماده است</p>
            <h3>برنامه‌ها را فعال کن</h3>
            <p>بعد از فعال‌سازی، برنامه تمرین و برنامه غذایی در بخش‌های اصلی اپ نمایش داده می‌شوند.</p>
          </div>
          <form action={activateProgramCycle}>
            <input type="hidden" name="cycleId" value={cycle.id} />
            <input type="hidden" name="revision" value={cycle.revision} />
            <ProgramActionButton pendingLabel="در حال فعال‌سازی…">فعال‌سازی برنامه</ProgramActionButton>
          </form>
        </article>
      ) : null}

      {cycle.status === 'active' ? (
        <div className="program-cycle-destinations">
          <Link className="primary-button" href="/workout">برنامه تمرین</Link>
          <Link className="primary-button" href="/nutrition/plan">برنامه غذایی</Link>
        </div>
      ) : null}

      <div className="program-cycle-links">
        <Link href="/onboarding/review">ویرایش اطلاعات من</Link>
      </div>
    </section>
  );
}
