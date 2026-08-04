import { Suspense } from "react";

function OnboardingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6" dir="rtl">
      <div className="w-full max-w-md space-y-4 rounded-3xl border bg-card p-8 shadow-sm">
        <div className="h-10 w-32 animate-pulse rounded-xl bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<OnboardingFallback />}>{children}</Suspense>;
}
