"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Ring = ({
  radius,
  stroke,
  progress,
  color,
  bgColor,
}: {
  radius: number;
  stroke: number;
  progress: number;
  color: string;
  bgColor: string;
}) => {
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <g>
      <circle
        stroke={bgColor}
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeDasharray={circumference + " " + circumference}
        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={radius}
        cy={radius}
        transform={`rotate(-90 ${radius} ${radius})`}
      />
    </g>
  );
};

const activityData = [
  { name: "Calories", value: 1800, goal: 2200, color: "hsl(var(--chart-1))" },
  { name: "Protein", value: 120, goal: 150, color: "hsl(var(--accent))" },
  { name: "Workout", value: 45, goal: 60, color: "hsl(var(--chart-2))" },
];

export function ActivityRings() {
  const size = 180;
  const strokeWidth = 14;
  const gap = 4;
  const totalStrokeWidthWithGap = strokeWidth + gap;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Today's Progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8 md:flex-row">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg
            height={size}
            width={size}
            viewBox={`0 0 ${size} ${size}`}
            className="absolute"
          >
            <g>
              {activityData.map((activity, index) => {
                const radius = size / 2 - index * totalStrokeWidthWithGap;
                const progress = (activity.value / activity.goal) * 100;
                return (
                  <Ring
                    key={activity.name}
                    radius={radius}
                    stroke={strokeWidth}
                    progress={progress}
                    color={activity.color}
                    bgColor="hsl(var(--muted))"
                  />
                );
              })}
            </g>
          </svg>
        </div>
        <div className="flex flex-1 justify-around w-full">
            {activityData.map(activity => (
                <div key={activity.name} className="text-center">
                    <p className="text-sm text-muted-foreground">{activity.name}</p>
                    <p className="text-2xl font-bold" style={{color: activity.color}}>{activity.value}</p>
                    <p className="text-xs text-muted-foreground">Goal: {activity.goal}</p>
                </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
