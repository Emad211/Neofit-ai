'use client';

import type { MealType } from '@neofit/nutrition-core';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { NeoFitIcon } from '@/components/neofit-icons';
import { useNutritionState } from '@/components/nutrition-state';
import { foodFixtures, type FoodFixture } from '@/data/fixtures';
import { estimateWebFood, filterWebFoods } from '@/lib/nutrition-adapter';

const faNumber = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });

const categoryLabels: Readonly<Record<FoodFixture['category'], string>> = {
  stew: 'خورش',
  rice: 'برنج',
  kebab: 'کباب',
  soup: 'آش و سوپ',
  breakfast: 'صبحانه',
};

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
      <span className={`food-result__mark food-result__mark--${food.category}`} aria-hidden="true">
        {food.nameFa.slice(0, 1)}
      </span>
      <span className="food-result__main">
        <span className="food-result__title">{food.nameFa}</span>
        <span className="food-result__meta">{food.portionLabelFa} · {categoryLabels[food.category]}</span>
        <span className="food-result__evidence"><NeoFitIcon name="check" size={14} />{food.evidenceLabel}</span>
      </span>
      <span className="food-result__energy">
        <b>{faNumber.format(estimate.macros.calories)}</b>
        <small>کیلوکالری</small>
      </span>
    </button>
  );
}

export function NutritionScreen() {
  const router = useRouter();
  const { addFood } = useNutritionState();
  const [query, setQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodFixture | null>(null);
  const [portionCount, setPortionCount] = useState(1);
  const [mealType, setMealType] = useState<MealType>('lunch');

  const filteredFoods = useMemo(() => filterWebFoods(foodFixtures, query), [query]);
  const selectedEstimate = useMemo(
    () => selectedFood ? estimateWebFood(selectedFood, portionCount) : null,
    [portionCount, selectedFood],
  );

  function chooseFood(food: FoodFixture) {
    setSelectedFood(food);
    setPortionCount(1);
  }

  function confirmFood() {
    if (!selectedFood) return;
    addFood(selectedFood, portionCount, mealType);
    setSelectedFood(null);
    router.push('/today');
  }

  return (
    <>
      <section className="page-stack" aria-labelledby="nutrition-heading">
        <div className="section-heading">
          <div>
            <p className="section-kicker">کاتالوگ تغذیه</p>
            <h2 id="nutrition-heading">چه چیزی خوردی؟</h2>
          </div>
          <Link className="text-button" href="/nutrition/plan">برنامهٔ هفته</Link>
        </div>

        <label className="search-box">
          <span className="sr-only">جست‌وجوی غذا</span>
          <NeoFitIcon name="search" />
          <input
            autoComplete="off"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="مثلاً قورمه‌سبزی یا جوجه کباب"
          />
          {query ? <button type="button" onClick={() => setQuery('')} aria-label="پاک‌کردن جست‌وجو">×</button> : <span />}
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
          {filteredFoods.length ? filteredFoods.map((food) => (
            <FoodResult key={food.id} food={food} onSelect={chooseFood} />
          )) : (
            <div className="empty-state">
              <span className="empty-state__icon"><NeoFitIcon name="search" size={30} /></span>
              <h3>غذایی پیدا نشد</h3>
              <p>نام ساده‌تر یا املای دیگری را امتحان کن.</p>
              <button type="button" className="secondary-button" onClick={() => setQuery('')}>پاک‌کردن جست‌وجو</button>
            </div>
          )}
        </div>
      </section>

      {selectedFood && selectedEstimate ? (
        <div className="sheet-layer" role="presentation" onMouseDown={() => setSelectedFood(null)}>
          <section
            className="meal-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="meal-sheet-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <span className="sheet-handle" />
            <header className="meal-sheet__header">
              <div>
                <span>{categoryLabels[selectedFood.category]}</span>
                <h2 id="meal-sheet-title">{selectedFood.nameFa}</h2>
                <p>{selectedFood.portionLabelFa}</p>
              </div>
              <button type="button" aria-label="بستن" onClick={() => setSelectedFood(null)}>×</button>
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
                <button type="button" aria-label="کم‌کردن سهم" onClick={() => setPortionCount((value) => Math.max(0.5, value - 0.5))}>−</button>
                <strong>{faNumber.format(portionCount)}</strong>
                <button type="button" aria-label="افزایش سهم" onClick={() => setPortionCount((value) => Math.min(10, value + 0.5))}>+</button>
              </div>
            </div>

            <div className="sheet-field">
              <label>نوع وعده</label>
              <div className="meal-type-row">
                {mealOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    className={mealType === option.id ? 'is-active' : ''}
                    onClick={() => setMealType(option.id)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="evidence-note"><NeoFitIcon name="check" size={16} />مقدارها با قوانین قطعی Nutrition Core محاسبه شده‌اند.</p>
            <button className="primary-button" type="button" onClick={confirmFood}>ثبت این غذا</button>
          </section>
        </div>
      ) : null}
    </>
  );
}
