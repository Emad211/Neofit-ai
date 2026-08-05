import { WorkoutPlayer } from "@/components/workout/workout-player";

export default async function WorkoutPlayerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <div className="min-h-screen bg-card">
      <WorkoutPlayer workoutId={slug} />
    </div>
  );
}
