import { NutritionStateProvider } from '@/components/nutrition-state';
import { TodayScreen } from '@/components/today-screen';
import { loadNutritionSnapshot } from '@/lib/supabase/account';

export default async function TodayPage() {
  const nutrition = await loadNutritionSnapshot();
  return (
    <NutritionStateProvider
      initialDiary={nutrition.diary}
      initialGoals={nutrition.goals}
      loadError={nutrition.loadError}
    >
      <TodayScreen />
    </NutritionStateProvider>
  );
}
