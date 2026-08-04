// src/components/dashboard/log-entry-sheet.tsx
"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Apple, Dumbbell, Weight, Calculator, Loader2 } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { cn } from "@/lib/utils";
import { useUserData, type CombinedLog } from "@/context/user-profile-context";

export type LogType = "meal" | "activity" | "weight" | null;

const logConfig = {
  meal: { title: "ثبت وعده", description: "غذایی که مصرف کرده‌ای را ثبت کن.", icon: Apple },
  activity: { title: "ثبت فعالیت", description: "تمرین یا فعالیت روزانه را اضافه کن.", icon: Dumbbell },
  weight: { title: "ثبت وزن", description: "وزن فعلی خود را وارد کن.", icon: Weight },
};

interface LogEntrySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logType: LogType;
  editableLog?: CombinedLog | null;
  onClose?: () => void;
}

function estimateCalories(activity: string, durationMinutes: number, intensity: "low" | "medium" | "high", weightKg: number) {
  const normalized = activity.trim().toLowerCase();
  const baseMet =
    normalized.includes("run") || normalized.includes("دو") ? 8 :
    normalized.includes("walk") || normalized.includes("پیاده") ? 3.8 :
    normalized.includes("cycle") || normalized.includes("دوچرخه") ? 6.8 :
    normalized.includes("swim") || normalized.includes("شنا") ? 7 :
    normalized.includes("weight") || normalized.includes("بدنسازی") || normalized.includes("تمرین") ? 5.5 :
    5;
  const intensityFactor = intensity === "low" ? 0.75 : intensity === "high" ? 1.25 : 1;
  return Math.max(1, Math.round((baseMet * intensityFactor * 3.5 * weightKg / 200) * durationMinutes));
}

