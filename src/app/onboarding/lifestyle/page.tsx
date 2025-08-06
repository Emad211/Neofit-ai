import { OnboardingLifestyleForm } from "@/components/onboarding/onboarding-lifestyle-form";
import { MoveLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OnboardingLifestylePage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
       <div className="w-full max-w-2xl">
         <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
              A Bit More About You
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              This extra detail helps us tailor your plan perfectly.
            </p>
         </div>

        <OnboardingLifestyleForm />

        <div className="mt-8 text-center">
          <Button variant="ghost" asChild>
            <Link href="/onboarding/details">
              <MoveLeft className="mr-2 h-4 w-4" /> Back to Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
