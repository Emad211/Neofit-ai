import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
       <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Charts, progress photos, and your weekly AI reports will appear here.</p>
        </CardContent>
      </Card>
    </div>
  );
}
