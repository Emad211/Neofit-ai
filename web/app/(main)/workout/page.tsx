import { WorkoutScreen } from '@/components/workout-screen';
import { loadWorkoutPlanSnapshot } from '@/lib/supabase/workout-plan-data';

export default async function WorkoutPage() {
  const snapshot = await loadWorkoutPlanSnapshot();
  return <WorkoutScreen snapshot={snapshot} />;
}
