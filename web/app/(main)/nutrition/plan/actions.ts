'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { activeAuthSession } from '@/lib/auth/active-session';
import { NutritionPlanLogError, persistActiveNutritionPlanMeal } from '@/lib/supabase/nutrition-plan-persistence';
import { createClient } from '@/lib/supabase/server';

function value(formData: FormData, name: string, maxLength: number): string {
  return String(formData.get(name) ?? '').trim().slice(0, maxLength);
}

export async function logNutritionPlanMeal(formData: FormData): Promise<void> {
  const planId = value(formData, 'plan_id', 80);
  const mealId = value(formData, 'meal_id', 160);
  const localDate = value(formData, 'local_date', 10);
  const planVersion = Number.parseInt(value(formData, 'plan_version', 12), 10);

  const supabase = await createClient();
  const active = await activeAuthSession(supabase);
  if (!active) redirect('/auth?error=session');

  try {
    await persistActiveNutritionPlanMeal({
      supabase,
      userId: active.userId,
      planId,
      planVersion,
      mealId,
      localDate,
    });
  } catch (error) {
    const code = error instanceof NutritionPlanLogError ? error.code : 'write_failed';
    redirect(`/nutrition/plan?error=${encodeURIComponent(code)}`);
  }

  revalidatePath('/nutrition');
  revalidatePath('/nutrition/plan');
  revalidatePath('/today');
  redirect('/nutrition/plan?message=meal-logged');
}
