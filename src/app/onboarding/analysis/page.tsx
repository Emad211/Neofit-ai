import { AnalysisAnimation } from '@/components/onboarding/analysis-animation';
import { Button } from '@/components/ui/button';
import { MoveRight } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingAnalysisPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <div className="w-full max-w-2xl">
        <AnalysisAnimation />

        <h1 className="mt-8 text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
          Analyzing Your Profile
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Our AI is crafting your hyper-personalized fitness and nutrition plan. This will just take a moment...
        </p>

        <div className="mt-10">
          <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/today">
              Start Your Journey <MoveRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
