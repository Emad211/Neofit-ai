import { NutritionPlanScreen } from '@/components/nutrition-plan-screen';
import { loadNutritionPlanSnapshot } from '@/lib/supabase/nutrition-plan-data';

export const dynamic = 'force-dynamic';

export default async function NutritionPlanPage() {
  const snapshot = await loadNutritionPlanSnapshot();
  return <NutritionPlanScreen snapshot={snapshot} />;
}
