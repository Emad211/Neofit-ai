export default function TodayLoading() {
  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl animate-pulse space-y-6">
        <div className="space-y-3 py-3"><div className="h-6 w-36 rounded-full bg-muted" /><div className="h-10 w-64 rounded-xl bg-muted" /><div className="h-4 w-80 max-w-full rounded bg-muted" /></div>
        <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]"><div className="h-64 rounded-3xl bg-muted" /><div className="h-64 rounded-3xl bg-muted" /></div>
        <div className="grid gap-4 lg:grid-cols-2"><div className="h-44 rounded-3xl bg-muted" /><div className="h-44 rounded-3xl bg-muted" /></div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-40 rounded-3xl bg-muted" />)}</div>
        <div className="h-72 rounded-3xl bg-muted" />
      </div>
    </main>
  );
}
