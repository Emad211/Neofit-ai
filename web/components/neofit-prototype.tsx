'use client';

import type { MealType } from '@neofit/nutrition-core';
import { useEffect, useMemo, useState } from 'react';
import {
  dailyTargets,
  foodFixtures,
  initialDiary,
  weeklyPlan,
  type FoodFixture,
} from '@/data/fixtures';
import {
  buildInitialWebDiary,
  createWebDiaryEntry,
  estimateWebFood,
  filterWebFoods,
  summarizeWebDiary,
  type WebDiaryEntry,
} from '@/lib/nutrition-adapter';

type MainTab = 'today' | 'nutrition' | 'workout' | 'progress' | 'settings';
type Screen = MainTab | 'plan';

type IconName =
  | 'home'
  | 'food'
  | 'workout'
  | 'chart'
  | 'settings'
  | 'plus'
  | 'search'
  | 'chevron'
  | 'sparkle'
  | 'cloud-off'
  | 'check';

const WEB_LOCAL_DATE = '2026-08-03';
const WEB_INITIAL_TIMESTAMP = '2026-08-03T08:00:00.000Z';
const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });

const categoryLabels: Readonly<Record<FoodFixture['category'], string>> = {
  stew: 'خورش',
  rice: 'برنج',
  kebab: 'کباب',
  soup: 'آش و سوپ',
  breakfast: 'صبحانه',
  bread: 'نان',
  dairy_beverage: 'لبنیات و نوشیدنی',
  street_food: 'غذای آماده',
};

const mealOptions: readonly { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'صبحانه' },
  { id: 'lunch', label: 'ناهار' },
  { id: 'dinner', label: 'شام' },
  { id: 'snack', label: 'میان‌وعده' },
];

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };

  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></>,
    food: <><path d="M7 3v8" /><path d="M4 3v5c0 2 1 3 3 3s3-1 3-3V3" /><path d="M7 11v10" /><path d="M16 3v18" /><path d="M16 3c3 2 4 5 4 8h-4" /></>,
    workout: <><path d="M6 7v10" /><path d="M18 7v10" /><path d="M3 10v4" /><path d="M21 10v4" /><path d="M6 12h12" /></>,
    chart: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M22 20V7" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21h-4v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3.1 14H3v-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5V3h4v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1v4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    sparkle: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" /></>,
    'cloud-off': <><path d="m3 3 18 18" /><path d="M10.6 5.1A7 7 0 0 1 19 12.2 4.5 4.5 0 0 1 18.5 21H8a5 5 0 0 1-3.5-8.5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
  };

  return <svg {...common}>{paths[name]}</svg>;
}

