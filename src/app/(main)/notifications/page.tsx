"use client";

import * as React from "react";
import { Bell, CheckCheck, Droplets, Dumbbell, FileChartColumn, Trash2, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Notice = { id: string; title: string; description: string; time: string; category: "workout" | "meal" | "water" | "report"; read: boolean };
const initial: Notice[] = [
  { id: "workout", title: "تمرین امروز آماده است", description: "جلسه تمام بدن A حدود ۶۰ دقیقه زمان می‌برد.", time: "امروز، ۱۸:۰۰", category: "workout", read: false },
  { id: "meal", title: "وعده بعدی", description: "میان‌وعده ماست و موز تا یک ساعت دیگر برنامه‌ریزی شده است.", time: "امروز، ۱۶:۳۰", category: "meal", read: false },
  { id: "water", title: "یادآوری آب", description: "برای رسیدن به هدف امروز، یک لیوان آب ثبت کن.", time: "۱۵ دقیقه پیش", category: "water", read: false },
  { id: "report", title: "خلاصه هفتگی", description: "گزارش پایبندی و روند تمرین برای مرور آماده است.", time: "دیروز", category: "report", read: true },
];
const icons = { workout: Dumbbell, meal: Utensils, water: Droplets, report: FileChartColumn };
const STORAGE_KEY = "neofit:notifications:v1";

export default function NotificationsPage() {
  const [notices, setNotices] = React.useState<Notice[]>(initial);
  React.useEffect(() => { try { const saved = window.localStorage.getItem(STORAGE_KEY); if (saved) setNotices(JSON.parse(saved)); } catch {} }, []);
  React.useEffect(() => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notices)); }, [notices]);
  const unread = notices.filter((notice) => !notice.read).length;

  return (
    <main dir="rtl" className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl py-4">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2"><Bell className="h-6 w-6 text-primary" /><h1 className="text-3xl font-black">اعلان‌ها</h1></div><p className="mt-2 text-muted-foreground">{unread ? `${unread} اعلان خوانده‌نشده` : "همه اعلان‌ها خوانده شده‌اند"}</p></div><Button variant="outline" onClick={() => setNotices((current) => current.map((notice) => ({ ...notice, read: true })))} disabled={!unread}><CheckCheck className="ml-2 h-4 w-4" />خواندن همه</Button></header>

        {notices.length === 0 ? <Card className="border-dashed"><CardContent className="p-10 text-center"><Bell className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-4 font-bold">اعلانی باقی نمانده است</p><p className="mt-2 text-sm text-muted-foreground">یادآورها و گزارش‌های جدید اینجا نمایش داده می‌شوند.</p></CardContent></Card> : (
          <div className="space-y-3">{notices.map((notice) => { const Icon = icons[notice.category]; return <Card key={notice.id} className={cn("transition", !notice.read && "border-primary/35 bg-primary/5")}><CardContent className="flex items-start gap-4 p-4"><button type="button" onClick={() => setNotices((current) => current.map((item) => item.id === notice.id ? { ...item, read: true } : item))} className="flex flex-1 items-start gap-4 text-right"><div className="rounded-2xl bg-primary/10 p-3 text-primary"><Icon className="h-5 w-5" /></div><div className="flex-1"><div className="flex items-center gap-2"><p className="font-bold">{notice.title}</p>{!notice.read ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}</div><p className="mt-1 text-sm leading-6 text-muted-foreground">{notice.description}</p><p className="mt-2 text-xs text-muted-foreground">{notice.time}</p></div></button><Button size="icon" variant="ghost" onClick={() => setNotices((current) => current.filter((item) => item.id !== notice.id))} aria-label={`حذف ${notice.title}`}><Trash2 className="h-4 w-4" /></Button></CardContent></Card>; })}</div>
        )}
      </div>
    </main>
  );
}
