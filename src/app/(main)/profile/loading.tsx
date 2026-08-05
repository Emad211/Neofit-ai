import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <main dir="rtl" className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl py-3">
        <header className="mb-8 flex flex-col items-center"><Skeleton className="h-24 w-24 rounded-full" /><Skeleton className="mt-4 h-8 w-40" /><Skeleton className="mt-2 h-4 w-52" /></header>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}</div>
        <div className="mt-7 grid gap-5 lg:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      </div>
    </main>
  );
}
