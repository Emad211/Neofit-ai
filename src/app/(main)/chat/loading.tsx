import { Skeleton } from "@/components/ui/skeleton";

export default function CoachLoading() {
  return (
    <main dir="rtl" className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl py-3">
        <Skeleton className="h-6 w-40" /><Skeleton className="mt-3 h-10 w-56" /><Skeleton className="mt-2 h-5 w-80 max-w-full" />
        <Skeleton className="mt-6 h-20" />
        <div className="mt-4 flex gap-2">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-10 w-28" />)}</div>
        <Skeleton className="mt-4 h-[540px]" />
      </div>
    </main>
  );
}
