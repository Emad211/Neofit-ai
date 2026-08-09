'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { logNutritionPlanMeal } from '@/app/(main)/nutrition/plan/actions';
import { localDateKey } from '@/lib/local-date';

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button className="text-button" type="submit" disabled={pending}>{pending ? 'در حال ثبت…' : 'ثبت برای امروز'}</button>;
}

export function NutritionPlanLogForm({
  planId,
  planVersion,
  mealId,
}: {
  readonly planId: string;
  readonly planVersion: number;
  readonly mealId: string;
}) {
  const [localDate] = useState(() => localDateKey(new Date()));
  return (
    <form action={logNutritionPlanMeal}>
      <input type="hidden" name="plan_id" value={planId} />
      <input type="hidden" name="plan_version" value={planVersion} />
      <input type="hidden" name="meal_id" value={mealId} />
      <input type="hidden" name="local_date" value={localDate} />
      <SubmitButton />
    </form>
  );
}
