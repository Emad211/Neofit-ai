import { notFound } from 'next/navigation';
import { WorkoutDetailsScreen } from '@/components/workout-details-screen';
import { findWorkoutInSnapshot, loadWorkoutPlanSnapshot } from '@/lib/supabase/workout-plan-data';

export const dynamic = 'force-dynamic';

export default async function WorkoutDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, snapshot] = await Promise.all([params, loadWorkoutPlanSnapshot()]);
  const workout = findWorkoutInSnapshot(snapshot, id);
  if (!workout) notFound();

  return <WorkoutDetailsScreen workout={workout} />;
}
