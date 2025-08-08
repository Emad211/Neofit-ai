// src/components/dashboard/daily-feed.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Apple, Dumbbell, Weight } from 'lucide-react';
import { DailyMotivationCard } from "./daily-motivation-card";
import Link from "next/link";
import React from "react";
import { useUserData } from "@/context/user-profile-context";
import { format } from 'date-fns';
import { Skeleton } from "../ui/skeleton";


const iconMapping = {
    meal: Apple,
    activity: Dumbbell,
    weight: Weight
}

export function DailyFeed({ quote }: { quote: string }) {
    const { combinedLogs, isLoading, userProfile } = useUserData();
    
    const handleViewMealDetails = (mealId: string) => {
        // Placeholder for showing a meal details modal or bottom sheet
        console.log(`Viewing details for meal: ${mealId}`);
    }

    const renderFeedItem = (item: any) => {
        const Icon = iconMapping[item.logType as keyof typeof iconMapping] || Dumbbell;
        
        // Use user's timezone if available, otherwise default to local
        const itemDate = new Date(item.loggedAt);
        const timeString = format(itemDate, 'p', { 
            // In a real app, you might use a library like date-fns-tz for proper timezone formatting
            // For now, this will format according to the user's browser locale which is a good approximation
        });


        let title = '';
        let description = '';
        let image = null;
        let dataAiHint = null;
        let footer = null;

        switch (item.logType) {
            case 'activity':
                title = item.activityType;
                description = `${item.durationMinutes} min · ${item.caloriesBurned} kcal`;
                image = 'https://placehold.co/600x400.png';
                dataAiHint = item.activityType.toLowerCase().split(' ').slice(0,2).join(' ');
                break;
            case 'meal':
                title = `${item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1)}: ${item.description}`;
                description = `${item.calories} kcal`;
                image = 'https://placehold.co/600x400.png';
                dataAiHint = item.description.toLowerCase().split(' ').slice(0,2).join(' ');
                break;
            case 'weight':
                title = 'Weight Logged';
                description = `${item.weight} kg`;
                break;
        }

        return (
            <Card key={item.id} className="overflow-hidden animate-in fade-in-50">
                {image && <Image src={image} alt={title} width={600} height={200} className="w-full h-32 object-cover" data-ai-hint={dataAiHint || 'fitness'} />}
                <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className="bg-secondary p-3 rounded-full">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{timeString}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{description}</p>
                </CardContent>
                {footer && <CardFooter>{footer}</CardFooter>}
            </Card>
        )
    }

    const renderSkeleton = () => (
        <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
             {[...Array(2)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <Skeleton className="w-full h-32" />
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                           <Skeleton className="h-5 w-3/4" />
                           <Skeleton className="h-4 w-1/4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-4 w-full" />
                    </CardContent>
                </Card>
             ))}
        </div>
    )

    return (
        <div>
            <h2 className="text-2xl font-bold font-headline mb-4">Your Day</h2>
            <div className="space-y-6">
                <DailyMotivationCard quote={quote} />
                {isLoading ? renderSkeleton() : (
                    combinedLogs.length > 0 ? (
                        combinedLogs.map(renderFeedItem)
                    ) : (
                         <Card className="text-center p-8">
                            <p className="text-muted-foreground">You haven't logged anything yet today.</p>
                            <p className="text-sm text-muted-foreground mt-1">Use the '+' button to add a meal, activity, or weight.</p>
                        </Card>
                    )
                )}
            </div>
        </div>
    );
}
