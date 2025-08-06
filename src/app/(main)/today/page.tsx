import { ActivityRings } from '@/components/dashboard/activity-rings';
import { DailyFeed } from '@/components/dashboard/daily-feed';
import { SpeedDial } from '@/components/dashboard/speed-dial';

export default function TodayPage() {
  return (
    <div className="relative min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-foreground">
          Hello, Sara
        </h1>
        <p className="text-muted-foreground">
          Ready to crush your goals today?
        </p>
      </header>
      
      <main className="space-y-8 pb-24">
        <ActivityRings />
        <DailyFeed />
      </main>

      <SpeedDial />
    </div>
  );
}
