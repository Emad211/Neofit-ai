import { NutritionStateProvider } from '@/components/nutrition-state';
import { TodayScreen } from '@/components/today-screen';
import { DEFAULT_NEOFIT_TIME_ZONE } from '@/lib/local-date';
import { loadAccountIdentity, loadNutritionSnapshot } from '@/lib/supabase/account';
import { loadWorkoutPlanSnapshot } from '@/lib/supabase/workout-plan-data';

export default async function TodayPage() {
  const [nutrition, workout, identity] = await Promise.all([
    loadNutritionSnapshot(),
    loadWorkoutPlanSnapshot(),
    loadAccountIdentity(),
  ]);
  const timezone = identity.account?.timezone ?? DEFAULT_NEOFIT_TIME_ZONE;
  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: timezone,
  }).format(now);
  const weekday = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    timeZone: timezone,
  }).format(now);

  return (
    <NutritionStateProvider
      initialDiary={nutrition.diary}
      initialGoals={nutrition.goals}
      loadError={nutrition.loadError}
    >
      <TodayScreen workout={workout} dateLabel={dateLabel} weekday={weekday} />
    </NutritionStateProvider>
  );
}
