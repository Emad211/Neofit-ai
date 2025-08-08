import { ActivityRings } from '@/components/dashboard/activity-rings';
import { DailyFeed } from '@/components/dashboard/daily-feed';
import { SpeedDial } from '@/components/dashboard/speed-dial';
import { getPersonalizedQuote } from "@/lib/data/static-quotes";


function getQuote(userName: string) {
    try {
        const quote = getPersonalizedQuote(userName);
        return quote;
    } catch (error) {
        console.error("Failed to fetch motivational quote:", error);
        // Return a fallback quote in case of an error
        return "The best time to start was yesterday. The next best time is now.";
    }
}

// Mock data for the activity rings. In a real app, this would be fetched from a database.
const todayProgress = {
  calories: { value: 1250, goal: 2400 },
  protein: { value: 90, goal: 160 },
  workout: { value: 45, goal: 60 },
};


export default async function TodayPage() {
  // In a real app, you'd get the user's name from auth.
  const quote = getQuote("Sara");

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
        <ActivityRings progress={todayProgress} />
        <DailyFeed quote={quote} />
      </main>

      <SpeedDial />
    </div>
  );
}
