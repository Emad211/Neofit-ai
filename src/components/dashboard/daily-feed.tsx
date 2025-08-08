// src/components/dashboard/daily-feed.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Apple, Dumbbell, Weight, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { DailyMotivationCard } from "./daily-motivation-card";
import { useUserData } from "@/context/user-profile-context";
import { format } from 'date-fns';
import { Skeleton } from "../ui/skeleton";
import type { CombinedLog } from "@/context/user-profile-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { LogEntrySheet } from "./log-entry-sheet";
import { useToast } from "@/hooks/use-toast";


const iconMapping = {
    meal: Apple,
    activity: Dumbbell,
    weight: Weight,
    workout: Dumbbell,
}

export function DailyFeed({ quote }: { quote: string }) {
    const { combinedLogs, isLoading, deleteLog } = useUserData();
    const { toast } = useToast();
    
    const [isSheetOpen, setIsSheetOpen] = React.useState(false);
    const [editableLog, setEditableLog] = React.useState<CombinedLog | null>(null);

    const handleEdit = (log: CombinedLog) => {
        setEditableLog(log);
        setIsSheetOpen(true);
    }
    
    const handleDelete = async (logId: string, logType: CombinedLog['logType']) => {
        try {
            await deleteLog(logId, logType);
            toast({
                title: "Log Deleted",
                description: "The entry has been successfully removed.",
            });
        } catch (error) {
            console.error("Failed to delete log:", error);
            toast({
                variant: 'destructive',
                title: "Deletion Failed",
                description: "There was a problem deleting the log. Please try again.",
            });
        }
    }
    

    const renderFeedItem = (item: CombinedLog) => {
        const Icon = iconMapping[item.logType as keyof typeof iconMapping] || Dumbbell;
        
        const itemDate = new Date(item.loggedAt);
        const timeString = format(itemDate, 'p');


        let title = '';
        let description = '';
        let image = null;
        let dataAiHint = null;

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
            case 'workout':
                title = `Workout: ${item.workoutName}`;
                description = `${item.durationMinutes} min · ${item.totalVolume} kg Volume`;
                image = 'https://placehold.co/600x400.png';
                dataAiHint = 'gym workout';
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
                    <AlertDialog>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                            </DropdownMenuContent>
                        </DropdownMenu>
                         <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this log entry.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(item.id!, item.logType)}>
                                Delete
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{description}</p>
                </CardContent>
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
            
            <LogEntrySheet
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                logType={editableLog?.logType ?? null}
                editableLog={editableLog}
                onClose={() => setEditableLog(null)}
            />
        </div>
    );
}
