'use client';

import type { MealType } from '@neofit/nutrition-core';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { NeoFitIcon } from '@/components/neofit-icons';
import { useNutritionState } from '@/components/nutrition-state';
import { foodFixtures, type FoodFixture } from '@/data/fixtures';
import { estimateWebFood, filterWebFoods } from '@/lib/nutrition-adapter';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
type CategoryFilter = 'all' | FoodFixture['category'];

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

const categoryFilters: readonly { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'همه' },
  { id: 'stew', label: 'خورش' },
  { id: 'rice', label: 'برنج' },
  { id: 'kebab', label: 'کباب' },
  { id: 'soup', label: 'آش و سوپ' },
  { id: 'breakfast', label: 'صبحانه' },
  { id: 'bread', label: 'نان' },
  { id: 'dairy_beverage', label: 'لبنیات' },
  { id: 'street_food', label: 'غذای آماده' },
];

const mealOptions: readonly { id: MealType; label: string }[] = [
  { id: 'breakfast', label: 'صبحانه' },
  { id: 'lunch', label: 'ناهار' },
  { id: 'dinner', label: 'شام' },
  { id: 'snack', label: 'میان‌وعده' },
];

function FoodResult({ food, onSelect }: { food: FoodFixture; onSelect: (food: FoodFixture) => void }) {
  const estimate = estimateWebFood(food, 1);
  return (
    <button className="food-result" onClick={() => onSelect(food)} type="button">
      <span className={`food-result__mark food-result__mark--${food.category}`} aria-hidden="true">{food.nameFa.slice(0, 1)}</span>
      <span className="food-result__main">
        <span className="food-result__title">{food.nameFa}</span>
        <span className="food-result__meta">{food.portionLabelFa} · {categoryLabels[food.category]}</span>
        <span className="food-result__evidence"><NeoFitIcon name="check" size={14} />{food.evidenceLabel}</span>
      </span>
      <span className="food-result__energy"><b>{faNumber.format(estimate.macros.calories)}</b><small>کیلوکالری</small></span>
    </button>
  );
}

