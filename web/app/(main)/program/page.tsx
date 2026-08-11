import Link from 'next/link';
import { redirect } from 'next/navigation';
import { loadProgramCycleSnapshot } from '@/lib/program-cycle/data';
import { programCycleStatusLabel } from '@/lib/program-cycle/core';
import { activateProgramCycle, generateProgramCycle } from './actions';
import { ProgramActionButton } from './program-action-button';
import './program.css';

export const dynamic = 'force-dynamic';

const ERROR_MESSAGES: Readonly<Record<string, string>> = {
  invalid_request: 'درخواست معتبر نبود. صفحه را تازه کن و دوباره تلاش کن.',
  stale_or_incomplete: 'اطلاعات دوره تغییر کرده یا کامل نیست. صفحه را تازه کن و ورودی‌ها را مرور کن.',
  clinical_review_required: 'به‌دلیل محدودیت یا درد گزارش‌شده، تولید خودکار تمرین متوقف شد و نیاز به بررسی انسانی دارد.',
  allergy_review_required: 'برای حسابی که آلرژی غذایی ثبت کرده، تا تکمیل دادهٔ آلرژن کاتالوگ برنامهٔ خودکار ساخته نمی‌شود.',
  diet_catalog_unsupported: 'کاتالوگ فعلی هنوز پوشش ایمن کافی برای الگوی غذایی انتخاب‌شده ندارد.',
  insufficient_safe_exercises: 'با تجهیزات و محدودیت‌های فعلی، حرکت ایمن کافی در رجیستری پیدا نشد.',
  generation_start_failed: 'شروع ساخت برنامه ثبت نشد. دوباره تلاش کن.',
  generation_persist_failed: 'ساخت برنامه کامل نشد و هیچ برنامهٔ ناقصی فعال نشده است.',
  activation_failed: 'فعال‌سازی اتمیک دو برنامه انجام نشد؛ نسخه‌های قبلی دست‌نخورده باقی ماندند.',
};

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
    return <section className="program-cycle-page"><p role="alert">{snapshot.loadError ?? 'چرخهٔ دوره در دسترس نیست.'}</p></section>;
  }
  const generated = snapshot.workoutPlan && snapshot.nutritionPlan;
  const success = query.message === 'plans-ready'
    ? 'هر دو برنامه ساخته شدند. پیش از فعال‌سازی خلاصه را بررسی کن.'
    : query.message === 'plans-active'
      ? 'برنامهٔ تمرین و تغذیه با هم فعال شدند و اکنون در بخش‌های اصلی در دسترس‌اند.'
      : null;
  const error = query.error ? ERROR_MESSAGES[query.error] ?? 'عملیات برنامه انجام نشد.' : snapshot.loadError;

  return (
    <section className="page-stack program-cycle-page" aria-labelledby="program-cycle-heading">
      <header className="program-cycle-heading">
        <div>
          <p className="section-kicker">مرکز برنامه‌ریزی NeoFit</p>
          <h2 id="program-cycle-heading">دورهٔ شخصی تو</h2>
          <p>از اطلاعات Onboarding تا دو برنامهٔ نسخه‌دار، قابل بررسی و قابل فعال‌سازی.</p>
        </div>
        <span className={`program-cycle-status is-${cycle.status}`}>{programCycleStatusLabel(cycle.status)}</span>
      </header>

      {success ? <div className="auth-notice auth-notice--success" role="status">{success}</div> : null}
      {error ? <div className="auth-notice auth-notice--error" role="alert">{error}</div> : null}

      <article className="program-cycle-hero">
        <div><span>بازهٔ دوره</span><strong>{cycle.requested_duration_days.toLocaleString('fa-IR')} روز</strong><p>{cycle.start_date} تا {cycle.end_date}</p></div>
        <div><span>نسخهٔ چرخه</span><strong>{cycle.revision.toLocaleString('fa-IR')}</strong><p>Onboarding v{cycle.onboarding_schema_version.toLocaleString('fa-IR')}</p></div>
        <div><span>خروجی معتبر</span><strong>{generated ? '۲ برنامه' : 'هنوز صفر'}</strong><p>تمرین + تغذیه باید با هم آماده شوند</p></div>
      </article>

      {cycle.status === 'draft' || cycle.status === 'failed' ? (
        <article className="program-cycle-command">
          <div>
            <p className="section-kicker">گام بعد</p>
            <h3>ساخت برنامهٔ تمرین و تغذیه</h3>
            <p>NeoFit حرکت‌ها را فقط از رجیستری ایمن و غذاها را فقط از کاتالوگ نسخه‌دار انتخاب می‌کند. اگر آلرژی یا محدودیت مبهم باشد، فرایند متوقف می‌شود.</p>
          </div>
          <form action={generateProgramCycle}>
            <input type="hidden" name="cycleId" value={cycle.id} />
            <input type="hidden" name="revision" value={cycle.revision} />
            <ProgramActionButton pendingLabel="در حال ساخت دو برنامه…">ساخت دو برنامه</ProgramActionButton>
          </form>
        </article>
      ) : null}

      {cycle.status === 'generating' ? (
        <article className="program-cycle-command" aria-live="polite">
          <div><p className="section-kicker">در حال ساخت</p><h3>دو برنامه در یک تراکنش آماده می‌شوند</h3><p>صفحه را تازه کن. تا وقتی هر دو خروجی معتبر نباشند، چیزی فعال نخواهد شد.</p></div>
        </article>
      ) : null}

      {generated ? (
        <div className="program-plan-grid" aria-label="خلاصه برنامه‌های ساخته‌شده">
          <article>
            <span>ایجنت تمرین</span>
            <h3>{snapshot.workoutPlan!.title}</h3>
            <strong>{snapshot.workoutPlan!.document.days.length.toLocaleString('fa-IR')} جلسه</strong>
            <p>{snapshot.workoutPlan!.document.days.reduce((sum, day) => sum + day.exercises.length, 0).toLocaleString('fa-IR')} حرکت رجیستری‌شده · نسخه {snapshot.workoutPlan!.version.toLocaleString('fa-IR')}</p>
          </article>
          <article>
            <span>ایجنت تغذیه</span>
            <h3>{snapshot.nutritionPlan!.title}</h3>
            <strong>{snapshot.nutritionPlan!.document.days.length.toLocaleString('fa-IR')} روز</strong>
            <p>{snapshot.nutritionPlan!.document.days.reduce((sum, day) => sum + day.meals.length, 0).toLocaleString('fa-IR')} وعده از هویت‌های کاتالوگ · نسخه {snapshot.nutritionPlan!.version.toLocaleString('fa-IR')}</p>
          </article>
        </div>
      ) : null}

      {cycle.status === 'ready' && generated ? (
        <article className="program-cycle-command is-ready">
          <div><p className="section-kicker">بازبینی نهایی</p><h3>هر دو برنامه آمادهٔ فعال‌سازی‌اند</h3><p>فعال‌سازی در یک عملیات اتمیک انجام می‌شود؛ نسخهٔ ناقص یا تک‌برنامه‌ای وارد حساب نمی‌شود.</p></div>
          <form action={activateProgramCycle}>
            <input type="hidden" name="cycleId" value={cycle.id} />
            <input type="hidden" name="revision" value={cycle.revision} />
            <ProgramActionButton pendingLabel="در حال فعال‌سازی…">فعال‌سازی برنامه</ProgramActionButton>
          </form>
        </article>
      ) : null}

      {cycle.status === 'active' ? (
        <div className="program-cycle-destinations">
          <Link className="primary-button" href="/workout">مشاهده برنامه تمرین</Link>
          <Link className="primary-button" href="/nutrition/plan">مشاهده برنامه غذایی</Link>
        </div>
      ) : null}

      <div className="program-cycle-links">
        <Link href="/onboarding/review">مرور اطلاعات ورودی</Link>
        <Link href="/profile/ai">مدیریت اتصال AI</Link>
      </div>
    </section>
  );
}
