import { NutritionPlanScreen } from '@/components/nutrition-plan-screen';
import { loadNutritionPlanSnapshot } from '@/lib/supabase/nutrition-plan-data';

export const dynamic = 'force-dynamic';

export default async function NutritionPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const [snapshot, query] = await Promise.all([
    loadNutritionPlanSnapshot(),
    searchParams,
  ]);
  return (
    <NutritionPlanScreen
      snapshot={snapshot}
      message={typeof query.message === 'string' ? query.message : null}
      error={typeof query.error === 'string' ? query.error : null}
    />
  );
}
