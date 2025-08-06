"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Ring = ({
  radius,
  stroke,
  progress,
  color,
}: {
  radius: number;
  stroke: number;
  progress: number;
  color: string;
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <circle
      stroke={color}
      fill="transparent"
      strokeWidth={stroke}
      strokeDasharray={circumference + " " + circumference}
      style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-out' }}
      r={normalizedRadius}
      cx={radius}
      cy={radius}
      transform={`rotate(-90 ${radius} ${radius})`}
    />
  );
};

const activityData = [
  { name: "Calories", value: 1800, goal: 2200, color: "hsl(var(--primary))" },
  { name: "Protein", value: 120, goal: 150, color: "hsl(var(--accent))" },
  { name: "Workout", value: 45, goal: 60, color: "hsl(var(--chart-2))" },
];

export function ActivityRings() {
  const size = 180;
  const strokeWidth = 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Today's Progress</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8 md:flex-row">
        <div className="relative">
          <svg
            height={size}
            width={size}
            viewBox={`0 0 ${size} ${size}`}
          >
            <g>
              <Ring
                radius={size / 2}
                stroke={strokeWidth}
                progress={ (activityData[0].value / activityData[0].goal) * 100 }
                color={activityData[0].color}
              />
               <Ring
                radius={size / 2 - strokeWidth - 4}
                stroke={strokeWidth}
                progress={ (activityData[1].value / activityData[1].goal) * 100 }
                color={activityData[1].color}
              />
               <Ring
                radius={size / 2 - (strokeWidth+4)*2}
                stroke={strokeWidth}
                progress={ (activityData[2].value / activityData[2].goal) * 100 }
                color={activityData[2].color}
              />
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
