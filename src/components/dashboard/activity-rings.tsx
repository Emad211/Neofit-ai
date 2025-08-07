"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";

const Ring = ({
  progress,
  color,
  size,
  strokeWidth,
}: {
  progress: number;
  color: string;
  size: number;
  strokeWidth: number;
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
      {/* Background Circle */}
      <circle
        stroke="hsl(var(--muted))"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={center}
        cy={center}
      />
      {/* Progress Circle */}
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        r={radius}
        cx={center}
        cy={center}
        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
      />
    </svg>
  );
};

type ProgressData = {
    calories: { value: number; goal: number };
    protein: { value: number; goal: number };
    workout: { value: number; goal: number };
}

interface ActivityRingsProps {
    progress: ProgressData;
}


export function ActivityRings({ progress }: ActivityRingsProps) {
  const activityData = [
    { name: "Calories", ...progress.calories, color: "hsl(var(--chart-1))" },
    { name: "Protein", ...progress.protein, color: "hsl(var(--chart-2))" },
    { name: "Workout", ...progress.workout, color: "hsl(var(--chart-3))" },
  ];
  
  const baseSize = 180;
  const strokeWidth = 14;
  const ringGap = 2 * (strokeWidth + 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Today's Progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8 md:flex-row">
        <div className="relative flex items-center justify-center" style={{ width: baseSize, height: baseSize }}>
          {activityData.map((activity, index) => {
              const progressPercentage = (activity.value / activity.goal) * 100;
              const size = baseSize - (index * ringGap);
              return (
                <div key={activity.name} className="absolute inset-0 flex items-center justify-center">
                    <Ring
                        progress={progressPercentage}
                        color={activity.color}
                        size={size}
                        strokeWidth={strokeWidth}
                    />
                </div>
              );
            })}
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
