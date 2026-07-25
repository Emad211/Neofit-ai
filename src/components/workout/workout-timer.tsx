'use client';

import * as React from 'react';
import { Pause, Play, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/provider';

export function WorkoutTimer({
  duration,
  onComplete,
  exerciseName,
}: {
  duration: number;
  onComplete: () => void;
  exerciseName?: string;
}) {
  const safeDuration = Math.max(1, Math.round(duration));
  const [timeLeft, setTimeLeft] = React.useState(safeDuration);
  const [isPaused, setIsPaused] = React.useState(false);
  const completedRef = React.useRef(false);
  const { locale } = useI18n();
  const label = (en: string, fa: string) => locale === 'fa' ? fa : en;

  React.useEffect(() => {
    setTimeLeft(safeDuration);
    setIsPaused(false);
    completedRef.current = false;
  }, [safeDuration]);

  React.useEffect(() => {
    if (timeLeft > 0 || completedRef.current) return;
    completedRef.current = true;
    navigator.vibrate?.([400, 100, 400]);
    onComplete();
  }, [onComplete, timeLeft]);

  React.useEffect(() => {
    if (isPaused || timeLeft <= 0) return;
    const timeout = window.setTimeout(() => {
      setTimeLeft((current) => Math.max(0, current - 1));
    }, 1_000);
    return () => window.clearTimeout(timeout);
  }, [isPaused, timeLeft]);

  React.useEffect(() => {
    if ([1, 2, 3].includes(timeLeft)) navigator.vibrate?.(150);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = Math.min(100, Math.max(0, (safeDuration - timeLeft) / safeDuration * 100));
  const completeNow = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gray-950 p-4 text-white">
      <div className="mb-8 text-center">
        <p className="text-lg text-gray-400">{label('Rest', 'استراحت')}</p>
        {exerciseName && <p className="text-xl font-bold text-primary">{exerciseName}</p>}
      </div>

      <div className="relative flex h-64 w-64 items-center justify-center" role="timer" aria-live="polite" aria-label={label(`${timeLeft} seconds remaining`, `${timeLeft} ثانیه باقی مانده`)}>
        <svg className="absolute h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <circle className="stroke-gray-800" strokeWidth="8" cx="50" cy="50" r="45" fill="transparent" />
          <circle
            className="stroke-primary"
            strokeWidth="8"
            cx="50"
            cy="50"
            r="45"
            fill="transparent"
            strokeDasharray="282.743"
            strokeDashoffset={282.743 - progress / 100 * 282.743}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <span className="z-10 text-6xl font-bold tabular-nums">
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>

      <div className="mt-12 flex items-center gap-4">
        <Button variant="secondary" className="h-16 min-w-32 text-lg" onClick={completeNow}>
          <SkipForward className="me-2 rtl:rotate-180" aria-hidden="true" />{label('Skip', 'ردکردن')}
        </Button>
        <Button className="h-16 min-w-32 text-lg" onClick={() => setIsPaused((value) => !value)}>
          {isPaused ? <Play className="me-2" aria-hidden="true" /> : <Pause className="me-2" aria-hidden="true" />}
          {isPaused ? label('Resume', 'ادامه') : label('Pause', 'توقف')}
        </Button>
      </div>
    </div>
  );
}
