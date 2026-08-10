'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { InjuryBodyMap } from '@/components/onboarding/body-map/injury-body-map';
import { OnboardingAiGate } from '@/components/onboarding/onboarding-ai-gate';
import { useOnboarding } from '@/components/onboarding/onboarding-context';
import { formatLocalDate } from '@/lib/local-date';
import { OnboardingConflictError } from '@/lib/onboarding/persistence';
import {
  NUTRITION_AUTHORITY_NOTE,
  ONBOARDING_TOTAL_STEPS,
  PROGRAM_DURATION_MAX_DAYS,
  PROGRAM_DURATION_MIN_DAYS,
  buildTrainingPreview,
  equipmentOptions,
  getNextOnboardingStep,
  getOnboardingStep,
  getPreviousOnboardingStep,
  goalLabels,
  onboardingSteps,
  resumeStepNumber,
  validateOnboardingStep,
  weekdayOptions,
  type EquipmentId,
  type GoalId,
  type OnboardingDraft,
  type OnboardingStepSlug,
} from '@/lib/onboarding/model';

function numberOrNull(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function localToday() {
  return formatLocalDate(new Date());
}

function ListEditor({ values, onChange, placeholder }: { values: string[]; onChange(values: string[]): void; placeholder: string }) {
  const [input, setInput] = useState('');
  const add = () => {
    const value = input.trim();
    if (!value) return;
    if (!values.includes(value)) onChange([...values, value]);
    setInput('');
  };
  return <div className="onboarding-list-editor">
    <div>
      <input
        value={input}
        maxLength={160}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }}
        placeholder={placeholder}
      />
      <button type="button" onClick={add}>افزودن</button>
    </div>
    {values.length ? <ul>{values.map((value) => <li key={value}><span>{value}</span><button type="button" onClick={() => onChange(values.filter((item) => item !== value))} aria-label={`حذف ${value}`}>×</button></li>)}</ul> : null}
  </div>;
}

function ChoiceGrid<T extends string>({ value, options, onChange }: { value: T | null; options: readonly { value: T; label: string; description?: string }[]; onChange(value: T): void }) {
  return <div className="onboarding-choice-grid">{options.map((option) => <button type="button" key={option.value} className={value === option.value ? 'is-selected' : ''} aria-pressed={value === option.value} onClick={() => onChange(option.value)}><strong>{option.label}</strong>{option.description ? <small>{option.description}</small> : null}</button>)}</div>;
}

function BooleanChoice({ value, onChange, yesLabel = 'بله', noLabel = 'خیر' }: { value: boolean | null; onChange(value: boolean): void; yesLabel?: string; noLabel?: string }) {
  const selected = value === null ? null : value ? 'yes' : 'no';
  return <ChoiceGrid value={selected} onChange={(next) => onChange(next === 'yes')} options={[{ value: 'yes', label: yesLabel }, { value: 'no', label: noLabel }]} />;
}

function ToggleRow({ checked, onChange, title, description }: { checked: boolean; onChange(checked: boolean): void; title: string; description?: string }) {
  return <label className="onboarding-toggle-row"><span><strong>{title}</strong>{description ? <small>{description}</small> : null}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /></label>;
}

function NumberField({ label, value, onChange, min, max, step = 1, suffix }: { label: string; value: number | null; onChange(value: number | null): void; min?: number; max?: number; step?: number; suffix?: string }) {
  return <label>{label}<span className="onboarding-input-with-suffix"><input type="number" inputMode={step === 1 ? 'numeric' : 'decimal'} value={value ?? ''} min={min} max={max} step={step} onChange={(event) => onChange(numberOrNull(event.target.value))} />{suffix ? <small>{suffix}</small> : null}</span></label>;
}

function ReviewCard({ title, editHref, children }: { title: string; editHref: string; children: ReactNode }) {
  return <article className="onboarding-review-card"><header><h3>{title}</h3><a href={editHref}>ویرایش</a></header><div>{children}</div></article>;
}

