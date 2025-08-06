import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Apple, Dumbbell, Zap, GlassWater } from 'lucide-react';
import { DailyMotivationCard } from "./daily-motivation-card";

const feedItems = [
    {
        type: 'workout',
        icon: Dumbbell,
        title: 'Morning Workout: Full Body Strength',
        time: '7:00 AM',
        description: "You crushed it! 45 minutes of intense work.",
        image: 'https://placehold.co/600x400.png',
        dataAiHint: 'woman lifting weights',
    },
    {
        type: 'meal',
        icon: Apple,
        title: 'Breakfast: Protein Smoothie',
        time: '8:30 AM',
        description: '35g Protein, 450 Calories. A great start to your day.',
        image: 'https://placehold.co/600x400.png',
        dataAiHint: 'protein smoothie',
    },
    {
        type: 'hydration',
        icon: GlassWater,
        title: 'Water Reminder',
        time: '11:00 AM',
        description: 'Time to hydrate! Grab a glass of water to keep your energy levels up.',
    },
     {
        type: 'meal',
        icon: Apple,
        title: 'Lunch: Grilled Chicken Salad',
        time: '1:00 PM',
        description: '45g Protein, 550 Calories. Perfectly balanced.',
        image: 'https://placehold.co/600x400.png',
        dataAiHint: 'chicken salad',
    },
];

export function DailyFeed() {
    return (
        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Your Day</h2>
            <div className="space-y-6">
                <DailyMotivationCard />
                {feedItems.map((item, index) => (
                    <Card key={index} className="overflow-hidden">
                        {item.image && <Image src={item.image} alt={item.title} width={600} height={200} className="w-full h-32 object-cover" data-ai-hint={item.dataAiHint} />}
                        <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                            <div className="bg-secondary p-3 rounded-full">
                                <item.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <CardTitle>{item.title}</CardTitle>
                                <CardDescription>{item.time}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">{item.description}</p>
                        </CardContent>
                        {(item.type === 'meal' || item.type === 'workout') && (
                            <CardFooter>
                                <Button variant="secondary" size="sm">View Details</Button>
                            </CardFooter>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
