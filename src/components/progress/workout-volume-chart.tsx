
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useUserData } from "@/context/user-profile-context"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { format, startOfWeek, parseISO } from 'date-fns'
import { Skeleton } from "../ui/skeleton"

const chartConfig = {
  volume: {
    label: "Volume (kg)",
    color: "hsl(var(--chart-2))",
  },
}

export function WorkoutVolumeChart() {
    const { combinedLogs, isLoading } = useUserData();

    const chartData = React.useMemo(() => {
        const workoutLogs = combinedLogs.filter(log => log.logType === 'workout');

        if (workoutLogs.length === 0) return [];

        const weeklyVolumes: { [weekStart: string]: number } = {};

        workoutLogs.forEach(log => {
            const date = parseISO(log.loggedAt);
            const weekStartDate = startOfWeek(date, { weekStartsOn: 1 }); // Monday
            const weekStartString = format(weekStartDate, 'yyyy-MM-dd');
            
            if (!weeklyVolumes[weekStartString]) {
                weeklyVolumes[weekStartString] = 0;
            }
            weeklyVolumes[weekStartString] += log.totalVolume;
        });

        const sortedWeeks = Object.keys(weeklyVolumes).sort();

        return sortedWeeks.map(weekStart => ({
            week: `Week of ${format(parseISO(weekStart), 'MMM d')}`,
            volume: Math.round(weeklyVolumes[weekStart]),
        }));

    }, [combinedLogs]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        )
    }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Workout Volume</CardTitle>
        <CardDescription>Total weight lifted per week, based on your completed workouts.</CardDescription>
      </CardHeader>
      <CardContent>
         {chartData.length > 0 ? (
            <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="week"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.split(' ')[2]}
                />
                 <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickCount={5}
                    unit="kg"
                />
                <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                    indicator="dot"
                    formatter={(value, name, props) => [`${value} kg`, 'Total Volume']}
                />}
                />
                <Bar dataKey="volume" fill="var(--color-volume)" radius={4} />
            </BarChart>
            </ChartContainer>
         ) : (
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <h3 className="mt-4 text-lg font-medium">No Workout Data</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Complete and log a workout to see your volume tracked here.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
