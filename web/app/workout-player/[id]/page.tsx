import { notFound } from 'next/navigation';
import { WorkoutPlayer } from '@/components/workout-player';
import { findWorkoutInSnapshot, loadWorkoutPlanSnapshot } from '@/lib/supabase/workout-plan-data';

export const dynamic = 'force-dynamic';

export default async function WorkoutPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, snapshot] = await Promise.all([params, loadWorkoutPlanSnapshot()]);
  const workout = findWorkoutInSnapshot(snapshot, id);
  if (!workout) notFound();
  return <WorkoutPlayer workout={workout} userId={snapshot.userId} />;
}
