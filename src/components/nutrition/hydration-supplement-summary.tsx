"use client";

import { Droplets, Minus, Pill, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useDailyMetrics } from "@/hooks/use-daily-metrics";

const WATER_TARGET_ML = 2500;

export function HydrationSupplementSummary() {
  const { metrics, isReady, addWater } = useDailyMetrics();
  const waterPercent = isReady ? Math.min(100, Math.round((metrics.waterMl / WATER_TARGET_ML) * 100)) : 0;

  return (
    <section className="mt-4 grid gap-4 md:grid-cols-2" aria-label="آب و مکمل‌ها">
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div><p className="font-black">آب امروز</p><p className="mt-2 text-2xl font-black text-sky-700 dark:text-sky-300">{isReady ? `${metrics.waterMl.toLocaleString("fa-IR")} میلی‌لیتر` : "—"}</p><p className="mt-1 text-xs text-muted-foreground">هدف نمایشی: {WATER_TARGET_ML.toLocaleString("fa-IR")} میلی‌لیتر</p></div>
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-700 dark:text-sky-300"><Droplets className="h-6 w-6" /></div>
          </div>
          <Progress value={waterPercent} className="mt-4 h-2" />
          <div className="mt-4 flex items-center justify-end gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => addWater(-250)} aria-label="کم‌کردن یک لیوان آب"><Minus className="ml-1 h-4 w-4" />۲۵۰</Button>
            <Button type="button" size="sm" onClick={() => addWater(250)} aria-label="افزودن یک لیوان آب"><Plus className="ml-1 h-4 w-4" />یک لیوان</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex h-full items-start gap-4 p-5">
          <div className="rounded-2xl bg-violet-500/10 p-3 text-violet-700 dark:text-violet-300"><Pill className="h-6 w-6" /></div>
          <div><p className="font-black">مکمل‌ها</p><p className="mt-2 text-sm leading-7 text-muted-foreground">مکمل فعالی در برنامه ثبت نشده است. نئوفیت بدون اطلاعات معتبر پزشکی یا برنامهٔ تأییدشده، مکمل پیشنهاد نمی‌کند.</p></div>
        </CardContent>
      </Card>
    </section>
  );
}
