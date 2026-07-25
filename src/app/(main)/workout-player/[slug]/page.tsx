import { notFound } from 'next/navigation';
import { WorkoutPlayer } from '@/components/workout/workout-player';

export default async function WorkoutPlayerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workoutId = decodeURIComponent(slug).trim();
  if (!workoutId || workoutId.length > 100) notFound();

  return (
    <div className="min-h-screen bg-gray-950">
      <WorkoutPlayer workoutId={workoutId} />
    </div>
  );
}
