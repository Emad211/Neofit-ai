"use client";

import * as React from "react";
import { Ruler, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

export type BodyMeasurementLog = {
  id: string;
  loggedAt: string;
  waistCm: number | null;
  hipCm: number | null;
  neckCm: number | null;
  bodyFatPercent: number | null;
};

const STORAGE_KEY = "neofit:measurement-logs:v1";

export function MeasurementSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [waist, setWaist] = React.useState("");
  const [hip, setHip] = React.useState("");
  const [neck, setNeck] = React.useState("");
  const [bodyFat, setBodyFat] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setWaist("");
    setHip("");
    setNeck("");
    setBodyFat("");
  }, [open]);

  const save = () => {
    const values = [waist, hip, neck, bodyFat].filter(Boolean).map(Number);
    if (!values.length || values.some((value) => !Number.isFinite(value) || value <= 0)) {
      toast({ variant: "destructive", title: "اندازه معتبر وارد کن", description: "حداقل یکی از اندازه‌ها باید عدد مثبت باشد." });
      return;
    }
    let current: BodyMeasurementLog[] = [];
    try { current = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]"); } catch {}
    const log: BodyMeasurementLog = {
      id: `measurement-${Date.now()}`,
      loggedAt: new Date().toISOString(),
      waistCm: waist ? Number(waist) : null,
      hipCm: hip ? Number(hip) : null,
      neckCm: neck ? Number(neck) : null,
      bodyFatPercent: bodyFat ? Number(bodyFat) : null,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([log, ...current]));
    window.dispatchEvent(new CustomEvent("neofit:measurement-logs-changed", { detail: log }));
    toast({ title: "اندازه‌ها ثبت شدند", description: "این رکورد در بخش پیشرفت قابل استفاده خواهد بود." });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent dir="rtl" className="overflow-y-auto">
        <SheetHeader className="text-right"><SheetTitle className="flex items-center gap-2"><Ruler className="h-5 w-5 text-primary" />ثبت اندازه‌های بدن</SheetTitle><SheetDescription>برای روند معتبر، اندازه‌گیری را در شرایط مشابه و با متر بدون کشش انجام بده.</SheetDescription></SheetHeader>
        <div className="grid gap-5 py-6 sm:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="measure-waist">دور کمر</Label><Input id="measure-waist" type="number" min={30} max={250} step="0.1" value={waist} onChange={(event) => setWaist(event.target.value)} placeholder="سانتی‌متر" /></div>
          <div className="space-y-2"><Label htmlFor="measure-hip">دور لگن</Label><Input id="measure-hip" type="number" min={30} max={250} step="0.1" value={hip} onChange={(event) => setHip(event.target.value)} placeholder="سانتی‌متر" /></div>
          <div className="space-y-2"><Label htmlFor="measure-neck">دور گردن</Label><Input id="measure-neck" type="number" min={15} max={100} step="0.1" value={neck} onChange={(event) => setNeck(event.target.value)} placeholder="سانتی‌متر" /></div>
          <div className="space-y-2"><Label htmlFor="measure-fat">درصد چربی تخمینی</Label><Input id="measure-fat" type="number" min={2} max={70} step="0.1" value={bodyFat} onChange={(event) => setBodyFat(event.target.value)} placeholder="درصد" /></div>
        </div>
        <SheetFooter><Button type="button" className="w-full" onClick={save}><Save className="ml-2 h-4 w-4" />ذخیره اندازه‌ها</Button></SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
