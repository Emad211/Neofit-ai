import { WorkoutDayDetails } from "@/components/workout/workout-day-details";
import { demoWorkoutPlan } from "@/lib/neofit-demo-data";

export function generateStaticParams() {
  return demoWorkoutPlan.map((workout) => ({ id: workout.id }));
}

export default async function WorkoutDayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WorkoutDayDetails workoutId={id} />;
}
