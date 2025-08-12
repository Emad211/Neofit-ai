"use client"

import { Card, CardContent } from "@/components/ui/card";
import { Zap } from "lucide-react";

export function DailyMotivationCard({ quote }: { quote: string }) {
    return (
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-accent/80 text-primary-foreground shadow-lg">
            <Zap className="absolute -right-4 -bottom-8 h-32 w-32 text-primary-foreground/20 opacity-50 transform rotate-[-20deg]" />
            <CardContent className="p-6 relative z-10">
                 <h3 className="text-lg font-semibold">Daily Motivation</h3>
                 <p className="mt-2 text-2xl font-bold font-headline leading-tight">&quot;{quote}&quot;</p>
            </CardContent>
        </Card>
    );
}
