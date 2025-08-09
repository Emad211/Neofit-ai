
"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format, startOfWeek, parseISO } from "date-fns"
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
import { Skeleton } from "../ui/skeleton"

const chartConfig = {
  weight: {
    label: "Weight (kg)",
    color: "hsl(var(--chart-1))",
  },
}

export function WeightChart() {
  const { combinedLogs, isLoading } = useUserData();

  const chartData = React.useMemo(() => {
    const weightLogs = combinedLogs
        .filter(log => log.logType === 'weight')
        .map(log => ({
            ...log,
            date: parseISO(log.loggedAt)
        }));

    if (weightLogs.length < 2) return [];

    // Sort logs from oldest to newest for the chart
    const sortedLogs = weightLogs.sort((a, b) => a.date.getTime() - b.date.getTime());

    return sortedLogs.map(log => ({
      date: log.date,
      weight: log.weight,
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
        <CardTitle className="font-headline">Weight Trend</CardTitle>
        <CardDescription>Your weight changes over time based on your logs.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 1 ? (
            <ChartContainer config={chartConfig}>
            <AreaChart
                accessibilityLayer
                data={chartData}
                margin={{
                left: 12,
                right: 12,
                }}
            >
                <CartesianGrid vertical={false} />
                <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => format(new Date(value), "MMM d")}
                />
                <YAxis
                    domain={['dataMin - 2', 'dataMax + 2']}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickCount={6}
                    unit="kg"
                />
                <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                    indicator="dot" 
                    labelFormatter={(label, payload) => {
                        return `${format(new Date(payload[0].payload.date), "eeee, MMM d")}`
                    }}
                    formatter={(value) => `${value} kg`}
                />}
                />
                <Area
                dataKey="weight"
                type="natural"
                fill="var(--color-weight)"
                fillOpacity={0.4}
                stroke="var(--color-weight)"
                stackId="a"
                />
            </AreaChart>
            </ChartContainer>
        ) : (
             <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <h3 className="mt-4 text-lg font-medium">Not Enough Data</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Log your weight for at least two different days to see your trend.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
