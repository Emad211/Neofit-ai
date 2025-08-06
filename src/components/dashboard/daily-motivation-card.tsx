import { getDailyMotivationalQuote } from "@/ai/flows/daily-motivational-quote";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

async function fetchQuote() {
    // In a real app, you'd pass the actual user ID.
    const quote = await getDailyMotivationalQuote({ userId: '12345' });
    return quote;
}

export async function DailyMotivationCard() {
    const quoteData = await fetchQuote();

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="bg-secondary p-3 rounded-full">
                    <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                    <CardTitle>Daily Motivation</CardTitle>
                    <CardDescription>10:00 AM</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">&quot;{quoteData.quote}&quot;</p>
            </CardContent>
        </Card>
    );
}