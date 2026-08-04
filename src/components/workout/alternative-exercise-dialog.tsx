"use client";

import * as React from "react";
import { Replace } from "lucide-react";
import { suggestLocalExercise } from "@/lib/neofit-demo-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

export function AlternativeExerciseDialog({ currentExerciseName, onSelectExercise }: { currentExerciseName: string; onSelectExercise: (name: string) => void; availableEquipment: string; medicalLimitations: string }) {
  const [open, setOpen] = React.useState(false);
  const alternative = React.useMemo(() => suggestLocalExercise(currentExerciseName), [currentExerciseName]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm"><Replace className="ml-2 h-4 w-4" />جایگزین حرکت</Button></DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>جایگزین برای {currentExerciseName}</DialogTitle>
          <DialogDescription>یک گزینهٔ ساده و قابل‌کنترل از کتابخانهٔ محلی تمرین.</DialogDescription>
        </DialogHeader>
        <Card><CardContent className="p-5"><p className="font-bold">{alternative.alternativeExercise}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{alternative.reason}</p></CardContent></Card>
        <DialogFooter><Button onClick={() => { onSelectExercise(alternative.alternativeExercise); setOpen(false); }}>انتخاب جایگزین</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
