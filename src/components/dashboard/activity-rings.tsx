"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function Ring({ progress, color, size, strokeWidth }: { progress: number; color: string; size: number; strokeWidth: number }) {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.max(0, Math.min(100, progress));
  const strokeDashoffset = circumference - (normalized / 100) * circumference;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
      <circle stroke="hsl(var(--muted))" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={center} cy={center} />
      <circle stroke={color} fill="transparent" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} r={radius} cx={center} cy={center} style={{ transition: "stroke-dashoffset 0.5s ease-out" }} />
    </svg>
  );
}

export type ProgressData = {
  calories: { value: number; goal: number };
  protein: { value: number; goal: number };
  workout: { value: number; goal: number };
};

export function ActivityRings({ progress }: { progress: ProgressData }) {
  const activityData = [
    { name: "کالری", ...progress.calories, unit: "کیلوکالری", color: "hsl(var(--chart-1))" },
    { name: "پروتئین", ...progress.protein, unit: "گرم", color: "hsl(var(--chart-2))" },
    { name: "تمرین", ...progress.workout, unit: "دقیقه", color: "hsl(var(--chart-3))" },
  ];
  const baseSize = 180;
  const strokeWidth = 14;
  const ringGap = 2 * (strokeWidth + 2);
  const overall = Math.round(activityData.reduce((sum, item) => sum + Math.min(1, item.value / Math.max(1, item.goal)), 0) / activityData.length * 100);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2"><CardTitle className="font-headline">پیشرفت امروز</CardTitle></CardHeader>
      <CardContent className="flex flex-col items-center gap-7 p-5 sm:flex-row sm:p-6">
        <div className="relative flex shrink-0 items-center justify-center" style={{ width: baseSize, height: baseSize }}>
          {activityData.map((activity, index) => <div key={activity.name} className="absolute inset-0 flex items-center justify-center"><Ring progress={(activity.value / Math.max(1, activity.goal)) * 100} color={activity.color} size={baseSize - index * ringGap} strokeWidth={strokeWidth} /></div>)}
          <div className="absolute text-center"><p className="text-3xl font-black">{overall}٪</p><p className="text-xs text-muted-foreground">پایبندی فعلی</p></div>
        </div>
        <div className="grid w-full flex-1 grid-cols-3 gap-2">
          {activityData.map((activity) => (
            <div key={activity.name} className="rounded-2xl bg-muted/35 p-3 text-center">
              <span className="mx-auto mb-2 block h-2 w-8 rounded-full" style={{ backgroundColor: activity.color }} />
              <p className="text-xs text-muted-foreground">{activity.name}</p>
              <p className="mt-1 text-lg font-black">{activity.value}</p>
              <p className="text-[11px] text-muted-foreground">از {activity.goal} {activity.unit}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