function MacroBar({ label, value, target, unit = 'گرم' }: { label: string; value: number; target: number; unit?: string }) {
  const ratio = Math.min(1, value / target);
  return (
    <div className="macro-row">
      <div className="macro-row__copy">
        <span>{label}</span>
        <b><span dir="ltr">{faNumber.format(value)} / {faNumber.format(target)}</span> {unit}</b>
      </div>
      <div className="macro-row__track" aria-label={`${label}: ${value} از ${target}`}>
        <span style={{ inlineSize: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

function FoodResult({ food, onSelect }: { food: FoodFixture; onSelect: (food: FoodFixture) => void }) {
  const baseEstimate = estimateWebFood(food, 1);
  return (
    <button className="food-result" onClick={() => onSelect(food)} type="button">
      <span className={`food-result__mark food-result__mark--${food.category}`} aria-hidden="true">
        {food.nameFa.slice(0, 1)}
      </span>
      <span className="food-result__main">
        <span className="food-result__title">{food.nameFa}</span>
        <span className="food-result__meta">{food.portionLabelFa} · {categoryLabels[food.category]}</span>
        <span className="food-result__evidence"><Icon name="check" size={14} />{food.evidenceLabel}</span>
      </span>
      <span className="food-result__energy">
        <b>{faNumber.format(baseEstimate.macros.calories)}</b>
        <small>کیلوکالری</small>
      </span>
    </button>
  );
}

function BottomNavigation({ active, onChange }: { active: MainTab; onChange: (tab: MainTab) => void }) {
  const items: readonly { id: MainTab; label: string; icon: IconName }[] = [
    { id: 'today', label: 'امروز', icon: 'home' },
    { id: 'nutrition', label: 'تغذیه', icon: 'food' },
    { id: 'workout', label: 'تمرین', icon: 'workout' },
    { id: 'progress', label: 'پیشرفت', icon: 'chart' },
    { id: 'settings', label: 'تنظیمات', icon: 'settings' },
  ];

  return (
    <nav className="bottom-nav" aria-label="ناوبری اصلی">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={active === item.id ? 'bottom-nav__item is-active' : 'bottom-nav__item'}
          aria-current={active === item.id ? 'page' : undefined}
          onClick={() => onChange(item.id)}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

export function NeoFitPrototype() {
  const [screen, setScreen] = useState<Screen>('today');
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodFixture | null>(null);
  const [portionCount, setPortionCount] = useState(1);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [diary, setDiary] = useState<WebDiaryEntry[]>(() => buildInitialWebDiary({
    foods: foodFixtures,
    seeds: initialDiary,
    localDate: WEB_LOCAL_DATE,
    timestamp: WEB_INITIAL_TIMESTAMP,
  }));
  const [language, setLanguage] = useState<'fa' | 'en'>('fa');
  const [theme, setTheme] = useState<'light' | 'system'>('light');

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [screen]);

  const filteredFoods = useMemo(
    () => filterWebFoods(foodFixtures, query),
    [query],
  );
  const summary = useMemo(
    () => summarizeWebDiary(diary, WEB_LOCAL_DATE, dailyTargets),
    [diary],
  );
  const selectedEstimate = useMemo(
    () => selectedFood ? estimateWebFood(selectedFood, portionCount) : null,
    [portionCount, selectedFood],
  );

  const activeTab: MainTab = screen === 'plan' ? 'nutrition' : screen;

  function openFoodPicker() {
    setQuery('');
    setScreen('nutrition');
  }

  function chooseFood(food: FoodFixture) {
    setSelectedFood(food);
    setPortionCount(1);
  }

  function addSelectedFood() {
    if (!selectedFood) return;
    const timestamp = new Date().toISOString();
    const nextEntry = createWebDiaryEntry({
      id: `${selectedFood.id}-${Date.now()}`,
      label: selectedFood.nameFa,
      mealType,
      portionText: `${faNumber.format(portionCount)} سهم · ${selectedFood.portionLabelFa}`,
      items: [{ foodId: selectedFood.id, portionCount }],
      foods: foodFixtures,
      localDate: WEB_LOCAL_DATE,
      timestamp,
    });
    setDiary((items) => [...items, nextEntry]);
    setSelectedFood(null);
    setScreen('today');
  }

  return (
    <main className="app-frame">
      <div className="app-frame__halo" aria-hidden="true" />
      <header className="topbar">
        <div>
          <p className="eyebrow">NeoFit</p>
          <h1>{screen === 'today' ? 'سلام عماد، روزت چطوره؟' : screen === 'plan' ? 'برنامهٔ این هفته' : 'نئوفیت'}</h1>
        </div>
        <button className="avatar-button" type="button" aria-label="پروفایل عماد">ع</button>
      </header>

      <div className="offline-note" role="status">
        <Icon name="cloud-off" size={17} />
        <span>نمونهٔ UX بدون Backend؛ داده‌ها فقط در همین صفحه نگه‌داری می‌شوند.</span>
      </div>

      <div className="screen-content">
        {screen === 'today' && (
          <section className="page-stack" aria-labelledby="today-heading">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="section-kicker">دوشنبه، ۱۲ مرداد</p>
                <h2 id="today-heading">خلاصهٔ امروز</h2>
              </div>
              <button type="button" className="text-button" onClick={() => setScreen('progress')}>جزئیات</button>
            </div>

            <article className="hero-card">
              <div
                className="calorie-ring"
                style={{ '--progress': `${summary.calorieProgressPercent * 3.6}deg` } as React.CSSProperties}
                aria-label={`${summary.calorieProgressPercent} درصد هدف کالری`}
              >
                <div className="calorie-ring__inner">
                  <strong>{faNumber.format(summary.remainingCalories)}</strong>
                  <span>باقی‌مانده</span>
                </div>
              </div>
              <div className="hero-card__copy">
                <span className="status-pill"><Icon name="sparkle" size={15} />در مسیر هدف</span>
                <h3>{faNumber.format(summary.macros.calories)} از {faNumber.format(summary.targets.calories)} کیلوکالری</h3>
                <p>ناهار ثبت شده؛ برای شام حدود {faNumber.format(summary.remainingCalories)} کیلوکالری فضا داری.</p>
              </div>
            </article>

            <div className="macro-panel">
              <MacroBar label="پروتئین" value={summary.macros.proteinG} target={summary.targets.proteinG} />
              <MacroBar label="کربوهیدرات" value={summary.macros.carbsG} target={summary.targets.carbsG} />
              <MacroBar label="چربی" value={summary.macros.fatG} target={summary.targets.fatG} />
            </div>

            <button className="primary-action" type="button" onClick={openFoodPicker}>
              <span className="primary-action__icon"><Icon name="plus" /></span>
              <span><b>ثبت غذا</b><small>جست‌وجو در کاتالوگ IFKB</small></span>
              <Icon name="chevron" />
            </button>

            <section className="timeline-section" aria-labelledby="diary-heading">
              <div className="section-heading">
                <div>
                  <p className="section-kicker">تایم‌لاین</p>
                  <h2 id="diary-heading">وعده‌های ثبت‌شده</h2>
                </div>
                <span className="count-badge">{faNumber.format(summary.entryCount)}</span>
              </div>
              <div className="meal-list">
                {diary.map((entry) => (
                  <article className="meal-row" key={entry.core.id}>
                    <span className="meal-row__dot" aria-hidden="true" />
                    <div className="meal-row__copy">
                      <span>{entry.mealLabelFa}</span>
                      <h3>{entry.core.label}</h3>
                      <p>{entry.portionText}</p>
                    </div>
                    <strong>{faNumber.format(entry.macros.calories)}<small> kcal</small></strong>
                  </article>
                ))}
              </div>
            </section>

            <button className="plan-preview" type="button" onClick={() => setScreen('plan')}>
              <div>
                <span className="section-kicker">برنامهٔ غذایی</span>
                <h2>نگاه سریع به فردا</h2>
                <p>تخم‌مرغ آب‌پز، چلوکباب کوبیده و آش رشته</p>
              </div>
              <span className="round-arrow"><Icon name="chevron" /></span>
            </button>
          </section>
        )}

        {screen === 'nutrition' && (
          <section className="page-stack" aria-labelledby="nutrition-heading">
            <div className="section-heading">
              <div>
                <p className="section-kicker">کاتالوگ تغذیه</p>
                <h2 id="nutrition-heading">چه چیزی خوردی؟</h2>
              </div>
              <button type="button" className="text-button" onClick={() => setScreen('plan')}>برنامهٔ هفته</button>
            </div>

            <label className="search-box">
              <span className="sr-only">جست‌وجوی غذا</span>
              <Icon name="search" />
              <input
                autoComplete="off"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="مثلاً قورمه‌سبزی یا جوجه کباب"
              />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="پاک‌کردن جست‌وجو">×</button>}
            </label>

            <div className="filter-row" aria-label="دسته‌بندی‌های غذا">
              <button className="filter-chip is-active" type="button">همه</button>
              <button className="filter-chip" type="button">اخیر</button>
              <button className="filter-chip" type="button">محبوب‌ها</button>
              <button className="filter-chip" type="button">ایرانی</button>
            </div>

            <div className="results-summary">
              <span>{query ? `نتیجه برای «${query}»` : 'پیشنهادهای سریع'}</span>
              <b>{faNumber.format(filteredFoods.length)} مورد</b>
            </div>

            <div className="food-results">
              {filteredFoods.length > 0 ? filteredFoods.map((food) => (
                <FoodResult key={food.id} food={food} onSelect={chooseFood} />
              )) : (
                <div className="empty-state">
                  <span className="empty-state__icon"><Icon name="search" size={30} /></span>
                  <h3>غذایی پیدا نشد</h3>
                  <p>نام ساده‌تر، املای دیگر یا یکی از دسته‌بندی‌ها را امتحان کن.</p>
                  <button type="button" className="secondary-button" onClick={() => setQuery('')}>پاک‌کردن جست‌وجو</button>
                </div>
              )}
            </div>
          </section>
        )}

        {screen === 'plan' && (
          <section className="page-stack" aria-labelledby="plan-heading">
            <button type="button" className="back-button" onClick={() => setScreen('nutrition')}>
              <Icon name="chevron" /> بازگشت به تغذیه
            </button>
            <div className="section-heading">
              <div>
                <p className="section-kicker">IFKB resolved</p>
                <h2 id="plan-heading">برنامهٔ سه روز آینده</h2>
              </div>
              <span className="status-pill status-pill--soft"><Icon name="check" size={15} />قابل ثبت</span>
            </div>
            <p className="page-intro">همهٔ مواد این نمونه به رکوردهای کاتالوگ متصل‌اند؛ عدد تغذیه‌ای از مدل دریافت نشده است.</p>
            <div className="week-list">
              {weeklyPlan.map((day, index) => (
                <article className={index === 0 ? 'day-card is-current' : 'day-card'} key={day.day}>
                  <div className="day-card__header">
                    <div><span>روز {faNumber.format(index + 1)}</span><h3>{day.day}</h3></div>
                    <b>{day.title}</b>
                  </div>
                  <ol>
                    {day.meals.map((meal) => <li key={meal}>{meal}<span><Icon name="check" size={14} />IFKB</span></li>)}
                  </ol>
                </article>
              ))}
            </div>
          </section>
        )}

        {screen === 'workout' && (
          <section className="page-stack placeholder-page" aria-labelledby="workout-heading">
            <span className="placeholder-page__icon"><Icon name="workout" size={34} /></span>
            <p className="section-kicker">Stage 1</p>
            <h2 id="workout-heading">تمرین امروز</h2>
            <p>در این Batch فقط جایگاه و سلسله‌مراتب صفحهٔ تمرین بررسی می‌شود. منطق برنامه در Batch بعدی اضافه خواهد شد.</p>
            <button type="button" className="secondary-button">مشاهدهٔ ساختار نمونه</button>
          </section>
        )}

        {screen === 'progress' && (
          <section className="page-stack" aria-labelledby="progress-heading">
            <div className="section-heading"><div><p className="section-kicker">روند هفتگی</p><h2 id="progress-heading">پیشرفت</h2></div></div>
            <article className="metric-card"><span>میانگین ثبت روزانه</span><strong>۱٬۸۴۰ <small>kcal</small></strong><p>این داده صرفاً Fixture رابط است و هنوز به حساب کاربر متصل نیست.</p></article>
            <div className="state-grid">
              <article><span className="skeleton-line" /><span className="skeleton-line is-short" /><b>Loading</b></article>
              <article><span className="state-dot state-dot--empty" /><b>Empty</b><small>هنوز داده‌ای نیست</small></article>
              <article><span className="state-dot state-dot--error" /><b>Error</b><small>تلاش دوباره</small></article>
              <article><span className="state-dot state-dot--offline" /><b>Offline</b><small>در صف همگام‌سازی</small></article>
            </div>
          </section>
        )}

        {screen === 'settings' && (
          <section className="page-stack" aria-labelledby="settings-heading">
            <div className="section-heading"><div><p className="section-kicker">شخصی‌سازی</p><h2 id="settings-heading">تنظیمات</h2></div></div>

            <section className="settings-group">
              <div className="settings-group__heading"><h3>زبان رابط</h3><p>فارسی زبان اصلی محصول است.</p></div>
              <div className="segmented-control">
                <button className={language === 'fa' ? 'is-active' : ''} type="button" onClick={() => setLanguage('fa')}>فارسی</button>
                <button className={language === 'en' ? 'is-active' : ''} type="button" onClick={() => setLanguage('en')}>English</button>
              </div>
            </section>

            <section className="settings-group">
              <div className="settings-group__heading"><h3>ظاهر</h3><p>نسخهٔ تیره بعد از تأیید Design tokenها تکمیل می‌شود.</p></div>
              <div className="segmented-control">
                <button className={theme === 'light' ? 'is-active' : ''} type="button" onClick={() => setTheme('light')}>روشن</button>
                <button className={theme === 'system' ? 'is-active' : ''} type="button" onClick={() => setTheme('system')}>سیستم</button>
              </div>
            </section>

            <section className="settings-group settings-group--key">
              <div className="settings-group__heading">
                <span className="settings-icon"><Icon name="sparkle" /></span>
                <div><h3>کلید شخصی AvalAI</h3><p>در محصول نهایی فقط به مسیر رمزنگاری‌شدهٔ سرور ارسال می‌شود.</p></div>
              </div>
              <label className="field-label" htmlFor="avalai-key">کلید API</label>
              <input id="avalai-key" className="text-field" type="password" placeholder="sk-••••••••••••" autoComplete="off" />
              <div className="key-status"><span><i />کلیدی ذخیره نشده</span><small>Mock Stage 1</small></div>
              <button className="primary-button" type="button" disabled>اتصال امن در Stage 6 فعال می‌شود</button>
            </section>
          </section>
        )}
      </div>

      <BottomNavigation active={activeTab} onChange={setScreen} />

      {selectedFood && selectedEstimate && (
        <div className="sheet-layer" role="presentation" onMouseDown={() => setSelectedFood(null)}>
          <section className="meal-sheet" role="dialog" aria-modal="true" aria-labelledby="meal-sheet-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="sheet-handle" aria-hidden="true" />
            <header className="meal-sheet__header">
              <div><span>{categoryLabels[selectedFood.category]}</span><h2 id="meal-sheet-title">{selectedFood.nameFa}</h2><p>{selectedFood.portionLabelFa}</p></div>
              <button type="button" onClick={() => setSelectedFood(null)} aria-label="بستن">×</button>
            </header>

            <div className="nutrition-strip">
              <div><b>{faNumber.format(selectedEstimate.macros.calories)}</b><span>کالری</span></div>
              <div><b>{faNumber.format(selectedEstimate.macros.proteinG)}</b><span>پروتئین</span></div>
              <div><b>{faNumber.format(selectedEstimate.macros.carbsG)}</b><span>کربوهیدرات</span></div>
              <div><b>{faNumber.format(selectedEstimate.macros.fatG)}</b><span>چربی</span></div>
            </div>

            <div className="sheet-field">
              <label>تعداد سهم</label>
              <div className="stepper">
                <button type="button" onClick={() => setPortionCount((value) => Math.max(0.5, value - 0.5))}>−</button>
                <strong>{faNumber.format(portionCount)}</strong>
                <button type="button" onClick={() => setPortionCount((value) => Math.min(4, value + 0.5))}>+</button>
              </div>
            </div>

            <div className="sheet-field">
              <label>وعده</label>
              <div className="meal-type-row">
                {mealOptions.map((meal) => (
                  <button className={mealType === meal.id ? 'is-active' : ''} type="button" key={meal.id} onClick={() => setMealType(meal.id)}>{meal.label}</button>
                ))}
              </div>
            </div>

            <div className="evidence-note"><Icon name="check" size={16} /><span>مقادیر از Fixture نسخه‌دار IFKB و Nutrition Core مشترک آمده‌اند؛ مدل AI در این عددها نقشی ندارد.</span></div>
            <button className="primary-button" type="button" onClick={addSelectedFood}>افزودن به امروز</button>
          </section>
        </div>
      )}
    </main>
  );
}
