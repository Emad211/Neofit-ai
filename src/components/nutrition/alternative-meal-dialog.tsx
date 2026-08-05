"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { suggestLocalMeal } from "@/lib/neofit-demo-data";
import type { Meal } from "@/lib/neofit-models";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  meal: Meal;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectAlternative: (name: string) => void;
};

export function AlternativeMealDialog({ meal, isOpen, onOpenChange, onSelectAlternative }: Props) {
  const [alternative, setAlternative] = React.useState(() => suggestLocalMeal(meal));

  React.useEffect(() => {
    if (isOpen) setAlternative(suggestLocalMeal(meal));
  }, [isOpen, meal]);

  const choose = () => {
    onSelectAlternative(alternative.name);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader className="text-right">
          <DialogTitle>جایگزین وعده</DialogTitle>
          <DialogDescription>جایگزین از میان گزینه‌های محلی و نزدیک به کالری وعده انتخاب شده است.</DialogDescription>
        </DialogHeader>
        <Card>
          <CardContent className="p-5">
            <p className="font-bold">{alternative.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">حدود {alternative.calories} کیلوکالری</p>
          </CardContent>
        </Card>
        <DialogFooter className="gap-2 sm:justify-start">
          <Button onClick={choose}>انتخاب این وعده</Button>
          <Button variant="outline" onClick={() => setAlternative(suggestLocalMeal({ ...meal, name: alternative.name }))}><RefreshCw className="ml-2 h-4 w-4" />گزینهٔ دیگر</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
