import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, HeartPulse, Scale, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const goals = [
  {
    icon: Scale,
    title: 'Lose Weight',
    description: 'Reach your ideal weight with a personalized plan.',
    href: '/onboarding/analysis'
  },
  {
    icon: Dumbbell,
    title: 'Gain Muscle',
    description: 'Build strength and muscle mass effectively.',
    href: '/onboarding/analysis'
  },
  {
    icon: HeartPulse,
    title: 'Improve Fitness',
    description: 'Enhance your overall health and energy levels.',
    href: '/onboarding/analysis'
  },
];

export default function OnboardingWelcomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl font-headline">
          Welcome to NeoFit AI
        </h1>
        <p className="mt-4 text-lg text-muted-foreground sm:text-xl">
          Your personal AI-powered fitness and nutrition coach.
        </p>
        <p className="mt-2 text-lg text-muted-foreground sm:text-xl">
          What's your primary goal?
        </p>
      </div>

      <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <Link href={goal.href} key={goal.title} className="group">
            <Card className="h-full transform transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:border-primary">
              <CardHeader className="flex flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-4 text-primary">
                  <goal.icon className="h-10 w-10" />
                </div>
                <CardTitle className="font-headline text-2xl">{goal.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">{goal.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button variant="ghost" asChild>
          <Link href="/onboarding/analysis">
            I'll decide later <MoveRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
