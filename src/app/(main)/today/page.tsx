import { ActivityRings } from '@/components/dashboard/activity-rings';
import { DailyFeed } from '@/components/dashboard/daily-feed';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

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
      
      <main className="space-y-8">
        <ActivityRings />
        <DailyFeed />
      </main>

      <div className="fixed bottom-24 right-6 z-50 sm:bottom-8">
         <Button size="icon" className="h-16 w-16 rounded-full shadow-lg bg-accent hover:bg-accent/90">
            <Plus className="h-8 w-8" />
            <span className="sr-only">Add new entry</span>
         </Button>
      </div>
    </div>
  );
}
