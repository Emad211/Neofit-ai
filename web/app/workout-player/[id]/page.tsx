import { notFound } from 'next/navigation';
import { WorkoutPlayer } from '@/components/workout-player';
import { findWorkout, workoutPlan } from '@/data/workout-fixtures';
import { loadWorkoutIdentity } from '@/lib/supabase/workout-identity';

export function generateStaticParams() {
  return workoutPlan.map((workout) => ({ id: workout.id }));
}

export default async function WorkoutPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workout = findWorkout(id);
  if (!workout) notFound();
  const identity = await loadWorkoutIdentity();
  return <WorkoutPlayer workout={workout} userId={identity.userId} />;
}
