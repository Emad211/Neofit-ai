"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

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

const chartData = [
  { week: "Week 1", volume: 186 },
  { week: "Week 2", volume: 305 },
  { week: "Week 3", volume: 237 },
  { week: "Week 4", volume: 273 },
  { week: "Week 5", volume: 209 },
  { week: "Week 6", volume: 214 },
]

const chartConfig = {
  volume: {
    label: "Volume (lbs)",
    color: "hsl(var(--chart-2))",
  },
}

export function WorkoutVolumeChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Workout Volume</CardTitle>
        <CardDescription>Total weight lifted per week.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="volume" fill="var(--color-volume)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