export function LogEntrySheet({ open, onOpenChange, logType, editableLog, onClose }: LogEntrySheetProps) {
  const config = logType ? logConfig[logType] : null;
  const { toast } = useToast();
  const { userProfile, logMeal, logActivity, logWeight, updateLog } = useUserData();
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [calculatedCalories, setCalculatedCalories] = React.useState<number | null>(null);
  const isEditMode = Boolean(editableLog);
  const { register, handleSubmit, watch, setValue, control, reset } = useForm();

  React.useEffect(() => {
    if (open && editableLog) reset(editableLog);
    else reset({ activityType: "", durationMinutes: "", intensity: "medium", caloriesBurned: "", mealType: "snack", description: "", calories: "", weight: "" });
    setCalculatedCalories(null);
  }, [open, editableLog, reset]);

  React.useEffect(() => {
    if (!open && onClose) onClose();
  }, [open, onClose]);

  const activityType = watch("activityType");
  const durationMinutes = watch("durationMinutes");
  const intensity = watch("intensity") as "low" | "medium" | "high";

  const handleCalculateCalories = async () => {
    const duration = Number.parseInt(durationMinutes, 10);
    if (!activityType || !Number.isFinite(duration) || duration <= 0) {
      toast({ variant: "destructive", title: "اطلاعات ناقص", description: "نوع فعالیت و مدت آن را وارد کن." });
      return;
    }
    setIsCalculating(true);
    try {
      const result = estimateCalories(activityType, duration, intensity || "medium", Number(userProfile?.weight || 75));
      setValue("caloriesBurned", String(result));
      setCalculatedCalories(result);
    } finally {
      setIsCalculating(false);
    }
  };

  const onFormSubmit = async (data: any) => {
    if (!logType) return;
    setIsSubmitting(true);
    try {
      if (isEditMode && editableLog) {
        const updatedData = { ...editableLog, ...data };
        if (updatedData.calories) updatedData.calories = Number.parseInt(updatedData.calories, 10);
        if (updatedData.durationMinutes) updatedData.durationMinutes = Number.parseInt(updatedData.durationMinutes, 10);
        if (updatedData.caloriesBurned) updatedData.caloriesBurned = Number.parseInt(updatedData.caloriesBurned, 10);
        if (updatedData.weight) updatedData.weight = Number.parseFloat(updatedData.weight);
        await updateLog(editableLog.id!, logType, updatedData);
      } else if (logType === "meal") {
        await logMeal({ mealType: data.mealType, description: data.description, calories: Number.parseInt(data.calories, 10) });
      } else if (logType === "activity") {
        await logActivity({ activityType: data.activityType, durationMinutes: Number.parseInt(data.durationMinutes, 10), intensity: data.intensity, caloriesBurned: Number.parseInt(data.caloriesBurned, 10) || 0 });
      } else {
        await logWeight({ weight: Number.parseFloat(data.weight) });
      }
      toast({ title: isEditMode ? "ویرایش شد" : "ثبت شد", description: "اطلاعات در نسخهٔ نمایشی نئوفیت ذخیره شد." });
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "خطا در ذخیره", description: "دوباره تلاش کن." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!logType || !config) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent dir="rtl">
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <SheetHeader className="text-right">
            <SheetTitle className="flex items-center gap-2"><config.icon className="h-6 w-6 text-primary" />{isEditMode ? "ویرایش ثبت" : config.title}</SheetTitle>
            <SheetDescription>{config.description}</SheetDescription>
          </SheetHeader>
          <div className="grid gap-6 py-6">
            {logType === "meal" && <>
              <div className="grid gap-2"><Label>وعده</Label><Controller name="mealType" control={control} render={({ field }) => <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="انتخاب وعده" /></SelectTrigger><SelectContent><SelectItem value="breakfast">صبحانه</SelectItem><SelectItem value="lunch">ناهار</SelectItem><SelectItem value="dinner">شام</SelectItem><SelectItem value="snack">میان‌وعده</SelectItem></SelectContent></Select>} /></div>
              <div className="grid gap-2"><Label htmlFor="description">شرح غذا</Label><Input id="description" placeholder="مثلاً قورمه‌سبزی با چلو" {...register("description", { required: true })} /></div>
              <div className="grid gap-2"><Label htmlFor="calories">کالری</Label><Input id="calories" type="number" placeholder="مثلاً ۷۱۰" {...register("calories", { required: true })} /></div>
            </>}
            {logType === "activity" && <>
              <div className="grid gap-2"><Label htmlFor="activity-type">فعالیت</Label><Input id="activity-type" placeholder="مثلاً بدنسازی" {...register("activityType", { required: true })} /></div>
              <div className="grid gap-2"><Label htmlFor="durationMinutes">مدت به دقیقه</Label><Input id="durationMinutes" type="number" {...register("durationMinutes", { required: true })} /></div>
              <div className="grid gap-2"><Label>شدت</Label><Controller name="intensity" control={control} render={({ field }) => <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-3 gap-2">{[["low","کم"],["medium","متوسط"],["high","زیاد"]].map(([value,label]) => <Label key={value} className={cn("cursor-pointer rounded-md border p-3 text-center text-sm", field.value === value && "border-primary ring-2 ring-primary")}><RadioGroupItem value={value} className="sr-only" />{label}</Label>)}</RadioGroup>} /></div>
              <div className="grid gap-2"><Label htmlFor="calories-burned">کالری مصرف‌شده</Label><Input id="calories-burned" type="number" {...register("caloriesBurned")} /></div>
              <Button type="button" variant="outline" onClick={handleCalculateCalories} disabled={isCalculating}>{isCalculating ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Calculator className="ml-2 h-4 w-4" />}محاسبهٔ تقریبی{calculatedCalories ? `: ${calculatedCalories}` : ""}</Button>
            </>}
            {logType === "weight" && <div className="grid gap-2"><Label htmlFor="current-weight">وزن (کیلوگرم)</Label><Input id="current-weight" type="number" step="0.1" {...register("weight", { required: true })} /></div>}
          </div>
          <SheetFooter className="gap-2"><SheetClose asChild><Button type="button" variant="secondary" disabled={isSubmitting}>انصراف</Button></SheetClose><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}{isEditMode ? "ذخیره تغییرات" : "ثبت"}</Button></SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
