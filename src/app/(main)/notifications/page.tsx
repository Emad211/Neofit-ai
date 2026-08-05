"use client";

import { Bell, CheckCheck, Droplets, Dumbbell, FileChartColumn, Settings2, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useNotifications, type NotificationCategory } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

const icons = { workout: Dumbbell, meal: Utensils, water: Droplets, report: FileChartColumn };
const preferenceItems: Array<{ category: NotificationCategory; title: string; description: string }> = [
  { category: "workout", title: "تمرین و برنامه", description: "آماده‌شدن جلسه و یادآوری زمان تمرین" },
  { category: "meal", title: "وعده‌های غذایی", description: "زمان وعده‌ها و یادآوری ثبت غذا" },
  { category: "water", title: "آب روزانه", description: "یادآوری رسیدن به هدف آب" },
  { category: "report", title: "گزارش و پیشرفت", description: "خلاصه‌های هفتگی و دستاوردها" },
];

export default function NotificationsPage() {
  const { notices, unreadCount, preferences, isHydrated, markAllRead, markRead, remove, setPreference } = useNotifications();

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl py-4">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div><div className="flex items-center gap-2"><Bell className="h-6 w-6 text-primary" /><h1 className="text-3xl font-black">اعلان‌ها</h1></div><p className="mt-2 text-muted-foreground">{unreadCount ? `تعداد اعلان‌های خوانده‌نشده: ${unreadCount.toLocaleString("fa-IR")}` : "همه اعلان‌ها خوانده شده‌اند"}</p></div>
          <Button variant="outline" onClick={markAllRead} disabled={!unreadCount}><CheckCheck className="ml-2 h-4 w-4" />خواندن همه</Button>
        </header>

        <Card id="notification-settings" className="mb-6 scroll-mt-24">
          <CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" />تنظیمات اعلان‌ها</CardTitle><p className="text-sm leading-6 text-muted-foreground">این گزینه‌ها فقط ارسال اعلان‌های جدید آینده را کنترل می‌کنند؛ موارد موجود در مرکز اعلان حذف نمی‌شوند.</p></CardHeader>
          <CardContent className="divide-y">
            {preferenceItems.map((item) => {
              const Icon = icons[item.category];
              const id = `notification-preference-${item.category}`;
              return (
                <div key={item.category} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></span>
                  <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer"><span className="block font-black">{item.title}</span><span className="mt-1 block text-sm leading-6 text-muted-foreground">{item.description}</span></label>
                  <Switch id={id} aria-label={item.title} checked={preferences[item.category]} disabled={!isHydrated} onCheckedChange={(enabled) => setPreference(item.category, enabled)} />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {!isHydrated ? (
          <div className="space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : notices.length === 0 ? (
          <Card className="border-dashed"><CardContent className="p-10 text-center"><Bell className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-4 font-bold">اعلانی باقی نمانده است</p><p className="mt-2 text-sm text-muted-foreground">یادآورها و گزارش‌های جدید اینجا نمایش داده می‌شوند.</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {notices.map((notice) => {
              const Icon = icons[notice.category];
              return (
                <Card key={notice.id} className={cn("transition", !notice.read && "border-primary/35 bg-primary/5")}>
                  <CardContent className="flex items-start gap-4 p-4">
                    <button type="button" onClick={() => markRead(notice.id)} className="flex flex-1 items-start gap-4 text-right">
                      <div className="rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div>
                      <div className="flex-1"><div className="flex items-center gap-2"><p className="font-bold">{notice.title}</p>{!notice.read ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}</div><p className="mt-1 text-sm leading-6 text-muted-foreground">{notice.description}</p><p className="mt-2 text-xs text-muted-foreground">{notice.time}</p></div>
                    </button>
                    <Button size="icon" variant="ghost" onClick={() => remove(notice.id)} aria-label={`حذف ${notice.title}`}><Trash2 className="h-4 w-4" /></Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
