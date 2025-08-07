import { ActivityRings } from '@/components/dashboard/activity-rings';
import { DailyFeed } from '@/components/dashboard/daily-feed';
import { SpeedDial } from '@/components/dashboard/speed-dial';
import { getDailyMotivationalQuote } from "@/ai/flows/daily-motivational-quote";

async function fetchQuote() {
    try {
        // In a real app, you'd pass the actual user ID.
        const quote = await getDailyMotivationalQuote({ userId: '12345' });
        return quote;
    } catch (error) {
        console.error("Failed to fetch motivational quote:", error);
        // Return a fallback quote in case of an error
        return { quote: "The best time to start was yesterday. The next best time is now." };
    }
}

// Mock data for the activity rings. In a real app, this would be fetched from a database.
const todayProgress = {
  calories: { value: 1250, goal: 2400 },
  protein: { value: 90, goal: 160 },
  workout: { value: 45, goal: 60 },
};


export default async function TodayPage() {
  const quoteData = await fetchQuote();

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
        <DailyFeed quote={quoteData.quote} />
      </main>

      <SpeedDial />
    </div>
  );
}
