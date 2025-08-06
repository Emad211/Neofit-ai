import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WorkoutPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-foreground">
          Workout
        </h1>
        <p className="text-muted-foreground">
          Your personalized training program.
        </p>
      </header>
       <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The immersive workout player and your program will be available here soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
