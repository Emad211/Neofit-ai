import { NutritionStateProvider } from '@/components/nutrition-state';
import { TodayScreen } from '@/components/today-screen';
import { loadNutritionSnapshot } from '@/lib/supabase/account';
import { loadWorkoutPlanSnapshot } from '@/lib/supabase/workout-plan-data';

export default async function TodayPage() {
  const [nutrition, workout] = await Promise.all([
    loadNutritionSnapshot(),
    loadWorkoutPlanSnapshot(),
  ]);

  return (
    <NutritionStateProvider
      initialDiary={nutrition.diary}
      initialGoals={nutrition.goals}
      loadError={nutrition.loadError}
    >
      <TodayScreen workout={workout} />
    </NutritionStateProvider>
  );
}
