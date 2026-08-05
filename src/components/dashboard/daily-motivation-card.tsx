"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";

export function DailyMotivationCard({ quote }: { quote: string }) {
  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent/80 text-primary-foreground shadow-lg">
      <Zap className="absolute -bottom-8 -left-4 h-32 w-32 -rotate-12 text-primary-foreground/20 opacity-50" />
      <CardContent className="relative z-10 p-6">
        <h3 className="text-lg font-semibold">انگیزه امروز</h3>
        <p className="mt-2 text-2xl font-bold font-headline leading-tight">«{quote}»</p>
      </CardContent>
    </Card>
  );
}
