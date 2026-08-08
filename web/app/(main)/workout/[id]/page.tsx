import { notFound } from 'next/navigation';
import { WorkoutDetailsScreen } from '@/components/workout-details-screen';
import { findWorkout, workoutPlan } from '@/data/workout-fixtures';

export function generateStaticParams() {
  return workoutPlan.map((workout) => ({ id: workout.id }));
}

export default async function WorkoutDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = findWorkout(id);
  if (!workout) notFound();

  return <WorkoutDetailsScreen workout={workout} />;
}
