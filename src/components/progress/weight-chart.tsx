"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

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
import { format } from "date-fns"

const chartData = [
  { date: new Date("2023-10-01"), weight: 186 },
  { date: new Date("2023-10-08"), weight: 184.5 },
  { date: new Date("2023-10-15"), weight: 183 },
  { date: new Date("2023-10-22"), weight: 182.5 },
  { date: new Date("2023-10-29"), weight: 181 },
  { date: new Date("2023-11-05"), weight: 180 },
  { date: new Date("2023-11-12"), weight: 179 },
]

const chartConfig = {
  weight: {
    label: "Weight (lbs)",
    color: "hsl(var(--chart-1))",
  },
}

export function WeightChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Weight Trend</CardTitle>
        <CardDescription>Your weight changes over the last 6 weeks.</CardDescription>
      </CardHeader>
      <CardContent>
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
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                indicator="dot" 
                labelFormatter={(label, payload) => {
                    return `${format(new Date(payload[0].payload.date), "eeee, MMM d")}`
                }}
                formatter={(value) => `${value} lbs`}
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
      </CardContent>
    </Card>
  )
}
