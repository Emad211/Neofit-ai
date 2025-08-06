import { WorkoutPlayer } from "@/components/workout/workout-player";

// This page will host the immersive workout experience.
// The [slug] will eventually be used to fetch the specific workout data.
export default function WorkoutPlayerPage({ params }: { params: { slug: string } }) {
  return (
    <div className="min-h-screen bg-card">
      <WorkoutPlayer workoutId={params.slug} />
    </div>
  );
}
