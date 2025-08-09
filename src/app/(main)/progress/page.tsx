import { DebugDataFetcher } from "@/components/progress/debug-data-fetcher";
import { ProgressPhotos } from "@/components/progress/progress-photos";
import { WeeklyAiReport } from "@/components/progress/weekly-ai-report";
import { WeightChart } from "@/components/progress/weight-chart";
import { WorkoutVolumeChart } from "@/components/progress/workout-volume-chart";

export default function ProgressPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-foreground">
          Progress
        </h1>
        <p className="text-muted-foreground">
          Track your journey and celebrate milestones.
        </p>
      </header>
      <main className="space-y-8">
        <WeeklyAiReport />
        <WeightChart />
        <WorkoutVolumeChart />
        <ProgressPhotos />
        <DebugDataFetcher />
      </main>
    </div>
  );
}
