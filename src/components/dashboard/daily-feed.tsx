// src/components/dashboard/daily-feed.tsx
"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Apple, Dumbbell, Weight, MoreVertical, Edit, Trash2, Flame, Clock, LineChart } from 'lucide-react';
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

// Use theme-based colors for better consistency
const iconMapping: { [key in CombinedLog['logType']]: { icon: React.ElementType, color: string, style: React.CSSProperties } } = {
    meal: { icon: Apple, color: 'var(--chart-1)', style: { '--bg-color': 'hsl(var(--chart-1))', '--text-color': 'hsl(var(--chart-1))' } as React.CSSProperties },
    activity: { icon: Flame, color: 'var(--chart-2)', style: { '--bg-color': 'hsl(var(--chart-2))', '--text-color': 'hsl(var(--chart-2))' } as React.CSSProperties },
    weight: { icon: LineChart, color: 'var(--chart-3)', style: { '--bg-color': 'hsl(var(--chart-3))', '--text-color': 'hsl(var(--chart-3))' } as React.CSSProperties },
    workout: { icon: Dumbbell, color: 'var(--chart-4)', style: { '--bg-color': 'hsl(var(--chart-4))', '--text-color': 'hsl(var(--chart-4))' } as React.CSSProperties },
};

const Stat = ({ icon, value, label }: { icon: React.ReactNode, value: string | number, label: string }) => (
    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-secondary/50 text-center">
        <div className="text-primary mb-1">{icon}</div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
);


export function DailyFeed({ quote, logs }: { quote: string, logs: CombinedLog[] }) {
    const { isLoading, deleteLog } = useUserData();
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
        const config = iconMapping[item.logType];
        const Icon = config.icon;
        
        const itemDate = new Date(item.loggedAt);
        const timeString = format(itemDate, 'p');

        let title = '';
        switch (item.logType) {
            case 'activity': title = item.activityType; break;
            case 'meal': title = item.description; break;
            case 'weight': title = 'Weight Logged'; break;
            case 'workout': title = `Workout: ${item.workoutName}`; break;
        }

        return (
            <Card key={item.id} style={config.style} className={`overflow-hidden animate-in fade-in-50 border-[var(--bg-color)]/20`}>
                <CardHeader className={`flex flex-row items-start gap-4 space-y-0 p-4 bg-[var(--bg-color)]/10`}>
                    <div className={`p-2 rounded-full bg-background/50`}>
                        <Icon className={`h-6 w-6 text-[var(--text-color)]`} />
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-base font-bold">{title}</CardTitle>
                        <CardDescription className={`text-[var(--text-color)] font-semibold`}>{timeString}</CardDescription>
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
                            <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
                            >
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
                <CardContent className="p-4">
                     {item.logType === 'meal' && (
                        <Stat icon={<Flame className="h-6 w-6"/>} value={item.calories} label="kcal" />
                     )}
                     {item.logType === 'activity' && (
                        <div className="grid grid-cols-2 gap-4">
                            <Stat icon={<Clock className="h-6 w-6"/>} value={`${item.durationMinutes} min`} label="Duration" />
                            <Stat icon={<Flame className="h-6 w-6"/>} value={item.caloriesBurned} label="kcal Burned" />
                        </div>
                     )}
                     {item.logType === 'weight' && (
                         <Stat icon={<Weight className="h-6 w-6"/>} value={`${item.weight} kg`} label="Current Weight" />
                     )}
                      {item.logType === 'workout' && (
                        <div className="grid grid-cols-3 gap-4">
                            <Stat icon={<Clock className="h-6 w-6"/>} value={`${item.durationMinutes} min`} label="Duration" />
                            <Stat icon={<Dumbbell className="h-6 w-6"/>} value={item.totalVolume} label="kg Volume" />
                            <Stat icon={<Flame className="h-6 w-6"/>} value="~350" label="kcal Burned" />
                        </div>
                     )}
                </CardContent>
            </Card>
        )
    }

    const renderSkeleton = () => (
        <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
             {[...Array(2)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0 p-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                           <Skeleton className="h-5 w-3/4" />
                           <Skeleton className="h-4 w-1/4" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <Skeleton className="h-16 w-full" />
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
                    logs.length > 0 ? (
                        logs.map(renderFeedItem)
                    ) : (
                         <Card className="text-center p-8 border-dashed">
                            <h3 className="text-lg font-semibold">Nothing Logged Yet</h3>
                            <p className="text-muted-foreground mt-1">
                                Use the <span className="font-bold text-primary">+</span> button to add a meal, activity, or your weight.
                            </p>
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
