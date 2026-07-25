'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/i18n/provider';

function Ring({ progress, color, size, strokeWidth, label }: {
  progress: number;
  color: string;
  size: number;
  strokeWidth: number;
  label: string;
}) {
  const normalized = Number.isFinite(progress) ? Math.min(100, Math.max(0, progress)) : 0;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalized / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 transform" role="img" aria-label={`${label}: ${Math.round(normalized)}%`}>
      <circle stroke="hsl(var(--muted))" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={center} cy={center} />
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
}

type ProgressData = {
  calories: { value: number; goal: number };
  protein: { value: number; goal: number };
  workout: { value: number; goal: number };
};

export function ActivityRings({ progress }: { progress: ProgressData }) {
  const { locale, t } = useI18n();
  const activityData = [
    { name: t('today.calories'), unit: locale === 'fa' ? 'کیلوکالری' : 'kcal', ...progress.calories, color: 'hsl(var(--chart-1))' },
    { name: t('today.protein'), unit: locale === 'fa' ? 'گرم' : 'g', ...progress.protein, color: 'hsl(var(--chart-2))' },
    { name: t('today.workoutMinutes'), unit: locale === 'fa' ? 'دقیقه' : 'min', ...progress.workout, color: 'hsl(var(--chart-3))' },
  ];
  const baseSize = 180;
  const strokeWidth = 14;
  const ringGap = 2 * (strokeWidth + 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">{locale === 'fa' ? 'پیشرفت امروز' : "Today's progress"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8 md:flex-row">
        <div className="relative flex items-center justify-center" style={{ width: baseSize, height: baseSize }}>
          {activityData.map((activity, index) => (
            <div key={activity.name} className="absolute inset-0 flex items-center justify-center">
              <Ring
                progress={activity.goal > 0 ? activity.value / activity.goal * 100 : 0}
                color={activity.color}
                size={baseSize - index * ringGap}
                strokeWidth={strokeWidth}
                label={activity.name}
              />
            </div>
          ))}
        </div>
        <div className="grid w-full flex-1 grid-cols-3 gap-2">
          {activityData.map((activity) => (
            <div key={activity.name} className="text-center">
              <p className="text-sm text-muted-foreground">{activity.name}</p>
              <p className="text-2xl font-bold" style={{ color: activity.color }}>{activity.value}</p>
              <p className="text-xs text-muted-foreground">
                {activity.goal > 0
                  ? (locale === 'fa' ? `هدف: ${activity.goal} ${activity.unit}` : `Goal: ${activity.goal} ${activity.unit}`)
                  : (locale === 'fa' ? 'هدف تعیین نشده' : 'No target yet')}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
