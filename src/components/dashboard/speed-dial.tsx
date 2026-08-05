"use client";

import { useState, type ElementType } from "react";
import { Apple, Droplets, Dumbbell, Plus, Weight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDailyMetrics } from "@/hooks/use-daily-metrics";
import { LogEntrySheet, type LogType } from "./log-entry-sheet";

type Action = {
  icon: ElementType;
  label: string;
  logType?: Exclude<LogType, null>;
  kind?: "water";
};

const actions: Action[] = [
  { icon: Apple, label: "ثبت غذا", logType: "meal" },
  { icon: Dumbbell, label: "ثبت فعالیت", logType: "activity" },
  { icon: Weight, label: "ثبت وزن", logType: "weight" },
  { icon: Droplets, label: "یک لیوان آب", kind: "water" },
];

export function SpeedDial() {
  const [isOpen, setIsOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeLogType, setActiveLogType] = useState<Exclude<LogType, null> | null>(null);
  const { addWater } = useDailyMetrics();
  const { toast } = useToast();

  const handleActionClick = (action: Action) => {
    if (action.kind === "water") {
      addWater(250);
      toast({ title: "آب ثبت شد", description: "۲۵۰ میلی‌لیتر به مصرف امروز اضافه شد." });
      setIsOpen(false);
      return;
    }
    if (!action.logType) return;
    setActiveLogType(action.logType);
    setSheetOpen(true);
    setIsOpen(false);
  };

  return (
    <>
      <div className={cn("fixed inset-0 z-40 bg-black/30 transition-opacity duration-300", isOpen ? "opacity-100" : "pointer-events-none opacity-0")} onClick={() => setIsOpen(false)} />
      <div className="fixed bottom-24 left-5 z-50 md:bottom-8 md:left-8">
        <div className="relative flex flex-col items-start gap-3">
          <div className={cn("flex flex-col items-start gap-3 transition-all duration-300", isOpen ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0")}>
            {actions.map((action) => (
              <div key={action.label} className="flex flex-row-reverse items-center gap-3">
                <div className="rounded-xl bg-card px-4 py-2 text-sm font-bold shadow-lg ring-1 ring-border">{action.label}</div>
                <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full shadow-lg" onClick={() => handleActionClick(action)} aria-label={action.label}><action.icon className="h-5 w-5" /></Button>
              </div>
            ))}
          </div>

          <Button size="icon" className="relative h-15 w-15 rounded-full shadow-xl" onClick={() => setIsOpen((open) => !open)} aria-expanded={isOpen} aria-label={isOpen ? "بستن افزودن سریع" : "بازکردن افزودن سریع"}>
            <Plus className={cn("absolute h-7 w-7 transition-all", isOpen ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100")} />
            <X className={cn("absolute h-7 w-7 transition-all", isOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0")} />
          </Button>
        </div>
      </div>

      <LogEntrySheet open={sheetOpen} onOpenChange={setSheetOpen} logType={activeLogType} onClose={() => setActiveLogType(null)} />
    </>
  );
}
