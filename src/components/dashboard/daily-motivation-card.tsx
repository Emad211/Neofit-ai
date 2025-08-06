import { getDailyMotivationalQuote } from "@/ai/flows/daily-motivational-quote";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";

async function fetchQuote() {
    try {
        // In a real app, you'd pass the actual user ID.
        const quote = await getDailyMotivationalQuote({ userId: '12345' });
        return quote;
    } catch (error) {
        console.error("Failed to fetch motivational quote:", error);
        // Return a fallback quote in case of an error
        return { quote: "The best time to start was yesterday. The next best time is now." };
    }
}

export async function DailyMotivationCard() {
    const quoteData = await fetchQuote();

    return (
        <Card className="overflow-hidden bg-accent/20 border-accent">
            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                <div className="bg-secondary p-3 rounded-full">
                    <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                    <CardTitle>Daily Motivation</CardTitle>
                    <CardDescription>A little boost for your day.</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-lg font-medium text-foreground/90">&quot;{quoteData.quote}&quot;</p>
            </CardContent>
        </Card>
    );
}
