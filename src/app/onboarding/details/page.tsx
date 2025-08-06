import { OnboardingDetailsForm } from "@/components/onboarding/onboarding-details-form";
import { MoveLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function OnboardingDetailsPage() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
       <div className="w-full max-w-2xl">
         <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl font-headline">
              Tell Us About Yourself
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              This helps us create your personalized plan.
            </p>
         </div>

        <OnboardingDetailsForm />

        <div className="mt-8 text-center">
          <Button variant="ghost" asChild>
            <Link href="/">
              <MoveLeft className="mr-2 h-4 w-4" /> Back to Goal
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
