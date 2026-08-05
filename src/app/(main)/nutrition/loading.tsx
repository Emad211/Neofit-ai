import { Skeleton } from "@/components/ui/skeleton";

export default function NutritionLoading() {
  return (
    <main dir="rtl" className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6 py-3">
        <div className="space-y-3"><Skeleton className="h-8 w-40" /><Skeleton className="h-11 w-80" /><Skeleton className="h-5 w-full max-w-xl" /></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}</div>
        <Skeleton className="h-32 rounded-3xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-[34rem] rounded-3xl" />)}</div>
      </div>
    </main>
  );
}