export function NutritionScreen() {
  const router = useRouter();
  const { addFood, account } = useNutritionState();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [selectedFood, setSelectedFood] = useState<FoodFixture | null>(null);
  const [portionCount, setPortionCount] = useState(1);
  const [mealType, setMealType] = useState<MealType>('lunch');
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const filteredFoods = useMemo(() => {
    const byText = filterWebFoods(foodFixtures, query);
    return category === 'all' ? byText : byText.filter((food) => food.category === category);
  }, [category, query]);
  const selectedEstimate = useMemo(
    () => selectedFood ? estimateWebFood(selectedFood, portionCount) : null,
    [portionCount, selectedFood],
  );

  useEffect(() => {
    if (!selectedFood) return;
    closeButtonRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !saving) {
        event.preventDefault();
        setSelectedFood(null);
        window.requestAnimationFrame(() => openerRef.current?.focus());
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [saving, selectedFood]);

  function chooseFood(food: FoodFixture) {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedFood(food);
    setPortionCount(1);
    setSubmitError('');
  }

  function closeSheet() {
    if (saving) return;
    setSelectedFood(null);
    window.requestAnimationFrame(() => openerRef.current?.focus());
  }

  function resetSearch() {
    setQuery('');
    setCategory('all');
  }

  async function confirmFood() {
    if (!selectedFood || saving) return;
    setSaving(true);
    setSubmitError('');
    try {
      await addFood(selectedFood, portionCount, mealType);
      setSelectedFood(null);
      router.push('/today');
      router.refresh();
    } catch {
      setSubmitError('ثبت غذا انجام نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.');
    } finally {
      setSaving(false);
    }
  }

  const categoryLabel = category === 'all' ? null : categoryLabels[category];
  const summaryLabel = query && categoryLabel
    ? `«${query}» در ${categoryLabel}`
    : query
      ? `نتیجه برای «${query}»`
      : categoryLabel
        ? `دستهٔ ${categoryLabel}`
        : 'همه غذاها';

  return (
    <>
      <section className="page-stack" aria-labelledby="nutrition-heading">
        <div className="section-heading">
          <div><p className="section-kicker">ثبت غذا</p><h2 id="nutrition-heading">چه چیزی خوردی؟</h2></div>
          <Link className="text-button" href="/nutrition/plan">برنامهٔ هفته</Link>
        </div>

        <label className="search-box">
          <span className="sr-only">جست‌وجوی غذا</span>
          <NeoFitIcon name="search" />
          <input autoComplete="off" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="مثلاً قورمه‌سبزی یا جوجه کباب" />
          {query ? <button type="button" onClick={() => setQuery('')} aria-label="پاک‌کردن جست‌وجو">×</button> : <span />}
        </label>

        <div className="filter-row" aria-label="دسته‌بندی غذاها">
          {categoryFilters.map((filter) => (
            <button className={category === filter.id ? 'filter-chip is-active' : 'filter-chip'} type="button" key={filter.id} aria-pressed={category === filter.id} onClick={() => setCategory(filter.id)}>{filter.label}</button>
          ))}
        </div>

        <div className="results-summary" aria-live="polite"><span>{summaryLabel}</span><b>{faNumber.format(filteredFoods.length)} مورد</b></div>

        <div className="food-results">
          {filteredFoods.length ? filteredFoods.map((food) => <FoodResult key={food.id} food={food} onSelect={chooseFood} />) : (
            <div className="empty-state">
              <span className="empty-state__icon"><NeoFitIcon name="search" size={30} /></span>
              <h3>غذایی پیدا نشد</h3>
              <p>جست‌وجو یا دسته‌بندی را تغییر بده.</p>
              <button type="button" className="secondary-button" onClick={resetSearch}>نمایش همهٔ غذاها</button>
            </div>
          )}
        </div>
      </section>

      {selectedFood && selectedEstimate ? (
        <div className="sheet-layer" role="presentation" onMouseDown={closeSheet}>
          <section className="meal-sheet" role="dialog" aria-modal="true" aria-labelledby="meal-sheet-title" aria-describedby="meal-sheet-evidence" onMouseDown={(event) => event.stopPropagation()}>
            <span className="sheet-handle" />
            <header className="meal-sheet__header">
              <div><span>{categoryLabels[selectedFood.category]}</span><h2 id="meal-sheet-title">{selectedFood.nameFa}</h2><p>{selectedFood.portionLabelFa}</p></div>
              <button ref={closeButtonRef} type="button" aria-label="بستن" disabled={saving} onClick={closeSheet}>×</button>
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
                <button type="button" aria-label="کم‌کردن سهم" disabled={saving} onClick={() => setPortionCount((value) => Math.max(0.5, value - 0.5))}>−</button>
                <strong>{faNumber.format(portionCount)}</strong>
                <button type="button" aria-label="افزایش سهم" disabled={saving} onClick={() => setPortionCount((value) => Math.min(10, value + 0.5))}>+</button>
              </div>
            </div>

            <div className="sheet-field">
              <label>نوع وعده</label>
              <div className="meal-type-row">
                {mealOptions.map((option) => (
                  <button type="button" key={option.id} disabled={saving} className={mealType === option.id ? 'is-active' : ''} aria-pressed={mealType === option.id} onClick={() => setMealType(option.id)}>{option.label}</button>
                ))}
              </div>
            </div>

            <p id="meal-sheet-evidence" className="evidence-note"><NeoFitIcon name="check" size={16} />مقادیر هر سهم از اطلاعات تغذیه‌ای همین غذا محاسبه شده‌اند.</p>
            <p className="sync-destination-note">{account ? 'این وعده در حسابت ذخیره می‌شود.' : 'این وعده فقط روی همین دستگاه ذخیره می‌شود.'}</p>
            {submitError ? <p className="meal-submit-error" role="alert">{submitError}</p> : null}
            <button className="primary-button" type="button" disabled={saving} onClick={confirmFood}>{saving ? 'در حال ذخیره...' : 'ثبت این غذا'}</button>
          </section>
        </div>
      ) : null}
    </>
  );
}