function PreferenceGroup({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="onboarding-preference-group"><header><h3>{title}</h3><p>{description}</p></header><div className="onboarding-grid onboarding-grid--2">{children}</div></section>;
}

function nullableSelectValue(value: string | null) {
  return value ?? '';
}

function StepContent({
  step,
  draft,
  mode,
  updateSection,
  onGoogleReadyChange,
}: {
  step: number;
  draft: OnboardingDraft;
  mode: ReturnType<typeof useOnboarding>['mode'];
  updateSection: ReturnType<typeof useOnboarding>['updateSection'];
  onGoogleReadyChange(ready: boolean): void;
}) {
  const preview = buildTrainingPreview(draft);
  const goals = Object.entries(goalLabels) as Array<[GoalId, string]>;

  if (step === 1) {
    const resume = resumeStepNumber(draft);
    return <div className="onboarding-welcome">
      <span className="onboarding-mark">N</span>
      <h1>مربی شخصی NeoFit را متصل کن</h1>
      <p>برای ساخت دوره واقعی، یک کلید معتبر Google AI Studio لازم است. کلید در پروفایل Onboarding ذخیره نمی‌شود و AvalAI فقط پشتیبان اختیاری است.</p>
      <OnboardingAiGate mode={mode} onGoogleReadyChange={onGoogleReadyChange} />
      {draft.completedSteps.length ? <div className="onboarding-resume-note">پیشرفت قبلی پیدا شد؛ می‌توانی از مرحله {resume.toLocaleString('fa-IR')} ادامه بدهی.</div> : null}
      <div className="onboarding-boundary-note"><strong>حریم داده و ایمنی</strong><p>محدودیت پزشک، درد و آسیب همیشه بر ترجیح تمرین اولویت دارند. Raw API key وارد داده‌های self-report نمی‌شود.</p></div>
    </div>;
  }

  if (step === 2) return <>
    <header className="onboarding-step-title"><span>هدف برنامه</span><h1>اولویت اصلی تو چیست؟</h1><p>یک هدف اصلی انتخاب کن. هدف‌های فرعی اختیاری‌اند.</p></header>
    <div className="onboarding-goal-grid">{goals.map(([id, label]) => <button type="button" key={id} className={draft.goal.primaryGoal === id ? 'is-selected' : ''} aria-pressed={draft.goal.primaryGoal === id} onClick={() => updateSection('goal', { ...draft.goal, primaryGoal: id, secondaryGoals: draft.goal.secondaryGoals.filter((goal) => goal !== id) })}>{label}</button>)}</div>
    <label>سرعت مورد انتظار<select value={nullableSelectValue(draft.goal.targetTimeline)} onChange={(event) => updateSection('goal', { ...draft.goal, targetTimeline: (event.target.value || null) as OnboardingDraft['goal']['targetTimeline'] })}><option value="">انتخاب کن</option><option value="steady">آرام و پایدار</option><option value="balanced">متعادل</option><option value="fast">سریع‌تر با کنترل بیشتر</option></select></label>
    <fieldset><legend>هدف‌های فرعی <small className="onboarding-optional">اختیاری</small></legend><div className="onboarding-chip-grid">{goals.filter(([id]) => id !== draft.goal.primaryGoal).map(([id, label]) => <button type="button" key={id} className={draft.goal.secondaryGoals.includes(id) ? 'is-selected' : ''} aria-pressed={draft.goal.secondaryGoals.includes(id)} onClick={() => updateSection('goal', { ...draft.goal, secondaryGoals: toggleValue(draft.goal.secondaryGoals, id) })}>{label}</button>)}</div></fieldset>
  </>;

  if (step === 3) return <>
    <header className="onboarding-step-title"><span>مشخصات پایه</span><h1>اطلاعات اولیه</h1><p>فقط اطلاعاتی را می‌گیریم که برای شخصی‌سازی دوره لازم‌اند.</p></header>
    <div className="onboarding-grid onboarding-grid--2">
      <label>نام نمایشی<input value={draft.basics.name} autoComplete="name" maxLength={80} onChange={(event) => updateSection('basics', { ...draft.basics, name: event.target.value })} /></label>
      <NumberField label="سن" value={draft.basics.age} min={10} max={120} suffix="سال" onChange={(age) => updateSection('basics', { ...draft.basics, age })} />
      <NumberField label="قد" value={draft.basics.heightCm} min={100} max={250} suffix="cm" onChange={(heightCm) => updateSection('basics', { ...draft.basics, heightCm, unitSystem: 'metric' })} />
      <NumberField label="وزن فعلی" value={draft.basics.weightKg} min={25} max={350} step={0.1} suffix="kg" onChange={(weightKg) => updateSection('basics', { ...draft.basics, weightKg, unitSystem: 'metric' })} />
    </div>
    <p className="onboarding-unset-note">ورودی‌های بدنی در این نسخه با kg و cm دریافت و canonical ذخیره می‌شوند تا تبدیل واحد مبهم وارد Planner نشود.</p>
    <fieldset><legend>جنسیت</legend><ChoiceGrid value={draft.basics.gender} onChange={(gender) => updateSection('basics', { ...draft.basics, gender })} options={[{ value: 'male', label: 'مرد' }, { value: 'female', label: 'زن' }, { value: 'other', label: 'سایر' }, { value: 'prefer-not-to-say', label: 'ترجیح می‌دهم نگویم' }]} /></fieldset>
  </>;

  if (step === 4) return <>
    <header className="onboarding-step-title"><span>اندازه‌های بدنی</span><h1>اگر می‌دانی، اضافه کن</h1><p>همه این اندازه‌ها اختیاری‌اند. خالی‌گذاشتن بهتر از مقدار حدسی است.</p></header>
    <div className="onboarding-grid onboarding-grid--2">
      <NumberField label="دور کمر" value={draft.body.waistCm} min={30} max={250} step={0.1} suffix="cm" onChange={(waistCm) => updateSection('body', { ...draft.body, waistCm })} />
      <NumberField label="دور باسن" value={draft.body.hipCm} min={30} max={250} step={0.1} suffix="cm" onChange={(hipCm) => updateSection('body', { ...draft.body, hipCm })} />
      <NumberField label="دور گردن" value={draft.body.neckCm} min={20} max={100} step={0.1} suffix="cm" onChange={(neckCm) => updateSection('body', { ...draft.body, neckCm })} />
      <NumberField label="درصد چربی بدن" value={draft.body.bodyFatPercent} min={2} max={70} step={0.1} suffix="%" onChange={(bodyFatPercent) => updateSection('body', { ...draft.body, bodyFatPercent })} />
      <NumberField label="وزن هدف" value={draft.body.targetWeightKg} min={25} max={350} step={0.1} suffix="kg" onChange={(targetWeightKg) => updateSection('body', { ...draft.body, targetWeightKg })} />
    </div>
  </>;

  if (step === 5) return <>
    <header className="onboarding-step-title"><span>ایمنی</span><h1>محدودیت‌های پزشکی مهم</h1><p>این پاسخ‌ها برای محدودکردن پیشنهادهای تمرینی استفاده می‌شوند، نه برای تشخیص پزشکی.</p></header>
    <label>شرایط یا تشخیص‌های مهم <small className="onboarding-optional">اختیاری</small><ListEditor values={draft.medical.conditions} onChange={(conditions) => updateSection('medical', { ...draft.medical, conditions })} placeholder="مثلاً کم‌کاری تیروئید" /></label>
    <label>داروهای مرتبط <small className="onboarding-optional">اختیاری</small><textarea maxLength={2000} value={draft.medical.medications} onChange={(event) => updateSection('medical', { ...draft.medical, medications: event.target.value })} /></label>
    <fieldset><legend>فشار خون بالا داری؟</legend><BooleanChoice value={draft.medical.hasHighBloodPressure} onChange={(hasHighBloodPressure) => updateSection('medical', { ...draft.medical, hasHighBloodPressure })} /></fieldset>
    <fieldset><legend>دیابت یا اختلال کنترل قند داری؟</legend><BooleanChoice value={draft.medical.hasDiabetes} onChange={(hasDiabetes) => updateSection('medical', { ...draft.medical, hasDiabetes })} /></fieldset>
    <fieldset><legend>سابقه قلبی داری؟</legend><BooleanChoice value={draft.medical.hasCardiacHistory} onChange={(hasCardiacHistory) => updateSection('medical', { ...draft.medical, hasCardiacHistory })} /></fieldset>
    <label>محدودیت یا توصیه پزشک <small className="onboarding-optional">اختیاری</small><textarea maxLength={2000} value={draft.medical.physicianRestrictions} onChange={(event) => updateSection('medical', { ...draft.medical, physicianRestrictions: event.target.value })} placeholder="هر محدودیتی که باید همیشه بر پیشنهاد برنامه اولویت داشته باشد" /></label>
    <ToggleRow checked={draft.medical.medicalAcknowledged} onChange={(medicalAcknowledged) => updateSection('medical', { ...draft.medical, medicalAcknowledged })} title="می‌دانم NeoFit جایگزین پزشک نیست" description="در علائم جدید، شدید یا نگران‌کننده باید ارزیابی مناسب انجام شود." />
  </>;

  if (step === 6) return <>
    <header className="onboarding-step-title"><span>آسیب‌ها</span><h1>درد و محدودیت را روی بدن مشخص کن</h1><p>در موبایل بین نمای جلو و پشت جابه‌جا شو و فقط ناحیه‌هایی را که واقعاً مهم‌اند انتخاب کن.</p></header>
    <fieldset><legend>در حال حاضر آسیب یا محدودیت مهمی داری؟</legend><ChoiceGrid value={draft.injuries.noInjuries === null ? null : draft.injuries.noInjuries ? 'no' : 'yes'} onChange={(answer) => updateSection('injuries', { ...draft.injuries, noInjuries: answer === 'no', areas: answer === 'no' ? [] : draft.injuries.areas })} options={[{ value: 'yes', label: 'بله' }, { value: 'no', label: 'خیر' }]} /></fieldset>
    {draft.injuries.noInjuries === false ? <InjuryBodyMap value={draft.injuries.areas} onChange={(areas) => updateSection('injuries', { ...draft.injuries, areas })} /> : null}
    <fieldset><legend>هنگام تمرین درد تجربه می‌کنی؟</legend><BooleanChoice value={draft.injuries.painDuringExercise} onChange={(painDuringExercise) => updateSection('injuries', { ...draft.injuries, painDuringExercise, painScale: painDuringExercise ? draft.injuries.painScale : null })} /></fieldset>
    {draft.injuries.painDuringExercise === true ? <NumberField label="شدت درد معمول" value={draft.injuries.painScale} min={0} max={10} suffix="از ۱۰" onChange={(painScale) => updateSection('injuries', { ...draft.injuries, painScale })} /> : null}
    <label>محدودیت کلی <small className="onboarding-optional">اختیاری</small><textarea maxLength={2000} value={draft.injuries.generalLimitations} onChange={(event) => updateSection('injuries', { ...draft.injuries, generalLimitations: event.target.value })} placeholder="مثلاً پرش، دویدن، دامنه عمیق زانو یا فشار بالای سر" /></label>
  </>;

  if (step === 7) return <>
    <header className="onboarding-step-title"><span>سبک زندگی</span><h1>بدن تو بیرون از باشگاه چه شرایطی دارد؟</h1><p>خواب، استرس و فعالیت روزانه روی ظرفیت برنامه اثر می‌گذارند.</p></header>
    <div className="onboarding-grid onboarding-grid--2">
      <label>شغل یا فعالیت روزانه <small className="onboarding-optional">اختیاری</small><input maxLength={160} value={draft.lifestyle.occupation} onChange={(event) => updateSection('lifestyle', { ...draft.lifestyle, occupation: event.target.value })} /></label>
      <label>سطح فعالیت<select value={nullableSelectValue(draft.lifestyle.activityLevel)} onChange={(event) => updateSection('lifestyle', { ...draft.lifestyle, activityLevel: (event.target.value || null) as OnboardingDraft['lifestyle']['activityLevel'] })}><option value="">انتخاب کن</option><option value="sedentary">کم‌تحرک</option><option value="light">سبک</option><option value="moderate">متوسط</option><option value="high">زیاد</option></select></label>
      <NumberField label="ساعت نشستن روزانه" value={draft.lifestyle.sittingHours} min={0} max={24} step={0.5} suffix="ساعت" onChange={(sittingHours) => updateSection('lifestyle', { ...draft.lifestyle, sittingHours })} />
      <NumberField label="قدم روزانه" value={draft.lifestyle.dailySteps} min={0} max={100000} suffix="قدم" onChange={(dailySteps) => updateSection('lifestyle', { ...draft.lifestyle, dailySteps })} />
      <NumberField label="خواب معمول" value={draft.lifestyle.sleepHours} min={0} max={24} step={0.5} suffix="ساعت" onChange={(sleepHours) => updateSection('lifestyle', { ...draft.lifestyle, sleepHours })} />
      <label>کیفیت خواب<select value={nullableSelectValue(draft.lifestyle.sleepQuality)} onChange={(event) => updateSection('lifestyle', { ...draft.lifestyle, sleepQuality: (event.target.value || null) as OnboardingDraft['lifestyle']['sleepQuality'] })}><option value="">انتخاب کن</option><option value="poor">ضعیف</option><option value="average">متوسط</option><option value="good">خوب</option></select></label>
      <label>استرس<select value={nullableSelectValue(draft.lifestyle.stressLevel)} onChange={(event) => updateSection('lifestyle', { ...draft.lifestyle, stressLevel: (event.target.value || null) as OnboardingDraft['lifestyle']['stressLevel'] })}><option value="">انتخاب کن</option><option value="low">کم</option><option value="medium">متوسط</option><option value="high">زیاد</option></select></label>
      <label>سیگار<select value={nullableSelectValue(draft.lifestyle.smoking)} onChange={(event) => updateSection('lifestyle', { ...draft.lifestyle, smoking: (event.target.value || null) as OnboardingDraft['lifestyle']['smoking'] })}><option value="">انتخاب کن</option><option value="never">هرگز</option><option value="sometimes">گاهی</option><option value="daily">روزانه</option></select></label>
    </div>
    <label>نکته درباره روتین روزانه <small className="onboarding-optional">اختیاری</small><textarea maxLength={2000} value={draft.lifestyle.routineNotes} onChange={(event) => updateSection('lifestyle', { ...draft.lifestyle, routineNotes: event.target.value })} /></label>
  </>;

  if (step === 8) return <>
    <header className="onboarding-step-title"><span>تغذیه</span><h1>غذا باید با زندگی تو سازگار باشد</h1><p>اینجا فقط ترجیح، محدودیت و دسترسی ثبت می‌شود؛ کالری و ماکرو را AI حدس نمی‌زند.</p></header>
    <div className="onboarding-grid onboarding-grid--2">
      <NumberField label="تعداد وعده در روز" value={draft.nutrition.mealsPerDay} min={1} max={8} onChange={(mealsPerDay) => updateSection('nutrition', { ...draft.nutrition, mealsPerDay })} />
      <label>الگوی غذایی<select value={nullableSelectValue(draft.nutrition.dietType)} onChange={(event) => updateSection('nutrition', { ...draft.nutrition, dietType: (event.target.value || null) as OnboardingDraft['nutrition']['dietType'] })}><option value="">انتخاب کن</option><option value="balanced">متعادل</option><option value="vegetarian">گیاه‌خواری</option><option value="vegan">وگان</option><option value="pescatarian">پسکتارین</option><option value="low-carb">کم‌کربوهیدرات</option><option value="other">سایر</option></select></label>
      <label>بودجه<select value={nullableSelectValue(draft.nutrition.budget)} onChange={(event) => updateSection('nutrition', { ...draft.nutrition, budget: (event.target.value || null) as OnboardingDraft['nutrition']['budget'] })}><option value="">انتخاب کن</option><option value="economy">اقتصادی</option><option value="balanced">متعادل</option><option value="flexible">انعطاف‌پذیر</option></select></label>
      <label>مهارت آشپزی<select value={nullableSelectValue(draft.nutrition.cookingAbility)} onChange={(event) => updateSection('nutrition', { ...draft.nutrition, cookingAbility: (event.target.value || null) as OnboardingDraft['nutrition']['cookingAbility'] })}><option value="">انتخاب کن</option><option value="beginner">مبتدی</option><option value="intermediate">متوسط</option><option value="advanced">حرفه‌ای</option></select></label>
      <label>دفعات غذای بیرون<select value={nullableSelectValue(draft.nutrition.eatingOutFrequency)} onChange={(event) => updateSection('nutrition', { ...draft.nutrition, eatingOutFrequency: (event.target.value || null) as OnboardingDraft['nutrition']['eatingOutFrequency'] })}><option value="">انتخاب کن</option><option value="rare">به ندرت</option><option value="weekly">هفتگی</option><option value="frequent">زیاد</option></select></label>
    </div>
    <fieldset><legend>به آشپزخانه دسترسی داری؟</legend><BooleanChoice value={draft.nutrition.kitchenAccess} onChange={(kitchenAccess) => updateSection('nutrition', { ...draft.nutrition, kitchenAccess })} /></fieldset>
    <label>حساسیت‌ها یا آلرژی‌ها <small className="onboarding-optional">اختیاری</small><ListEditor values={draft.nutrition.allergies} onChange={(allergies) => updateSection('nutrition', { ...draft.nutrition, allergies })} placeholder="مثلاً بادام زمینی" /></label>
    <label>غذاهای نامطلوب <small className="onboarding-optional">اختیاری</small><ListEditor values={draft.nutrition.dislikedFoods} onChange={(dislikedFoods) => updateSection('nutrition', { ...draft.nutrition, dislikedFoods })} placeholder="غذایی که دوست نداری" /></label>
    <label>غذاهای ایرانی محبوب <small className="onboarding-optional">اختیاری</small><ListEditor values={draft.nutrition.favoriteIranianFoods} onChange={(favoriteIranianFoods) => updateSection('nutrition', { ...draft.nutrition, favoriteIranianFoods })} placeholder="مثلاً قورمه‌سبزی" /></label>
    <label>یادداشت <small className="onboarding-optional">اختیاری</small><textarea maxLength={2000} value={draft.nutrition.notes} onChange={(event) => updateSection('nutrition', { ...draft.nutrition, notes: event.target.value })} /></label>
  </>;

  if (step === 9) return <>
    <header className="onboarding-step-title"><span>سابقه تمرین</span><h1>از چه نقطه‌ای شروع می‌کنی؟</h1><p>سطح فعلی را خودت گزارش کن؛ Planner بعداً باید با همین سابقه محافظه‌کارانه شروع کند.</p></header>
    <ChoiceGrid value={draft.trainingHistory.level} onChange={(level) => updateSection('trainingHistory', { ...draft.trainingHistory, level })} options={[{ value: 'beginner', label: 'مبتدی' }, { value: 'intermediate', label: 'متوسط' }, { value: 'advanced', label: 'پیشرفته' }]} />
    <div className="onboarding-grid onboarding-grid--2"><NumberField label="سابقه تمرین منظم" value={draft.trainingHistory.trainingAgeMonths} min={0} max={1200} suffix="ماه" onChange={(trainingAgeMonths) => updateSection('trainingHistory', { ...draft.trainingHistory, trainingAgeMonths })} /><NumberField label="وقفه اخیر" value={draft.trainingHistory.recentBreakWeeks} min={0} max={520} suffix="هفته" onChange={(recentBreakWeeks) => updateSection('trainingHistory', { ...draft.trainingHistory, recentBreakWeeks })} /></div>
    <label>ورزش‌های قبلی <small className="onboarding-optional">اختیاری</small><ListEditor values={draft.trainingHistory.previousSports} onChange={(previousSports) => updateSection('trainingHistory', { ...draft.trainingHistory, previousSports })} placeholder="مثلاً فوتبال" /></label>
    <label>حرکت‌های آشنا <small className="onboarding-optional">اختیاری</small><ListEditor values={draft.trainingHistory.familiarMovements} onChange={(familiarMovements) => updateSection('trainingHistory', { ...draft.trainingHistory, familiarMovements })} placeholder="مثلاً اسکوات" /></label>
    <div className="onboarding-grid onboarding-grid--2"><label>تجربه هوازی<select value={nullableSelectValue(draft.trainingHistory.cardioExperience)} onChange={(event) => updateSection('trainingHistory', { ...draft.trainingHistory, cardioExperience: (event.target.value || null) as OnboardingDraft['trainingHistory']['cardioExperience'] })}><option value="">انتخاب کن</option><option value="none">ندارم</option><option value="basic">مقدماتی</option><option value="regular">منظم</option></select></label><label>تجربه قدرتی<select value={nullableSelectValue(draft.trainingHistory.strengthExperience)} onChange={(event) => updateSection('trainingHistory', { ...draft.trainingHistory, strengthExperience: (event.target.value || null) as OnboardingDraft['trainingHistory']['strengthExperience'] })}><option value="">انتخاب کن</option><option value="none">ندارم</option><option value="basic">مقدماتی</option><option value="regular">منظم</option></select></label></div>
  </>;

  if (step === 10) {
    const toggleEquipment = (equipment: EquipmentId) => {
      const next = equipment === 'bodyweight'
        ? (draft.availability.equipment.includes('bodyweight') ? [] : ['bodyweight'] as EquipmentId[])
        : toggleValue(draft.availability.equipment.filter((item) => item !== 'bodyweight'), equipment);
      updateSection('availability', { ...draft.availability, equipment: next });
    };
    return <>
      <header className="onboarding-step-title"><span>زمان و تجهیزات</span><h1>برنامه باید در زندگی واقعی جا شود</h1><p>ظرفیت و ابزار واقعی را ثبت کن تا Planner حرکت غیرقابل اجرا پیشنهاد ندهد.</p></header>
      <ChoiceGrid value={draft.availability.location} onChange={(location) => updateSection('availability', { ...draft.availability, location })} options={[{ value: 'home', label: 'خانه' }, { value: 'gym', label: 'باشگاه' }, { value: 'both', label: 'هر دو' }]} />
      <div className="onboarding-grid onboarding-grid--2"><NumberField label="روز تمرین در هفته" value={draft.availability.daysPerWeek} min={1} max={6} onChange={(daysPerWeek) => updateSection('availability', { ...draft.availability, daysPerWeek })} /><label>مدت هر جلسه<select value={draft.availability.sessionDuration ?? ''} onChange={(event) => updateSection('availability', { ...draft.availability, sessionDuration: event.target.value ? Number(event.target.value) as OnboardingDraft['availability']['sessionDuration'] : null })}><option value="">انتخاب کن</option>{[30,45,60,75,90].map((minute) => <option key={minute} value={minute}>{minute.toLocaleString('fa-IR')} دقیقه</option>)}</select></label></div>
      <fieldset><legend>روزهای ترجیحی <small className="onboarding-optional">اختیاری</small></legend><div className="onboarding-chip-grid">{weekdayOptions.map((day) => <button type="button" key={day.value} className={draft.availability.preferredDays.includes(day.value) ? 'is-selected' : ''} aria-pressed={draft.availability.preferredDays.includes(day.value)} onClick={() => updateSection('availability', { ...draft.availability, preferredDays: toggleValue(draft.availability.preferredDays, day.value) })}>{day.label}</button>)}</div></fieldset>
      <fieldset><legend>تجهیزات در دسترس</legend><div className="onboarding-chip-grid onboarding-chip-grid--equipment">{equipmentOptions.map((item) => <button type="button" key={item.value} className={draft.availability.equipment.includes(item.value) ? 'is-selected' : ''} aria-pressed={draft.availability.equipment.includes(item.value)} onClick={() => toggleEquipment(item.value)}><strong>{item.label}</strong>{item.description ? <small>{item.description}</small> : null}</button>)}</div></fieldset>
      <label>تجهیزات دیگر <small className="onboarding-optional">اختیاری</small><input maxLength={700} value={draft.availability.customEquipment} onChange={(event) => updateSection('availability', { ...draft.availability, customEquipment: event.target.value })} /></label>
      <label>زمان ترجیحی<select value={nullableSelectValue(draft.availability.preferredTime)} onChange={(event) => updateSection('availability', { ...draft.availability, preferredTime: (event.target.value || null) as OnboardingDraft['availability']['preferredTime'] })}><option value="">انتخاب کن</option><option value="morning">صبح</option><option value="afternoon">بعدازظهر</option><option value="evening">عصر/شب</option><option value="flexible">انعطاف‌پذیر</option></select></label>
      <label>محدودیت زمانی یا شیفت کاری <small className="onboarding-optional">اختیاری</small><textarea maxLength={2000} value={draft.availability.scheduleNotes} onChange={(event) => updateSection('availability', { ...draft.availability, scheduleNotes: event.target.value })} placeholder="مثلاً هفته‌های شیفت شب یا روزهایی که فقط ۳۰ دقیقه فرصت دارم" /></label>
    </>;
  }

  if (step === 11) return <>
    <header className="onboarding-step-title"><span>ترجیحات</span><h1>NeoFit چطور با تو کار کند؟</h1><p>این‌ها preference هستند؛ ایمنی و داده واقعی همیشه اولویت بالاتری دارند.</p></header>
    <PreferenceGroup title="سبک تمرین" description="احساس کلی و ساختار تمرین را مشخص کن.">
      <label>شدت تمرین<select value={nullableSelectValue(draft.preferences.intensity)} onChange={(event) => updateSection('preferences', { ...draft.preferences, intensity: (event.target.value || null) as OnboardingDraft['preferences']['intensity'] })}><option value="">انتخاب کن</option><option value="gentle">ملایم</option><option value="moderate">متوسط</option><option value="challenging">چالش‌برانگیز</option></select></label>
      <label>میزان هوازی<select value={nullableSelectValue(draft.preferences.cardioPreference)} onChange={(event) => updateSection('preferences', { ...draft.preferences, cardioPreference: (event.target.value || null) as OnboardingDraft['preferences']['cardioPreference'] })}><option value="">انتخاب کن</option><option value="low">کم</option><option value="balanced">متعادل</option><option value="high">زیاد</option></select></label>
      <label>نوع تمرین<select value={nullableSelectValue(draft.preferences.trainingStyle)} onChange={(event) => updateSection('preferences', { ...draft.preferences, trainingStyle: (event.target.value || null) as OnboardingDraft['preferences']['trainingStyle'] })}><option value="">انتخاب کن</option><option value="resistance">مقاومتی</option><option value="functional">عملکردی</option><option value="mixed">ترکیبی</option></select></label>
      <label>تنوع برنامه<select value={nullableSelectValue(draft.preferences.variety)} onChange={(event) => updateSection('preferences', { ...draft.preferences, variety: (event.target.value || null) as OnboardingDraft['preferences']['variety'] })}><option value="">انتخاب کن</option><option value="stable">ثابت‌تر</option><option value="balanced">متعادل</option><option value="varied">متنوع</option></select></label>
    </PreferenceGroup>
    <PreferenceGroup title="تغذیه و Coach" description="میزان ساختار و لحن همراهی را مشخص کن.">
      <label>ساختار تغذیه<select value={nullableSelectValue(draft.preferences.nutritionStrictness)} onChange={(event) => updateSection('preferences', { ...draft.preferences, nutritionStrictness: (event.target.value || null) as OnboardingDraft['preferences']['nutritionStrictness'] })}><option value="">انتخاب کن</option><option value="flexible">انعطاف‌پذیر</option><option value="structured">ساختاریافته</option><option value="strict">دقیق‌تر</option></select></label>
      <label>لحن Coach<select value={nullableSelectValue(draft.preferences.coachingTone)} onChange={(event) => updateSection('preferences', { ...draft.preferences, coachingTone: (event.target.value || null) as OnboardingDraft['preferences']['coachingTone'] })}><option value="">انتخاب کن</option><option value="supportive">حمایتی</option><option value="direct">مستقیم</option><option value="analytical">تحلیلی</option></select></label>
    </PreferenceGroup>
    <p className="onboarding-unset-note">تنظیم یادآوری‌ها را الان نمی‌پرسیم؛ تا وقتی delivery واقعی ساخته نشده، این تصمیم به زمان استفاده موکول می‌شود.</p>
  </>;

  if (step === 12) return <>
    <header className="onboarding-step-title"><span>مرور و ایمنی</span><h1>قبل از ساخت دوره، همه چیز را یک‌جا ببین</h1><p>هر بخش را مستقیم ویرایش کن. جمع‌بندی ایمنی همین‌جا انجام می‌شود تا دو صفحه عبوری اضافه نداشته باشیم.</p></header>
    <div className="onboarding-review-grid">
      <ReviewCard title="هدف" editHref="/onboarding/goal"><p>{draft.goal.primaryGoal ? goalLabels[draft.goal.primaryGoal] : 'ثبت نشده'}</p><p>{draft.goal.targetTimeline ?? 'سرعت انتخاب نشده'}</p></ReviewCard>
      <ReviewCard title="مشخصات" editHref="/onboarding/basics"><p>{draft.basics.name || 'نام ثبت نشده'}</p><p>{draft.basics.weightKg === null ? 'وزن ثبت نشده' : `${draft.basics.weightKg.toLocaleString('fa-IR')} kg`}</p></ReviewCard>
      <ReviewCard title="ایمنی و آسیب" editHref="/onboarding/injuries"><p>{draft.medical.conditions.length.toLocaleString('fa-IR')} مورد پزشکی متنی</p><p>{draft.injuries.areas.length.toLocaleString('fa-IR')} ناحیه Body Map</p></ReviewCard>
      <ReviewCard title="سبک زندگی" editHref="/onboarding/lifestyle"><p>{draft.lifestyle.activityLevel ?? 'فعالیت ثبت نشده'}</p><p>{draft.lifestyle.sleepHours === null ? 'خواب ثبت نشده' : `${draft.lifestyle.sleepHours.toLocaleString('fa-IR')} ساعت خواب`}</p></ReviewCard>
      <ReviewCard title="تغذیه" editHref="/onboarding/nutrition"><p>{draft.nutrition.dietType ?? 'الگوی غذایی ثبت نشده'}</p><p>{draft.nutrition.allergies.length.toLocaleString('fa-IR')} حساسیت ثبت‌شده</p></ReviewCard>
      <ReviewCard title="تمرین و زمان" editHref="/onboarding/availability"><p>{draft.availability.daysPerWeek === null ? 'روز تمرین ثبت نشده' : `${draft.availability.daysPerWeek.toLocaleString('fa-IR')} روز در هفته`}</p><p>{draft.availability.sessionDuration === null ? 'مدت جلسه ثبت نشده' : `${draft.availability.sessionDuration.toLocaleString('fa-IR')} دقیقه`}</p></ReviewCard>
    </div>
    <div className="onboarding-analysis-card"><h3>قواعد ایمنی فعال</h3><ul>{preview.healthCautions.map((item) => <li key={item}>{item}</li>)}</ul></div>
    <div className="onboarding-plan-preview"><div><span>روز تمرین</span><strong>{preview.trainingDays === null ? '—' : preview.trainingDays.toLocaleString('fa-IR')}</strong></div><div><span>مدت جلسه</span><strong>{preview.sessionMinutes === null ? '—' : `${preview.sessionMinutes.toLocaleString('fa-IR')} دقیقه`}</strong></div></div>
    <div className="onboarding-boundary-note"><strong>Nutrition Core</strong><p>{NUTRITION_AUTHORITY_NOTE}</p></div>
  </>;

  return <>
    <header className="onboarding-step-title"><span>دوره</span><h1>بازه دوره را مشخص کن</h1><p>فقط تاریخ، مدت و رضایت ساخت دوره ثبت می‌شود؛ هنوز هیچ برنامه‌ای را ساخته‌شده وانمود نمی‌کنیم.</p></header>
    <div className="onboarding-grid onboarding-grid--2">
      <label>تاریخ شروع<input type="date" min={localToday()} value={draft.confirmation.startDate} onChange={(event) => updateSection('confirmation', { ...draft.confirmation, startDate: event.target.value })} /></label>
      <NumberField label="مدت دوره" value={draft.confirmation.programDurationDays} min={PROGRAM_DURATION_MIN_DAYS} max={PROGRAM_DURATION_MAX_DAYS} suffix="روز" onChange={(programDurationDays) => updateSection('confirmation', { ...draft.confirmation, programDurationDays })} />
    </div>
    <p className="onboarding-unset-note">بازه فعلی {PROGRAM_DURATION_MIN_DAYS.toLocaleString('fa-IR')} تا {PROGRAM_DURATION_MAX_DAYS.toLocaleString('fa-IR')} روز است.</p>
    <ToggleRow checked={draft.confirmation.finalConsent} onChange={(finalConsent) => updateSection('confirmation', { ...draft.confirmation, finalConsent })} title="اطلاعات را مرور کرده‌ام و اجازه می‌دهم NeoFit برای این دوره برنامه تمرین و تغذیه هماهنگ بسازد" />
  </>;
}

export function OnboardingScreen({ stepSlug }: { stepSlug: OnboardingStepSlug }) {
  const router = useRouter();
  const { draft, mode, saving, message, updateSection, saveStep, complete } = useOnboarding();
  const [errors, setErrors] = useState<string[]>([]);
  const [actionError, setActionError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const errorsRef = useRef<HTMLDivElement>(null);
  const step = getOnboardingStep(stepSlug)!;
  const progress = Math.round((step.number / onboardingSteps.length) * 100);
  const handleGoogleReadyChange = useCallback((ready: boolean) => setGoogleReady(ready), []);

  useEffect(() => {
    if (!errors.length) return;
    errorsRef.current?.focus();
    errorsRef.current?.scrollIntoView({ block: 'center' });
  }, [errors]);

  const next = async () => {
    const validation = validateOnboardingStep(draft, step.number);
    if (step.number === 1 && mode === 'account' && !googleReady) validation.unshift('ابتدا کلید Google AI Studio معتبر را متصل کن.');
    if (step.number === ONBOARDING_TOTAL_STEPS && draft.confirmation.startDate && draft.confirmation.startDate < localToday()) {
      validation.unshift('تاریخ شروع نمی‌تواند قبل از امروز باشد.');
    }
    setErrors(validation);
    setActionError('');
    if (validation.length) return;
    try {
      if (step.number === ONBOARDING_TOTAL_STEPS) {
        await complete();
        router.push('/onboarding/ready');
        return;
      }
      await saveStep(step.number);
      router.push(`/onboarding/${getNextOnboardingStep(step.number).slug}`);
    } catch (error) {
      setActionError(error instanceof OnboardingConflictError
        ? 'اطلاعات در تب یا دستگاه دیگری تغییر کرده است. صفحه را تازه کن تا نسخه جدید از بین نرود.'
        : 'ذخیره این مرحله انجام نشد. داده فعلی روی صفحه باقی مانده و به مرحله بعد نرفتیم.');
    }
  };

  const previous = getPreviousOnboardingStep(step.number);
  const resume = onboardingSteps.find((item) => item.number === resumeStepNumber(draft)) ?? onboardingSteps[0];
  const modeLabel = mode === 'account' ? 'ذخیره در حساب' : mode === 'guest' ? 'Demo محلی' : mode === 'loading' ? 'در حال اتصال' : 'ذخیره متوقف';

  return <main className="onboarding-page" id="main-content">
    <section className="onboarding-shell">
      <header className="onboarding-shell__header"><div><a href="/" className="onboarding-logo">NeoFit</a><p title={message}>{message}</p></div><span className={`onboarding-mode onboarding-mode--${mode}`}>{modeLabel}</span></header>
      <div className="onboarding-progress" aria-label={`مرحله ${step.number} از ${ONBOARDING_TOTAL_STEPS}`}><div><span>مرحله {step.number.toLocaleString('fa-IR')} از {ONBOARDING_TOTAL_STEPS.toLocaleString('fa-IR')}</span><strong>{step.label}</strong></div><div className="onboarding-progress__track" role="progressbar" aria-valuemin={1} aria-valuemax={ONBOARDING_TOTAL_STEPS} aria-valuenow={step.number}><span style={{ width: `${progress}%` }} /></div></div>
      <div className="onboarding-content"><StepContent step={step.number} draft={draft} mode={mode} updateSection={updateSection} onGoogleReadyChange={handleGoogleReadyChange} />
        {step.number === 1 && draft.completedSteps.length ? <button type="button" className="onboarding-resume-button" onClick={() => router.push(`/onboarding/${resume.slug}`)}>ادامه از «{resume.label}»</button> : null}
        {errors.length ? <div ref={errorsRef} className="onboarding-errors" role="alert" tabIndex={-1}><strong>برای ادامه این موارد را کامل کن:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div> : null}
        {actionError ? <p className="onboarding-action-error" role="alert" tabIndex={-1}>{actionError}</p> : null}
      </div>
      <footer className="onboarding-actions">{step.number > 1 ? <button type="button" className="secondary" onClick={() => router.push(`/onboarding/${previous.slug}`)} disabled={saving}>قبل</button> : mode === 'guest' ? <a className="secondary" href="/today">خروج از Demo</a> : <span className="onboarding-actions__spacer" aria-hidden="true" />}<button type="button" className="primary" onClick={() => void next()} disabled={saving || mode === 'loading' || mode === 'error'}>{saving ? 'در حال ذخیره…' : step.number === ONBOARDING_TOTAL_STEPS ? 'تأیید و ثبت دوره' : 'ادامه'}</button></footer>
    </section>
  </main>;
}
