import { Skeleton } from "@/components/ui/skeleton";

export default function ProgressLoading() {
  return (
    <main dir="rtl" className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6 py-3">
        <div className="space-y-3"><Skeleton className="h-8 w-40" /><Skeleton className="h-11 w-64" /><Skeleton className="h-5 w-full max-w-2xl" /></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}</div>
        <div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-80 rounded-3xl" /><Skeleton className="h-80 rounded-3xl" /><Skeleton className="h-80 rounded-3xl lg:col-span-2" /></div>
      </div>
    </main>
  );
}
