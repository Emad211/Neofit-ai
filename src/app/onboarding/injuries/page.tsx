import { BodyMap } from '@/components/onboarding/body-map/body-map';
import { MoveLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OnboardingInjuriesPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
            Any Aches or Pains?
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Select any areas of past or current injury. This helps us create a safe plan for you.
          </p>
        </div>
        
        <BodyMap />

        <div className="mt-8 text-center">
          <Button variant="ghost" asChild>
            <Link href="/onboarding/lifestyle">
              <MoveLeft className="mr-2 h-4 w-4" /> Back to Lifestyle
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
