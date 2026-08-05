"use client";

import * as React from "react";
import { format } from "date-fns";
import { Apple, Dumbbell, Flame, LineChart, MoreVertical, Edit, Trash2, Clock, Weight } from "lucide-react";
import type { CombinedLog } from "@/context/user-profile-context";
import { useUserData } from "@/context/user-profile-context";
import { DailyMotivationCard } from "./daily-motivation-card";
import { LogEntrySheet } from "./log-entry-sheet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const iconMap = {
  meal: Apple,
  activity: Flame,
  weight: LineChart,
  workout: Dumbbell,
} satisfies Record<CombinedLog["logType"], React.ElementType>;

function titleFor(log: CombinedLog) {
  if (log.logType === "meal") return log.description;
  if (log.logType === "activity") return log.activityType;
  if (log.logType === "weight") return "ثبت وزن";
  return log.workoutName;
}

function detailsFor(log: CombinedLog) {
  if (log.logType === "meal") return `${log.calories} کیلوکالری`;
  if (log.logType === "activity") return `${log.durationMinutes} دقیقه · ${log.caloriesBurned} کیلوکالری`;
  if (log.logType === "weight") return `${log.weight} کیلوگرم`;
  return `${log.durationMinutes} دقیقه · حجم ${log.totalVolume} کیلوگرم`;
}

export function DailyFeed({ quote, logs }: { quote: string; logs: CombinedLog[] }) {
  const { isLoading, deleteLog } = useUserData();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [editableLog, setEditableLog] = React.useState<CombinedLog | null>(null);

  const handleEdit = (log: CombinedLog) => {
    if (log.logType === "workout") {
      toast({ title: "ثبت تمرین", description: "ویرایش تمرین کامل از صفحهٔ تمرین انجام می‌شود." });
      return;
    }
    setEditableLog(log);
    setSheetOpen(true);
  };

  const handleDelete = async (log: CombinedLog) => {
    if (!log.id) return;
    await deleteLog(log.id, log.logType);
    toast({ title: "حذف شد", description: "ورودی از تایم‌لاین امروز حذف شد." });
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-36 w-full" /><Skeleton className="h-28 w-full" /><Skeleton className="h-28 w-full" /></div>;
  }

  return (
    <section dir="rtl" className="space-y-6">
      <h2 className="text-2xl font-bold">تایم‌لاین امروز</h2>
      <DailyMotivationCard quote={quote} />

      {logs.length === 0 ? (
        <Card className="border-dashed p-8 text-center">
          <CardTitle className="text-lg">هنوز چیزی ثبت نشده است</CardTitle>
          <CardDescription className="mt-2">از دکمهٔ افزودن برای ثبت غذا، فعالیت یا وزن استفاده کن.</CardDescription>
        </Card>
      ) : (
        <div className="space-y-4">
          {logs.map((log) => {
            const Icon = iconMap[log.logType];
            return (
              <Card key={log.id || `${log.logType}-${log.loggedAt}`} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start gap-4 space-y-0 bg-secondary/35 p-4">
                  <div className="rounded-full bg-primary/10 p-2 text-primary"><Icon className="h-6 w-6" /></div>
                  <div className="flex-1 text-right">
                    <CardTitle className="text-base">{titleFor(log)}</CardTitle>
                    <CardDescription className="mt-1">{format(new Date(log.loggedAt), "HH:mm")}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" dir="rtl">
                      {log.logType !== "workout" && <DropdownMenuItem onClick={() => handleEdit(log)}><Edit className="ml-2 h-4 w-4" />ویرایش</DropdownMenuItem>}
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(log)}><Trash2 className="ml-2 h-4 w-4" />حذف</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">
                  {log.logType === "weight" ? <Weight className="h-5 w-5 text-primary" /> : log.logType === "workout" ? <Dumbbell className="h-5 w-5 text-primary" /> : log.logType === "activity" ? <Clock className="h-5 w-5 text-primary" /> : <Apple className="h-5 w-5 text-primary" />}
                  <span>{detailsFor(log)}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <LogEntrySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        logType={editableLog && editableLog.logType !== "workout" ? editableLog.logType : null}
        editableLog={editableLog}
        onClose={() => setEditableLog(null)}
      />
    </section>
  );
}
